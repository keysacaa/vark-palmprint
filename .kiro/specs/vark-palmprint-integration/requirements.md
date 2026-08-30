# Requirements Document

## Introduction

Fitur VARK Palmprint Integration menghubungkan frontend React/Vite/TypeScript (hasil export Figma) dengan backend Flask yang memuat model MobileNetV2 untuk mengklasifikasikan gaya belajar VARK dari citra telapak tangan. Integrasi mencakup: (1) backend Flask baru dengan endpoint `POST /api/predict`, (2) modifikasi logika minimal pada `App.tsx` untuk mengganti prototype `setTimeout` dengan API call nyata, dan (3) penampilan hasil prediksi nyata (label, confidence, distribusi probabilitas) di `ResultPage` — tanpa mengubah desain visual frontend sama sekali.

---

## Glossary

- **Backend**: Aplikasi Flask Python yang berjalan di `http://127.0.0.1:5000`, bertanggung jawab atas inferensi model.
- **Frontend**: Aplikasi React/Vite/TypeScript yang berjalan di `http://127.0.0.1:5173` atau `http://localhost:5173`.
- **Preprocessor**: Fungsi `preprocess_image()` dalam `preprocessing.py` yang mengubah file gambar menjadi tensor siap inferensi.
- **Model**: Model MobileNetV2 Keras (`mobilenetv2_best.keras`) yang dimuat satu kali saat Flask startup.
- **PredictionResult**: Struktur data yang berisi `predicted_class`, `predicted_label`, `confidence`, dan `probabilities` dari satu prediksi.
- **CLASS_NAMES**: Urutan tetap `["A", "K", "R", "V"]` yang memetakan indeks softmax ke label kelas — `0=A`, `1=K`, `2=R`, `3=V`.
- **UploadState**: State mesin frontend dengan nilai `"empty"`, `"selected"`, `"loading"`, atau `"error"`.
- **ResultPage**: Komponen halaman React yang merender hasil prediksi kepada pengguna.
- **UploadPage**: Komponen halaman React tempat pengguna mengunggah citra telapak tangan.
- **VARK_STYLES**: Konstanta frontend yang mendefinisikan metadata tampilan untuk keempat kelas (V, A, R, K).

---

## Requirements

### Requirement 1: Model Startup dan Singleton

**User Story:** As a system operator, I want the MobileNetV2 model to be loaded once at application startup, so that each prediction request is served without per-request loading overhead.

#### Acceptance Criteria

1. WHEN the Flask application starts, THE Backend SHALL load the MobileNetV2 model from `Backend/model/mobilenetv2_best.keras` exactly once before the HTTP server begins accepting requests.
2. WHILE the Flask application is running, THE Backend SHALL reuse the same in-memory model instance for all prediction requests without reloading from disk.
3. IF the model file does not exist or cannot be read at Flask startup, THEN THE Backend SHALL terminate with an error message that includes the attempted file path and the reason for failure, and SHALL exit with a non-zero exit code before accepting any requests.

---

### Requirement 2: Prediction Endpoint Contract

**User Story:** As a developer integrating the frontend, I want a single POST /api/predict endpoint, so that the frontend can send an image and receive a structured VARK prediction response.

#### Acceptance Criteria

1. THE Backend SHALL expose a `POST /api/predict` endpoint that accepts `multipart/form-data` requests with an image file in a field named `"file"`.
2. WHEN a `multipart/form-data` request is received with a `"file"` field containing a JPEG, PNG, or WebP image, THE Backend SHALL return HTTP 200 with a JSON body containing `predicted_class`, `predicted_label`, `confidence`, and `probabilities`.
3. WHEN THE Backend returns HTTP 200, THE `predicted_class` field SHALL contain exactly one value from the set `{"A", "K", "R", "V"}` corresponding to the index of the maximum value in the softmax output, using the fixed mapping `0=A, 1=K, 2=R, 3=V`.
4. WHEN THE Backend returns HTTP 200, THE `predicted_label` field SHALL contain exactly one value from the set `{"Auditory", "Kinesthetic", "Read/Write", "Visual"}` corresponding to the `predicted_class`.
5. WHEN THE Backend returns HTTP 200, THE `probabilities` object SHALL contain float values in the range `[0.0, 1.0]` for keys `"A"`, `"K"`, `"R"`, and `"V"`, where the sum of all four values is within ±1e-4 of 1.0.
6. WHEN THE Backend returns HTTP 200, THE `confidence` field SHALL equal `max(probabilities.A, probabilities.K, probabilities.R, probabilities.V)`.
7. IF the `"file"` field is absent from the request, THEN THE Backend SHALL return HTTP 400 with a JSON body containing an `"error"` string field.
8. IF the request contains a `"file"` field with an empty filename, THEN THE Backend SHALL return HTTP 400 with a JSON body containing an `"error"` string field.
9. IF an exception occurs during image preprocessing, THEN THE Backend SHALL return HTTP 400 with a JSON body containing an `"error"` string field and SHALL NOT include a Python traceback in the response.
10. IF an exception occurs during model inference, THEN THE Backend SHALL return HTTP 500 with a JSON body containing an `"error"` string field and SHALL NOT include a Python traceback in the response.

---

### Requirement 3: Image Preprocessing Pipeline

**User Story:** As a machine learning engineer, I want a deterministic image preprocessing function, so that any valid input image is consistently transformed into the exact tensor shape and value range the model expects.

#### Acceptance Criteria

1. WHEN `preprocess_image` is called with a valid file path to a JPEG, PNG, or WebP image of any dimensions, THE Preprocessor SHALL return a numpy array with shape `(1, 224, 224, 3)`.
2. WHEN `preprocess_image` is called with a valid file path, THE Preprocessor SHALL return a numpy array with dtype `float32`.
3. WHEN `preprocess_image` is called with a valid file path, THE Preprocessor SHALL return a numpy array where every element is in the closed range `[0.0, 1.0]`, with a maximum value no greater than 1.0 and a minimum value no less than 0.0.
4. WHEN `preprocess_image` is called with a valid file path to an image that has more or fewer than 3 channels (e.g., grayscale or RGBA), THE Preprocessor SHALL convert the image to RGB with exactly 3 channels before constructing the output array.
5. IF `preprocess_image` is called with a path to a file that PIL cannot open as an image (corrupt, empty, or wrong format), THEN THE Preprocessor SHALL raise an exception and SHALL NOT return a partially constructed array.

---

### Requirement 4: Temporary File Lifecycle

**User Story:** As a system operator, I want uploaded temporary files to always be deleted after each request, so that disk usage does not accumulate over time regardless of prediction success or failure.

#### Acceptance Criteria

1. WHEN the Backend receives a `POST /api/predict` request, THE Backend SHALL save the uploaded file to the `uploads/` directory using a filename that is a server-generated UUID independent of any client-supplied filename.
2. WHEN a prediction request completes successfully, THE Backend SHALL delete the temporary file from `uploads/` before returning the HTTP 200 response.
3. IF an exception occurs at any point after the temporary file is saved, THEN THE Backend SHALL delete the temporary file from `uploads/` before returning the error response.
4. IF the temporary file was never saved (e.g., the save step itself failed), THEN THE Backend SHALL proceed with the error response without attempting a file deletion and SHALL NOT produce a secondary error due to the absent file.

---

### Requirement 5: Security and CORS Configuration

**User Story:** As a security-conscious developer, I want the backend to enforce strict origin and file constraints, so that the API is not exposed to unauthorized origins or malicious payloads.

#### Acceptance Criteria

1. WHEN the Backend receives a request with an `Origin` header of `http://127.0.0.1:5173` or `http://localhost:5173`, THE Backend SHALL include the appropriate CORS response headers permitting the request.
2. WHEN the Backend receives a request with an `Origin` header that is not `http://127.0.0.1:5173` or `http://localhost:5173`, THE Backend SHALL NOT include permissive CORS response headers for that origin.
3. THE Backend SHALL set `MAX_CONTENT_LENGTH` to 10 MB (10 × 1024 × 1024 bytes), and WHEN a request body exceeds this limit, THE Backend SHALL return HTTP 413 without processing the request body.
4. WHEN the Backend processes the `"file"` field of a `POST /api/predict` request, THE Backend SHALL attempt to open the file content using `PIL.Image.open()` to verify it is a readable image, and SHALL NOT rely solely on the filename extension for this validation.
5. IF `PIL.Image.open()` raises an exception on the uploaded file content, THEN THE Backend SHALL return HTTP 400 with a JSON body containing an `"error"` string field.

---

### Requirement 6: Frontend File Validation

**User Story:** As a user uploading a palmprint image, I want the frontend to validate my selected file before sending it to the backend, so that I receive immediate feedback if the file format or size is not supported.

#### Acceptance Criteria

1. WHEN a user selects or drops a file of type `image/jpeg`, `image/png`, or `image/webp` with size ≤ 10 MB, THE Frontend SHALL accept the file, generate a preview URL, and transition `uploadState` to `"selected"`.
2. WHEN a user selects or drops a file, IF the file's MIME type is not `image/jpeg`, `image/png`, or `image/webp`, THEN THE Frontend SHALL reject the file, transition `uploadState` to `"error"`, and display an error message indicating which MIME types are accepted.
3. WHEN a user selects or drops a file whose MIME type is `image/jpeg`, `image/png`, or `image/webp`, IF the file size exceeds 10 MB, THEN THE Frontend SHALL reject the file, transition `uploadState` to `"error"`, and display an error message indicating the 10 MB maximum size limit.
4. WHILE `uploadState` is `"selected"`, THE Frontend SHALL retain the accepted `File` object in state.
5. WHEN a user selects or drops a new file while `uploadState` is `"selected"` or `"error"`, THE Frontend SHALL discard the previously stored `File` object and preview URL before applying validation to the new file.

---

### Requirement 7: Frontend Prediction Flow and State Machine

**User Story:** As a user initiating a prediction, I want the frontend to manage loading, success, and error states correctly, so that I always see an appropriate UI state and never get stuck on a loading screen.

#### Acceptance Criteria

1. WHEN the user activates the prediction action with a valid selected file (JPEG, PNG, or WebP of size ≤ 10 MB), THE Frontend SHALL transition `uploadState` to `"loading"` synchronously before the asynchronous API request is initiated.
2. WHEN THE Frontend transitions to `"loading"`, THE Frontend SHALL construct a `FormData` object with the field `"file"` set to the stored `File` object and issue a `POST` request to `http://127.0.0.1:5000/api/predict`.
3. WHEN the API returns HTTP 200 with a response body that is a JSON object containing a non-empty `predicted_class` string field, THE Frontend SHALL store the full response object as `predictionResult` and then navigate to the result page.
4. IF the API returns an HTTP response with a status code that is not in the 200–299 range, THEN THE Frontend SHALL transition `uploadState` to `"error"` and display the `error` field from the response JSON as the error message.
5. IF the fetch call raises a network-level exception (e.g., connection refused, DNS failure, or timeout), THEN THE Frontend SHALL transition `uploadState` to `"error"` and display a user-readable message that does not contain a JavaScript stack trace or internal exception detail.
6. THE prediction action button SHALL be disabled while `uploadState` is `"loading"` to prevent concurrent duplicate submissions.
7. THE `uploadState` SHALL never remain permanently in `"loading"` — every code path in `handlePredict` SHALL terminate in either a transition to `"error"` or a navigation to the result page within 30 seconds of the request being initiated.

---

### Requirement 8: Result Page Display

**User Story:** As a user receiving a prediction result, I want the ResultPage to display the predicted VARK class, label, confidence, and full probability distribution, so that I can understand both the primary classification and the model's certainty.

#### Acceptance Criteria

1. WHEN `ResultPage` renders with a non-null `predictionResult`, THE ResultPage SHALL display exactly one of the labels `"Visual"`, `"Auditory"`, `"Read/Write"`, or `"Kinesthetic"` corresponding to `predictionResult.predicted_label`.
2. WHEN `ResultPage` renders with a non-null `predictionResult`, THE ResultPage SHALL display exactly one of the characters `"V"`, `"A"`, `"R"`, or `"K"` corresponding to `predictionResult.predicted_class`, rendered with a distinct color that differs from the colors used for the other three classes.
3. WHEN `ResultPage` renders with a non-null `predictionResult`, THE ResultPage SHALL display the confidence value as a percentage rounded to one decimal place (e.g., a confidence of 0.874 is displayed as `"87.4%"`).
4. WHEN `ResultPage` renders with a non-null `predictionResult`, THE ResultPage SHALL render exactly four probability bars — one per VARK class — where each bar's rendered width is proportional to its probability value and each bar is accompanied by its class character and its probability displayed as a percentage rounded to one decimal place.
5. IF `predictionResult` is null when `ResultPage` renders, THEN THE ResultPage SHALL render its layout with empty or placeholder states for all prediction-dependent fields and SHALL NOT throw a runtime error.
6. WHEN `ResultPage` renders with a non-null `predictionResult`, THE `predictionResult` object SHALL be treated as conforming to the shape `{ predicted_class: "A" | "K" | "R" | "V", predicted_label: string, confidence: number (0.0–1.0), probabilities: { A: number, K: number, R: number, V: number } }`, and THE ResultPage SHALL access only these fields.

---

### Requirement 9: No Visual Design Changes to Frontend

**User Story:** As a designer, I want the frontend's visual appearance to remain exactly as exported from Figma, so that the integration work does not alter any existing UI design decisions.

#### Acceptance Criteria

1. THE Frontend SHALL introduce no changes to CSS classes, Tailwind utilities, component layout, color tokens, typography, spacing, or icon usage in any file other than `App.tsx` and `ResultPage`; within those two files, only the following change types are permitted: new TypeScript type/interface declarations, new `useState` hook declarations, replacement of the `handlePredict` function body, and new JSX elements that render `predictionResult` fields.
2. THE Frontend SHALL add the `PredictionResult` interface, `predictionResult` state, `selectedFile` state, and the updated `handlePredict` function to `App.tsx` without changing the element types, element order, CSS classes, or rendered children of any JSX in `HomePage`, `UploadPage`, or the shared `Header`, `Footer`, and `SectionLabel` components; passing a new prop to `ResultPage` does not constitute a JSX structure change in those components.
