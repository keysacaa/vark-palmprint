"""
preprocessing.py — Image preprocessing pipeline for VARK palmprint classification.

Transforms an image file into a tensor ready for MobileNetV2 inference.
Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5
"""

import numpy as np
from PIL import Image


def preprocess_image(image_path: str) -> np.ndarray:
    """
    Load and preprocess an image file into a model-ready tensor.

    Pipeline:
        1. Open the image with PIL.
        2. Convert to RGB (handles grayscale, RGBA, palette-mode, etc.).
        3. Resize to (224, 224) — the MobileNetV2 input size.
        4. Cast to float32 numpy array, shape (224, 224, 3).
        5. Normalize pixel values to [0.0, 1.0] by dividing by 255.0.
        6. Add a batch dimension → shape (1, 224, 224, 3).

    Args:
        image_path: Absolute or relative path to a JPEG, PNG, or WebP image file.

    Returns:
        numpy.ndarray with shape (1, 224, 224, 3), dtype float32,
        and all values in the closed range [0.0, 1.0].

    Raises:
        Any exception raised by PIL (e.g., FileNotFoundError, PIL.UnidentifiedImageError
        for corrupt or unrecognized files) is intentionally not caught here and will
        propagate to the caller (the Flask endpoint handles them).
    """
    # Step 1 & 2: Open and ensure exactly 3 RGB channels.
    img: Image.Image = Image.open(image_path).convert("RGB")

    # Step 3: Resize to the model's expected spatial dimensions.
    img = img.resize((224, 224))

    # Step 4: Convert to float32 numpy array → shape (224, 224, 3).
    arr: np.ndarray = np.array(img, dtype=np.float32)

    # Step 5: Normalize to [0.0, 1.0].
    arr = arr / 255.0

    # Step 6: Insert batch dimension → shape (1, 224, 224, 3).
    arr = np.expand_dims(arr, axis=0)

    return arr
