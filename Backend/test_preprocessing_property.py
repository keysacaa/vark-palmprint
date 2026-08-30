"""
test_preprocessing_property.py — Property-based tests for preprocess_image().

Property 6: Preprocessing Output Invariant
Validates: Requirements 3.1, 3.2, 3.3

For any valid image file (JPEG, PNG, or WebP) of any dimensions that PIL can open,
preprocess_image() SHALL return a numpy array with:
  - shape  == (1, 224, 224, 3)
  - dtype  == float32
  - max()  <= 1.0
  - min()  >= 0.0
"""

import io
import os
import sys
import tempfile

import numpy as np
import pytest
from hypothesis import given, settings, strategies as st
from PIL import Image

# Ensure the Backend directory is on sys.path so we can import preprocessing
sys.path.insert(0, os.path.dirname(__file__))

from preprocessing import preprocess_image  # noqa: E402


# ---------------------------------------------------------------------------
# Helper: build an in-memory synthetic image and save it to a temp file.
# Returns the temp file path.  The caller is responsible for cleanup.
# ---------------------------------------------------------------------------

def _save_synthetic_image(width: int, height: int, mode: str = "RGB") -> str:
    """Create a synthetic PIL image and write it to a named temp file (JPEG).

    Uses a NamedTemporaryFile with delete=False so the path remains accessible
    after the file is closed — required on Windows.
    """
    # Build random pixel data appropriate for the requested mode
    if mode == "RGB":
        data = np.random.randint(0, 256, (height, width, 3), dtype=np.uint8)
    elif mode == "L":
        data = np.random.randint(0, 256, (height, width), dtype=np.uint8)
    elif mode == "RGBA":
        data = np.random.randint(0, 256, (height, width, 4), dtype=np.uint8)
    else:
        raise ValueError(f"Unsupported mode: {mode}")

    img = Image.fromarray(data, mode=mode)

    # Write to a temp file — JPEG works for all three modes after conversion
    # (PIL will raise if we try to save RGBA directly as JPEG, so convert first)
    save_img = img.convert("RGB") if mode == "RGBA" else img

    with tempfile.NamedTemporaryFile(suffix=".jpg", delete=False) as tmp:
        tmp_path = tmp.name

    save_img.save(tmp_path, format="JPEG")
    return tmp_path


# ---------------------------------------------------------------------------
# Property 6 — RGB images (primary case)
# ---------------------------------------------------------------------------

@given(
    width=st.integers(min_value=1, max_value=4000),
    height=st.integers(min_value=1, max_value=4000),
)
@settings(max_examples=50, deadline=None)
def test_preprocess_output_invariant_rgb(width: int, height: int) -> None:
    """**Property 6: Preprocessing Output Invariant** — RGB images.

    **Validates: Requirements 3.1, 3.2, 3.3**

    For any RGB image of any dimensions, preprocess_image() must return a
    numpy array with shape (1, 224, 224, 3), dtype float32, max <= 1.0,
    and min >= 0.0.
    """
    tmp_path = _save_synthetic_image(width, height, mode="RGB")
    try:
        result = preprocess_image(tmp_path)

        # Requirement 3.1 — shape invariant
        assert result.shape == (1, 224, 224, 3), (
            f"Expected shape (1, 224, 224, 3), got {result.shape} "
            f"for input {width}×{height} RGB image"
        )

        # Requirement 3.2 — dtype invariant
        assert result.dtype == np.float32, (
            f"Expected dtype float32, got {result.dtype}"
        )

        # Requirement 3.3 — value range invariant
        assert result.max() <= 1.0, (
            f"Max value {result.max()} exceeds 1.0"
        )
        assert result.min() >= 0.0, (
            f"Min value {result.min()} is below 0.0"
        )
    finally:
        os.unlink(tmp_path)


# ---------------------------------------------------------------------------
# Property 6 — Grayscale images (mode "L", channel conversion edge case)
# ---------------------------------------------------------------------------

@given(
    width=st.integers(min_value=1, max_value=4000),
    height=st.integers(min_value=1, max_value=4000),
)
@settings(max_examples=50, deadline=None)
def test_preprocess_output_invariant_grayscale(width: int, height: int) -> None:
    """**Property 6: Preprocessing Output Invariant** — Grayscale images.

    **Validates: Requirements 3.1, 3.2, 3.3**

    preprocess_image() must convert a 1-channel (grayscale) image to RGB and
    still satisfy all four postconditions.
    """
    # Grayscale images cannot be saved as JPEG directly without conversion —
    # PIL handles this transparently, but we use PNG to preserve the "L" mode
    # as written to disk and let preprocess_image()'s convert("RGB") do the work.
    data = np.random.randint(0, 256, (height, width), dtype=np.uint8)
    img = Image.fromarray(data, mode="L")

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp_path = tmp.name
    img.save(tmp_path, format="PNG")

    try:
        result = preprocess_image(tmp_path)

        assert result.shape == (1, 224, 224, 3), (
            f"Expected shape (1, 224, 224, 3), got {result.shape} "
            f"for {width}×{height} grayscale image"
        )
        assert result.dtype == np.float32
        assert result.max() <= 1.0
        assert result.min() >= 0.0
    finally:
        os.unlink(tmp_path)


# ---------------------------------------------------------------------------
# Property 6 — RGBA images (mode "RGBA", channel conversion edge case)
# ---------------------------------------------------------------------------

@given(
    width=st.integers(min_value=1, max_value=4000),
    height=st.integers(min_value=1, max_value=4000),
)
@settings(max_examples=50, deadline=None)
def test_preprocess_output_invariant_rgba(width: int, height: int) -> None:
    """**Property 6: Preprocessing Output Invariant** — RGBA images.

    **Validates: Requirements 3.1, 3.2, 3.3**

    preprocess_image() must convert a 4-channel (RGBA) image to RGB and
    still satisfy all four postconditions.
    """
    data = np.random.randint(0, 256, (height, width, 4), dtype=np.uint8)
    img = Image.fromarray(data, mode="RGBA")

    # Save as PNG to preserve the alpha channel on disk
    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        tmp_path = tmp.name
    img.save(tmp_path, format="PNG")

    try:
        result = preprocess_image(tmp_path)

        assert result.shape == (1, 224, 224, 3), (
            f"Expected shape (1, 224, 224, 3), got {result.shape} "
            f"for {width}×{height} RGBA image"
        )
        assert result.dtype == np.float32
        assert result.max() <= 1.0
        assert result.min() >= 0.0
    finally:
        os.unlink(tmp_path)
