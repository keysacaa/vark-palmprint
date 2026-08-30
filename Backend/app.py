"""
app.py — Flask backend untuk VARK Palmprint Classification.

Memuat model MobileNetV2 sekali saat startup, mengonfigurasi CORS,
dan menyiapkan folder uploads sementara.

Requirements: 1.1, 1.2, 1.3, 5.1, 5.2, 5.3
"""

import os
import sys
from uuid import uuid4

import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS
from PIL import Image

from preprocessing import preprocess_image

# ---------------------------------------------------------------------------
# Konstanta kelas — urutan HARUS sesuai indeks softmax: 0=A, 1=K, 2=R, 3=V
# ---------------------------------------------------------------------------
CLASS_NAMES = ["A", "K", "R", "V"]
CLASS_LABELS = {
    "A": "Auditory",
    "K": "Kinesthetic",
    "R": "Read/Write",
    "V": "Visual",
}

# ---------------------------------------------------------------------------
# Inisialisasi Flask
# ---------------------------------------------------------------------------
app = Flask(__name__)

# Batasi ukuran upload ke 10 MB (Requirement 5.3)
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024

# Konfigurasi CORS — hanya izinkan dari origin frontend dev server
# (Requirement 5.1, 5.2)
CORS(app, origins=["http://127.0.0.1:5173", "http://localhost:5173"])

# ---------------------------------------------------------------------------
# Folder uploads — dibuat otomatis jika belum ada
# ---------------------------------------------------------------------------
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ---------------------------------------------------------------------------
# Load model — dilakukan SEKALI saat startup, sebelum server menerima request
# (Requirement 1.1, 1.2, 1.3)
# ---------------------------------------------------------------------------
_MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "mobilenetv2_best.keras")

try:
    import tensorflow as tf  # noqa: E402 — import di sini agar error startup jelas
    model = tf.keras.models.load_model(_MODEL_PATH)
    print(f"[INFO] Model berhasil dimuat dari: {_MODEL_PATH}")
except Exception as _exc:
    print(f"[ERROR] Gagal memuat model dari '{_MODEL_PATH}': {_exc}", file=sys.stderr)
    sys.exit(1)

# ---------------------------------------------------------------------------
# Endpoint POST /api/predict
# Requirements: 2.1–2.10, 4.1–4.4, 5.4, 5.5
# ---------------------------------------------------------------------------

@app.route("/api/predict", methods=["POST"])
def predict():
    # --- Validation (before saving file) ---

    # 1. Check that the "file" field exists in the request
    if "file" not in request.files:
        return jsonify({"error": "Field 'file' tidak ditemukan dalam request"}), 400

    file = request.files["file"]

    # 2. Check that a file was actually selected (non-empty filename)
    if file.filename == "":
        return jsonify({"error": "Tidak ada file yang diunggah"}), 400

    # --- File saving ---
    # 3. Generate a UUID-based filename with the original extension (lowercased)
    _, ext = os.path.splitext(file.filename)
    filename = str(uuid4()) + ext.lower()

    # 4. Save to UPLOAD_FOLDER
    file_path = os.path.join(UPLOAD_FOLDER, filename)
    file.save(file_path)

    # --- Inference ---
    try:
        # 5. Verify the file is a readable image via PIL; verify() consumes the
        #    file pointer so preprocessing opens the file fresh from file_path.
        try:
            Image.open(file_path).verify()
        except Exception:
            return jsonify({"error": "File bukan gambar yang valid atau rusak"}), 400

        # 6. Preprocess — opens the file fresh from disk
        tensor = preprocess_image(file_path)

        # 7. Run inference (verbose=0 suppresses TensorFlow progress output)
        predictions = model.predict(tensor, verbose=0)

        # 8. Extract per-class probabilities
        probs = predictions[0]  # [p_A, p_K, p_R, p_V]

        # 9. Determine winning class index
        predicted_index = int(np.argmax(probs))

        # 10. Map index → class symbol
        predicted_class = CLASS_NAMES[predicted_index]

        # 11. Map class symbol → human-readable label
        predicted_label = CLASS_LABELS[predicted_class]

        # 12. Confidence = probability of the winning class
        confidence = float(probs[predicted_index])

        # 13. Full probability distribution
        probabilities = {
            "A": float(probs[0]),
            "K": float(probs[1]),
            "R": float(probs[2]),
            "V": float(probs[3]),
        }

        # 14. Return HTTP 200 with all four fields
        return jsonify({
            "predicted_class": predicted_class,
            "predicted_label": predicted_label,
            "confidence": confidence,
            "probabilities": probabilities,
        }), 200

    except Exception:
        # Model inference exception → HTTP 500 (no traceback exposed)
        return jsonify({"error": "Prediksi gagal. Coba unggah ulang gambar."}), 500

    finally:
        # Always delete the temp file if it was saved
        if os.path.exists(file_path):
            os.remove(file_path)


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)
