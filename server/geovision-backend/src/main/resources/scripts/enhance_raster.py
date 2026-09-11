#!/usr/bin/env python3
"""
GeoVision-SR Image Enhancement Pipeline
Performs satellite raster enhancement using OpenCV:
1. Dynamic Range Normalization (Percentile Min-Max Stretch)
2. Contrast Enhancement (CLAHE)
3. Noise Reduction (Bilateral Filter - Edge Preserving)
4. Sharpening (Unsharp Masking)
"""

import sys
import os
import argparse
import time
import json
import numpy as np

try:
    import cv2
except ImportError:
    print(json.dumps({
        "status": "ERROR",
        "error": "OpenCV (cv2) is not installed in the Python environment. Run: pip install opencv-python-headless numpy"
    }), file=sys.stderr)
    sys.exit(1)


def normalize_raster(img: np.ndarray) -> np.ndarray:
    """
    Step 1: Normalization
    Performs robust 2nd-to-98th percentile dynamic range stretch to uint8 (0-255).
    """
    if img.dtype == np.uint8:
        return img

    img_float = img.astype(np.float32)
    p2 = np.percentile(img_float, 2)
    p98 = np.percentile(img_float, 98)

    if p98 > p2:
        stretched = np.clip((img_float - p2) / (p98 - p2) * 255.0, 0, 255)
    else:
        min_val = np.min(img_float)
        max_val = np.max(img_float)
        if max_val > min_val:
            stretched = (img_float - min_val) / (max_val - min_val) * 255.0
        else:
            stretched = img_float

    return stretched.astype(np.uint8)


def enhance_contrast(img: np.ndarray) -> np.ndarray:
    """
    Step 2: Contrast Enhancement
    Applies CLAHE (Contrast Limited Adaptive Histogram Equalization).
    """
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))

    if len(img.shape) == 2:
        # Single-channel grayscale / individual spectral band
        return clahe.apply(img)
    elif len(img.shape) == 3 and img.shape[2] == 3:
        # 3-channel RGB: convert to LAB and apply CLAHE to Luminance channel
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        cl = clahe.apply(l)
        merged_lab = cv2.merge((cl, a, b))
        return cv2.cvtColor(merged_lab, cv2.COLOR_LAB2BGR)
    elif len(img.shape) == 3:
        # Multi-band (e.g. 4-band RGB + NIR): process channels individually
        channels = cv2.split(img)
        enhanced_channels = [clahe.apply(ch) for ch in channels]
        return cv2.merge(enhanced_channels)

    return img


def reduce_noise(img: np.ndarray) -> np.ndarray:
    """
    Step 3: Noise Reduction
    Applies Bilateral Filter to smooth noise while preserving sharp boundaries and geospatial edges.
    """
    if len(img.shape) == 2 or (len(img.shape) == 3 and img.shape[2] <= 3):
        return cv2.bilateralFilter(img, d=5, sigmaColor=40, sigmaSpace=40)
    elif len(img.shape) == 3:
        # Multi-band: filter each channel
        channels = cv2.split(img)
        filtered_channels = [cv2.bilateralFilter(ch, d=5, sigmaColor=40, sigmaSpace=40) for ch in channels]
        return cv2.merge(filtered_channels)
    return img


def sharpen_image(img: np.ndarray) -> np.ndarray:
    """
    Step 4: Sharpening
    Applies Unsharp Masking to boost high-frequency features (roads, parcel boundaries, rooftop edges).
    """
    # Gaussian blur for high-frequency isolation
    gaussian = cv2.GaussianBlur(img, (0, 0), sigmaX=2.0)
    # Unsharp mask formula: sharpened = 1.5 * original - 0.5 * blurred
    sharpened = cv2.addWeighted(img, 1.5, gaussian, -0.5, 0)
    return sharpened


def main():
    parser = argparse.ArgumentParser(description="GeoVision-SR Image Enhancement Pipeline")
    parser.add_argument("--input", required=True, help="Path to input raw TIFF/geospatial raster")
    parser.add_argument("--output", required=True, help="Path to destination enhanced TIFF")
    args = parser.parse_args()

    start_time = time.time()

    if not os.path.isfile(args.input):
        result = {
            "status": "ERROR",
            "error": f"Input file does not exist: {args.input}"
        }
        print(json.dumps(result), file=sys.stderr)
        sys.exit(1)

    # Ensure output directory exists
    os.makedirs(os.path.dirname(os.path.abspath(args.output)), exist_ok=True)

    # Load raw image
    img = cv2.imread(args.input, cv2.IMREAD_UNCHANGED)
    if img is None:
        # Fallback for synthetic/plain buffers
        try:
            from PIL import Image
            pil_img = Image.open(args.input)
            img = np.array(pil_img)
        except Exception:
            pass

    if img is None:
        result = {
            "status": "ERROR",
            "error": f"Could not decode image raster from: {args.input}"
        }
        print(json.dumps(result), file=sys.stderr)
        sys.exit(1)

    height = int(img.shape[0])
    width = int(img.shape[1])
    channels = int(img.shape[2]) if len(img.shape) > 2 else 1

    # Execute 4-stage pipeline
    step1_norm = normalize_raster(img)
    step2_contrast = enhance_contrast(step1_norm)
    step3_denoised = reduce_noise(step2_contrast)
    step4_sharpened = sharpen_image(step3_denoised)

    # Save enhanced output TIFF
    cv2.imwrite(args.output, step4_sharpened)

    # Generate web-displayable JPEG previews for Before/After comparison
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(args.output)))
    previews_dir = os.path.join(base_dir, "previews")
    os.makedirs(previews_dir, exist_ok=True)
    
    out_stem = os.path.splitext(os.path.basename(args.output))[0]
    raw_preview_path = os.path.join(previews_dir, f"preview_raw_{out_stem}.jpg")
    enhanced_preview_path = os.path.join(previews_dir, f"preview_enhanced_{out_stem}.jpg")

    def to_bgr_preview(arr):
        if len(arr.shape) == 2:
            return cv2.cvtColor(arr, cv2.COLOR_GRAY2BGR)
        elif len(arr.shape) == 3 and arr.shape[2] >= 3:
            return arr[:, :, :3]
        return arr

    try:
        cv2.imwrite(raw_preview_path, to_bgr_preview(step1_norm), [cv2.IMWRITE_JPEG_QUALITY, 92])
        cv2.imwrite(enhanced_preview_path, to_bgr_preview(step4_sharpened), [cv2.IMWRITE_JPEG_QUALITY, 92])
    except Exception as e:
        raw_preview_path = None
        enhanced_preview_path = None

    elapsed_ms = round((time.time() - start_time) * 1000, 2)

    result = {
        "status": "SUCCESS",
        "inputPath": os.path.abspath(args.input),
        "outputPath": os.path.abspath(args.output),
        "rawPreviewPath": os.path.abspath(raw_preview_path) if raw_preview_path else None,
        "enhancedPreviewPath": os.path.abspath(enhanced_preview_path) if enhanced_preview_path else None,
        "width": width,
        "height": height,
        "channels": channels,
        "processingTimeMs": elapsed_ms,
        "pipeline": [
            "Dynamic Range Normalization (Percentile Min-Max)",
            "Contrast Limited Adaptive Histogram Equalization (CLAHE)",
            "Bilateral Edge-Preserving Noise Reduction",
            "Unsharp Masking High-Pass Detail Enhancement"
        ]
    }

    print(json.dumps(result))
    sys.exit(0)


if __name__ == "__main__":
    main()
