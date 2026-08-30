# Implementation Plan: VARK Palmprint Integration

## Overview

Implementasi menghubungkan frontend React/Vite/TypeScript dengan backend Flask + MobileNetV2.
Terdiri dari dua bagian paralel: (1) membangun seluruh backend Flask dari nol, dan (2) memodifikasi `App.tsx` dan `ResultPage` secara minimal agar konsumsi API nyata dan hasilnya tampil di UI — tanpa mengubah desain visual.

---

## Tasks

- [x] 1. Siapkan struktur backend dan file dependensi
  - [x] 1.1 Buat file `Backend/requirements.txt` dengan semua dependensi Python yang dipin versinya
    - Sertakan: `flask`, `flask-cors`, `tensorflow==2.20.0`, `pillow`, `numpy`, `hypothesis`
    - _Requirements: 1.1, 5.3_

  - [x] 1.2 Buat direktori `Backend/uploads/` dengan file `.gitkeep` agar folder masuk ke version control
    - Folder ini digunakan sebagai tempat penyimpanan sementara file yang diunggah
    - _Requirements: 4.1_

- [ ] 2. Implementasi preprocessing pipeline (`Backend/preprocessing.py`)
  - [x] 2.1 Buat file `Backend/preprocessing.py` dengan fungsi `preprocess_image(image_path: str) -> np.ndarray`
    - Implementasikan pipeline: `PIL.Image.open` → `.convert("RGB")` → `.resize((224, 224))` → `np.array(dtype=float32)` → `/ 255.0` → `np.expand_dims(axis=0)`
    - Pastikan postcondition: shape `(1, 224, 224, 3)`, dtype `float32`, semua nilai dalam `[0.0, 1.0]`
    - Jangan tangkap exception PIL — biarkan memanggil stacknya (backend yang tangkap)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 2.2 Tulis property test untuk `preprocess_image` — Property 6: Preprocessing Output Invariant
    - **Property 6: Preprocessing Output Invariant**
    - **Validates: Requirements 3.1, 3.2, 3.3**
    - Gunakan `hypothesis` dengan strategi `st.integers(1, 4000)` untuk lebar dan tinggi gambar acak
    - Verifikasi `result.shape == (1, 224, 224, 3)`, `result.dtype == np.float32`, `result.max() <= 1.0`, `result.min() >= 0.0`

  - [x] 2.3 Tulis unit test untuk `preprocess_image` (contoh spesifik dan edge case)
    - Test gambar grayscale (1-channel) → harus dikonversi ke RGB
    - Test gambar RGBA (4-channel) → harus dikonversi ke RGB
    - Test PIL exception saat path tidak valid → harus raise, bukan return array
    - _Requirements: 3.4, 3.5_

- [x] 3. Implementasi Flask application (`Backend/app.py`)
  - [x] 3.1 Buat file `Backend/app.py` — inisialisasi Flask, konfigurasi CORS, load model sekali saat startup
    - Buat Flask app, konfigurasikan `flask-cors` dengan `origins=["http://127.0.0.1:5173", "http://localhost:5173"]`
    - Set `app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024`
    - Load model dari `Backend/model/mobilenetv2_best.keras` ke variabel global sebelum server mulai melayani request; jika gagal, cetak error dengan path dan alasan lalu exit dengan kode non-zero
    - Definisikan konstanta `CLASS_NAMES = ["A", "K", "R", "V"]` dan `CLASS_LABELS = {"A": "Auditory", "K": "Kinesthetic", "R": "Read/Write", "V": "Visual"}`
    - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2, 5.3_

  - [x] 3.2 Implementasi endpoint `POST /api/predict` di `Backend/app.py`
    - Validasi keberadaan field `"file"` → HTTP 400 jika tidak ada
    - Validasi nama file tidak kosong → HTTP 400 jika kosong
    - Simpan file ke `uploads/` dengan nama `uuid4() + ext` (bukan dari client)
    - Panggil `preprocess_image()`, jalankan `model.predict()`, hitung `argmax`, bangun response JSON
    - Implementasikan `try/except/finally`: selalu hapus file temp di `finally`; preprocessing error → HTTP 400; inference error → HTTP 500
    - Verifikasi PIL via `PIL.Image.open()` di backend (bukan hanya ekstensi) sebelum preprocess
    - Pastikan response error tidak mengandung Python traceback
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 4.1, 4.2, 4.3, 4.4, 5.4, 5.5_

  - [ ] 2.4 Tulis property test untuk endpoint `/api/predict` — Property 1, 2, 3, 5, 7
    - **Property 1: Class Mapping Invariant** — `predicted_class ∈ {"A","K","R","V"}` untuk semua gambar valid
    - **Property 2: Probability Sum** — `A + K + R + V` dalam ±1e-4 dari 1.0 untuk semua gambar valid
    - **Property 3: Confidence Consistency** — `confidence == max(probabilities.values())` untuk semua respons HTTP 200
    - **Property 5: File Cleanup Guarantee** — file di `uploads/` terhapus setelah setiap request (sukses maupun error)
    - **Property 7: Model Singleton** — instance model sama untuk setiap request dalam satu proses Flask
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5, 4.2, 4.3, 1.1, 1.2**
    - Gunakan `hypothesis` dengan gambar sintetis (numpy array acak berbagai ukuran)

- [x] 4. Checkpoint — Pastikan backend berfungsi sebelum modifikasi frontend
  - Pastikan semua test backend lulus, ask the user if questions arise.

- [ ] 5. Implementasi modifikasi frontend di `App.tsx`
  - [-] 5.1 Tambahkan interface `PredictionResult` dan state baru di `App.tsx`
    - Tambahkan interface TypeScript:
      ```typescript
      interface PredictionResult {
        predicted_class: "A" | "K" | "R" | "V";
        predicted_label: string;
        confidence: number;
        probabilities: { A: number; K: number; R: number; V: number };
      }
      ```
    - Tambahkan `const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);`
    - Tambahkan `const [selectedFile, setSelectedFile] = useState<File | null>(null);`
    - Jangan ubah JSX yang sudah ada, layout, CSS classes, atau komponen lain
    - _Requirements: 7.3, 9.1, 9.2_

  - [ ] 5.2 Update `handleFileSelect` untuk menyimpan objek `File` asli ke state `selectedFile`
    - Tambahkan `setSelectedFile(file)` di dalam `handleFileSelect` setelah `validateFile(file)` berhasil
    - Pastikan `selectedFile` juga di-reset ke `null` di `handleReset` (atau fungsi reset yang ada)
    - Jangan ubah logika validasi, preview FileReader, atau state `uploadState`
    - _Requirements: 6.4, 6.5, 9.1_

  - [ ] 5.3 Ganti isi `handlePredict` dengan implementasi API call nyata
    - Hapus `setTimeout` prototype dan ganti seluruh body `handlePredict` dengan:
      - `setUploadState("loading")` secara sinkron
      - Buat `FormData`, append `selectedFile` ke field `"file"`
      - `fetch("http://127.0.0.1:5000/api/predict", { method: "POST", body: formData })`
      - On success (res.ok): `setPredictionResult(data)` → `setPage("result")`
      - On HTTP error: `setUploadState("error")` + `setErrorMessage(data.error ?? "...")`
      - On network exception: `setUploadState("error")` + pesan user-readable (tanpa stack trace)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [ ] 5.4 Update JSX render `ResultPage` di `App()` untuk meneruskan prop `predictionResult`
    - Ubah bagian `{page === "result" && <ResultPage ... />}` untuk menambahkan prop `predictionResult={predictionResult}`
    - Tidak ada perubahan lain pada JSX di `App()`, `HomePage`, `UploadPage`, `Header`, `Footer`, atau `SectionLabel`
    - _Requirements: 8.6, 9.2_

  - [ ] 5.5 Tulis property test untuk `handlePredict` — Property 4: Loading State Completeness
    - **Property 4: Loading State Completeness**
    - **Validates: Requirements 7.1, 7.6, 7.7**
    - Gunakan `hypothesis` (atau jest + fast-check) untuk mensimulasikan berbagai respons server (200, 4xx, 5xx, network error)
    - Verifikasi bahwa `uploadState` tidak pernah tetap di `"loading"` setelah semua code path selesai

- [ ] 6. Implementasi modifikasi `ResultPage` untuk menampilkan data prediksi nyata
  - [ ] 6.1 Update signature komponen `ResultPage` untuk menerima prop `predictionResult`
    - Tambahkan `predictionResult: PredictionResult | null` ke props interface `ResultPage`
    - Jika `predictionResult` null, render placeholder/kosong untuk semua field yang bergantung pada data — jangan throw error
    - _Requirements: 8.5, 8.6, 9.1_

  - [ ] 6.2 Render `predicted_class` badge dan `predicted_label` dari `predictionResult`
    - Tampilkan `predictionResult.predicted_class` dengan warna sesuai `VARK_STYLES` (lookup berdasarkan `key`)
    - Tampilkan `predictionResult.predicted_label` di field "Gaya Belajar"
    - Tampilkan `predictionResult.predicted_class` di field "Kategori VARK"
    - Gunakan `VARK_STYLES` yang sudah ada — jangan tambahkan warna atau class baru
    - _Requirements: 8.1, 8.2, 9.1_

  - [ ] 6.3 Render `confidence` sebagai persentase dengan satu desimal
    - Tampilkan `(predictionResult.confidence * 100).toFixed(1) + "%"` di field "Confidence"
    - _Requirements: 8.3_

  - [ ] 6.4 Render empat probability bars untuk distribusi VARK
    - Iterasi `VARK_STYLES` dan untuk tiap style render bar dengan lebar `probabilities[style.key] * 100 + "%"`
    - Tampilkan label kelas dan persentase probabilitas di setiap bar dengan `.toFixed(1)`
    - _Requirements: 8.4_

  - [ ] 6.5 Tulis unit test untuk `ResultPage` — contoh spesifik dan null safety
    - Test dengan `predictionResult` valid → semua field terender dengan format yang benar
    - Test dengan `predictionResult = null` → tidak ada runtime error, placeholder terender
    - Test format confidence: `0.874` → `"87.4%"`, `1.0` → `"100.0%"`, `0.0` → `"0.0%"`
    - Test width bar probabilitas: `0.5` → `"50%"`, `1.0` → `"100%"`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 7. Implementasi test suite backend (`Backend/test_backend.py`)
  - [ ] 7.1 Buat file `Backend/test_backend.py` dengan test otomatis menggunakan gambar sintetis
    - Implementasikan semua test dari tabel Testing Strategy: `test_model_loads`, `test_preprocess_output_shape`, `test_preprocess_dtype`, `test_preprocess_value_range`, `test_predict_synthetic_image`, `test_missing_file_field`, `test_invalid_format`
    - Buat folder `Backend/test_images/` untuk menyimpan gambar sintetis yang dihasilkan saat test
    - Gunakan `pytest` sebagai test runner
    - _Requirements: 1.1, 2.1, 2.2, 2.7, 2.8, 3.1, 3.2, 3.3_

- [ ] 8. Final checkpoint — Pastikan semua test lulus dan integrasi end-to-end berfungsi
  - Pastikan semua test backend (`Backend/test_backend.py`) lulus, ask the user if questions arise.

---

## Notes

- Task bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirement spesifik untuk keterlacakan
- Backend dibuat seluruhnya dari nol; frontend hanya modifikasi minimal pada `App.tsx` dan `ResultPage`
- **Urutan kritis**: Task 2.1 (preprocessing) harus selesai sebelum Task 3.2 (endpoint) karena endpoint memanggil `preprocess_image()`
- **Jangan modifikasi** file frontend selain `App.tsx` — tidak ada perubahan pada CSS, komponen lain, atau konfigurasi Vite
- Model path wajib: `Backend/model/mobilenetv2_best.keras` (sudah ada di repo)
- CORS hanya untuk `http://127.0.0.1:5173` dan `http://localhost:5173`
- Property test menggunakan `hypothesis` (Python) untuk backend; untuk frontend gunakan `fast-check` jika sudah tersedia
- Checkpoint task dan parent task tanpa notasi desimal tidak masuk dependency graph

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.1"] },
    { "id": 3, "tasks": ["3.2"] },
    { "id": 4, "tasks": ["2.4", "7.1"] },
    { "id": 5, "tasks": ["5.1"] },
    { "id": 6, "tasks": ["5.2", "5.3"] },
    { "id": 7, "tasks": ["5.4", "5.5"] },
    { "id": 8, "tasks": ["6.1"] },
    { "id": 9, "tasks": ["6.2", "6.3", "6.4"] },
    { "id": 10, "tasks": ["6.5"] }
  ]
}
```
