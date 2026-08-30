"""
test_preprocessing_unit.py — Unit tests for preprocess_image().

Tests verifikasi spesifik dan edge case untuk fungsi preprocessing citra.
Validates: Requirements 3.4, 3.5

Run with:
    pytest test_preprocessing_unit.py -v
"""

import os
import tempfile

import numpy as np
import pytest
from PIL import Image

from preprocessing import preprocess_image


# ---------------------------------------------------------------------------
# Helper: buat file gambar sementara di disk, yield path-nya, lalu hapus.
# ---------------------------------------------------------------------------

def _save_temp_image(img: Image.Image, suffix: str = ".png") -> str:
    """Simpan PIL Image ke file sementara dan kembalikan path-nya."""
    fd, path = tempfile.mkstemp(suffix=suffix)
    os.close(fd)
    img.save(path)
    return path


# ---------------------------------------------------------------------------
# Test 1 — Gambar grayscale (mode "L", 1-channel) harus dikonversi ke RGB
# Validates: Requirement 3.4
# ---------------------------------------------------------------------------

def test_grayscale_image_converted_to_rgb():
    """
    Gambar mode 'L' (grayscale, 1 channel) harus dikonversi ke RGB secara
    otomatis. Output tetap shape (1, 224, 224, 3) dengan dtype float32.
    """
    # Buat gambar grayscale 100×100 dengan variasi nilai pixel
    gray_img = Image.new("L", (100, 100), color=128)
    path = _save_temp_image(gray_img, suffix=".png")
    try:
        result = preprocess_image(path)

        assert result.shape == (1, 224, 224, 3), (
            f"Shape salah untuk gambar grayscale: {result.shape}"
        )
        assert result.dtype == np.float32, (
            f"Dtype salah: {result.dtype}"
        )
        assert result.min() >= 0.0 and result.max() <= 1.0, (
            f"Nilai di luar [0,1]: min={result.min()}, max={result.max()}"
        )
    finally:
        os.remove(path)


# ---------------------------------------------------------------------------
# Test 2 — Gambar RGBA (4-channel) harus dikonversi ke RGB
# Validates: Requirement 3.4
# ---------------------------------------------------------------------------

def test_rgba_image_converted_to_rgb():
    """
    Gambar mode 'RGBA' (4 channel, termasuk alpha) harus dikonversi ke RGB.
    Output tetap shape (1, 224, 224, 3) — channel alpha dibuang.
    """
    # Buat gambar RGBA 200×150 dengan warna semi-transparan
    rgba_img = Image.new("RGBA", (200, 150), color=(255, 128, 0, 180))
    path = _save_temp_image(rgba_img, suffix=".png")
    try:
        result = preprocess_image(path)

        assert result.shape == (1, 224, 224, 3), (
            f"Shape salah untuk gambar RGBA: {result.shape}"
        )
        assert result.dtype == np.float32, (
            f"Dtype salah: {result.dtype}"
        )
        assert result.min() >= 0.0 and result.max() <= 1.0, (
            f"Nilai di luar [0,1]: min={result.min()}, max={result.max()}"
        )
    finally:
        os.remove(path)


# ---------------------------------------------------------------------------
# Test 3 — Path tidak valid harus raise exception, BUKAN return array
# Validates: Requirement 3.5
# ---------------------------------------------------------------------------

def test_invalid_path_raises_exception():
    """
    Jika path menunjuk ke file yang tidak ada, preprocess_image harus
    raise exception (FileNotFoundError atau turunannya). Fungsi TIDAK boleh
    mengembalikan array secara diam-diam.
    """
    invalid_path = "/path/yang/tidak/ada/sama_sekali_12345.png"
    with pytest.raises(Exception):
        preprocess_image(invalid_path)


def test_corrupt_file_raises_exception():
    """
    Jika file ada tapi bukan gambar valid (corrupt/kosong), preprocess_image
    harus raise exception dan tidak mengembalikan array parsial.
    Validates: Requirement 3.5
    """
    fd, path = tempfile.mkstemp(suffix=".png")
    try:
        # Tulis data bukan-gambar (bytes acak, bukan PNG valid)
        os.write(fd, b"ini bukan data gambar sama sekali!!!")
        os.close(fd)

        with pytest.raises(Exception):
            preprocess_image(path)
    finally:
        if os.path.exists(path):
            os.remove(path)


# ---------------------------------------------------------------------------
# Test 4 (bonus) — Gambar RGB normal 640×480
# Validates: Requirements 3.1, 3.2, 3.3
# ---------------------------------------------------------------------------

def test_rgb_image_shape_dtype_and_value_range():
    """
    Gambar RGB biasa (640×480) harus menghasilkan:
    - shape  : (1, 224, 224, 3)
    - dtype  : float32
    - range  : semua nilai dalam [0.0, 1.0]

    Juga memverifikasi bahwa normalisasi benar: pixel 255 → 1.0, pixel 0 → 0.0.
    """
    # Buat gambar RGB 640×480 dengan gradasi warna (bukan solid satu warna)
    # agar range nilai tidak trivial.
    rgb_img = Image.new("RGB", (640, 480))
    pixels = rgb_img.load()
    for x in range(640):
        for y in range(480):
            pixels[x, y] = (x % 256, y % 256, (x + y) % 256)

    path = _save_temp_image(rgb_img, suffix=".png")
    try:
        result = preprocess_image(path)

        # Shape
        assert result.shape == (1, 224, 224, 3), (
            f"Shape salah: {result.shape}"
        )

        # Dtype
        assert result.dtype == np.float32, (
            f"Dtype salah: {result.dtype}"
        )

        # Value range
        assert result.min() >= 0.0, (
            f"Nilai minimum di bawah 0.0: {result.min()}"
        )
        assert result.max() <= 1.0, (
            f"Nilai maksimum di atas 1.0: {result.max()}"
        )

        # Sanity check: gambar ini memiliki variasi warna sehingga
        # nilai tidak seharusnya semuanya sama.
        assert result.max() > result.min(), (
            "Gambar seharusnya memiliki variasi nilai pixel."
        )
    finally:
        os.remove(path)


# ---------------------------------------------------------------------------
# Test tambahan — Verifikasi normalisasi nilai pixel
# ---------------------------------------------------------------------------

def test_pixel_normalization_is_correct():
    """
    Pixel putih murni (255, 255, 255) harus menjadi 1.0 setelah normalisasi.
    Pixel hitam murni (0, 0, 0) harus menjadi 0.0.
    """
    white_img = Image.new("RGB", (50, 50), color=(255, 255, 255))
    path = _save_temp_image(white_img, suffix=".png")
    try:
        result = preprocess_image(path)
        assert np.allclose(result, 1.0), (
            f"Gambar putih seharusnya semua 1.0, max={result.max()}"
        )
    finally:
        os.remove(path)

    black_img = Image.new("RGB", (50, 50), color=(0, 0, 0))
    path = _save_temp_image(black_img, suffix=".png")
    try:
        result = preprocess_image(path)
        assert np.allclose(result, 0.0), (
            f"Gambar hitam seharusnya semua 0.0, min={result.min()}"
        )
    finally:
        os.remove(path)
