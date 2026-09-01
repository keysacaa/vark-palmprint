---
title: VARK Palmprint Backend
emoji: 🖐
colorFrom: red
colorTo: pink
sdk: docker
pinned: false
---

# VARK Palmprint Backend

Flask API untuk klasifikasi gaya belajar VARK berdasarkan citra telapak tangan menggunakan MobileNetV2.

## Endpoint

`POST /api/predict` — kirim form-data dengan field `file` berisi citra telapak tangan (JPEG/PNG/WebP, maks. 10 MB).

### Response

```json
{
  "predicted_class": "A",
  "predicted_label": "Auditory",
  "confidence": 0.888,
  "probabilities": {
    "A": 0.888,
    "K": 0.048,
    "R": 0.010,
    "V": 0.053
  }
}
```
