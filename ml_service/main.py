from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import torch
from PIL import Image, ImageDraw, ImageFont, ImageEnhance
import io
import base64
import logging
import platform
import pathlib
import os
from datetime import datetime
from collections import Counter

# Fix for loading models trained on Linux/Mac in Windows
if platform.system() == 'Windows':
    pathlib.PosixPath = pathlib.WindowsPath

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="WasteVision API", description="Identify recyclable, biodegradable, and hazardous waste from images.")

app.add_middleware(
   CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)

TEMP_STORAGE_DIR = "temporary_storage"
os.makedirs(TEMP_STORAGE_DIR, exist_ok=True)

# Model path (YOLOv5 local weights)
MODEL_PATH_DEFAULT = "models/yolov5s.pt"

logger.info("Loading YOLOv5 model...")

# Load default YOLOv5 model
try:
    if os.path.exists(MODEL_PATH_DEFAULT):
        # Load local YOLOv5 weights to avoid network dependency
        model_default = torch.hub.load('ultralytics/yolov5', 'custom', MODEL_PATH_DEFAULT, force_reload=False)
        logger.info("✓ YOLOv5 model loaded successfully (local weights)")
    else:
        # Fallback to pretrained yolov5s from torch hub
        model_default = torch.hub.load('ultralytics/yolov5', 'yolov5s', pretrained=True)
        logger.warning("Local weights not found; loaded pretrained yolov5s from Torch Hub")
except Exception as e:
    logger.error(f"Failed to load YOLOv5 model: {str(e)}")
    raise

# Detection configuration - OPTIMIZED FOR CAMERA CAPTURES
CONF_THRESHOLD = 0.25  # Increased to reduce false positives
IOU_THRESHOLD = 0.35   # Increased to reduce overlapping boxes
MAX_DETECTIONS = 100   # Reasonable limit for performance

# Image preprocessing configuration
ENABLE_PREPROCESSING = True  # Set to False to disable preprocessing
MAX_IMAGE_SIZE = 1280  # Maximum dimension for image processing
CONTRAST_FACTOR = 1.2  # Increase contrast (1.0 = no change)
SHARPNESS_FACTOR = 1.3  # Increase sharpness (1.0 = no change)
BRIGHTNESS_FACTOR = 1.1  # Increase brightness (1.0 = no change)

# Bounding box configuration
LINE_THICKNESS = 5
FONT_SIZE = 20
HIDE_LABELS = False
HIDE_CONF = False

# Note: Removed custom TensorFlow classification model usage

# Waste classification mapping for default model
WASTE_CLASSES = {
    "person": "not waste",
    "bird": "not waste",
    "cat": "not waste",
    "dog": "not waste",
    "horse": "not waste",
    "sheep": "not waste",
    "cow": "not waste",
    "elephant": "not waste",
    "bear": "not waste",
    "zebra": "not waste",
    "giraffe": "not waste",
    "bicycle": "hazardous",
    "car": "hazardous",
    "motorcycle": "hazardous",
    "airplane": "hazardous",
    "bus": "hazardous",
    "train": "hazardous",
    "truck": "hazardous",
    "boat": "hazardous",
    "traffic light": "hazardous",
    "fire hydrant": "recyclable",
    "stop sign": "recyclable",
    "parking meter": "hazardous",
    "bench": "recyclable",
    "backpack": "recyclable",
    "umbrella": "recyclable",
    "handbag": "recyclable",
    "tie": "recyclable",
    "suitcase": "recyclable",
    "frisbee": "recyclable",
    "skis": "recyclable",
    "snowboard": "recyclable",
    "sports ball": "recyclable",
    "kite": "recyclable",
    "baseball bat": "recyclable",
    "baseball glove": "recyclable",
    "skateboard": "recyclable",
    "surfboard": "recyclable",
    "tennis racket": "recyclable",
    "bottle": "recyclable",
    "wine glass": "recyclable",
    "cup": "recyclable",
    "bowl": "recyclable",
    "vase": "recyclable",
    "fork": "recyclable",
    "knife": "recyclable",
    "spoon": "recyclable",
    "banana": "biodegradable",
    "apple": "biodegradable",
    "sandwich": "biodegradable",
    "orange": "biodegradable",
    "broccoli": "biodegradable",
    "carrot": "biodegradable",
    "hot dog": "biodegradable",
    "pizza": "biodegradable",
    "donut": "biodegradable",
    "cake": "biodegradable",
    "chair": "recyclable",
    "couch": "recyclable",
    "potted plant": "biodegradable",
    "bed": "recyclable",
    "dining table": "recyclable",
    "toilet": "recyclable",
    "tv": "hazardous",
    "laptop": "hazardous",
    "mouse": "hazardous",
    "remote": "hazardous",
    "keyboard": "hazardous",
    "cell phone": "hazardous",
    "microwave": "hazardous",
    "oven": "hazardous",
    "toaster": "hazardous",
    "refrigerator": "hazardous",
    "book": "recyclable",
    "clock": "hazardous",
    "scissors": "recyclable",
    "teddy bear": "recyclable",
    "hair drier": "hazardous",
    "toothbrush": "recyclable",
    "sink": "recyclable",
}


def preprocess_camera_image(image):
    """
    Enhance image quality for better detection accuracy.
    This helps with camera captures that may have poor lighting or blur.
    """
    try:
        logger.info("Starting image preprocessing...")
        
        # Resize if image is too large
        if max(image.size) > MAX_IMAGE_SIZE:
            ratio = MAX_IMAGE_SIZE / max(image.size)
            new_size = tuple(int(dim * ratio) for dim in image.size)
            image = image.resize(new_size, Image.Resampling.LANCZOS)
            logger.info(f"Image resized to: {image.size}")
        
        # Increase contrast for better object distinction
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(CONTRAST_FACTOR)
        logger.info(f"Contrast enhanced by factor {CONTRAST_FACTOR}")
        
        # Increase sharpness to reduce blur
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(SHARPNESS_FACTOR)
        logger.info(f"Sharpness enhanced by factor {SHARPNESS_FACTOR}")
        
        # Adjust brightness if needed
        enhancer = ImageEnhance.Brightness(image)
        image = enhancer.enhance(BRIGHTNESS_FACTOR)
        logger.info(f"Brightness enhanced by factor {BRIGHTNESS_FACTOR}")
        
        logger.info("✓ Image preprocessing completed successfully")
        return image
        
    except Exception as e:
        logger.error(f"Error during preprocessing: {str(e)}")
        logger.warning("Returning original image without preprocessing")
        return image


@app.get("/")
async def root():
    return {
        "service": "WasteVision API",
        "status": "running",
        "model": "YOLOv5 (local weights)",
        "detection_config": {
            "confidence_threshold": CONF_THRESHOLD,
            "iou_threshold": IOU_THRESHOLD,
            "max_detections": MAX_DETECTIONS,
            "preprocessing_enabled": ENABLE_PREPROCESSING
        }
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "WasteVision API",
        "model": "YOLOv5",
        "version": "v5",
    }


@app.get("/config")
async def get_config():
    """Get current detection configuration"""
    return {
        "detection": {
            "confidence_threshold": CONF_THRESHOLD,
            "iou_threshold": IOU_THRESHOLD,
            "max_detections": MAX_DETECTIONS
        },
        "preprocessing": {
            "enabled": ENABLE_PREPROCESSING,
            "max_image_size": MAX_IMAGE_SIZE,
            "contrast_factor": CONTRAST_FACTOR,
            "sharpness_factor": SHARPNESS_FACTOR,
            "brightness_factor": BRIGHTNESS_FACTOR
        }
    }


# Removed TensorFlow classification helper; YOLOv5 is the single detection source.


@app.post("/identify")
async def identify(file: UploadFile = File(...)):
    try:
        logger.info(f"Received file: {file.filename}")

        image_bytes = await file.read()
        logger.info(f"Image size: {len(image_bytes)} bytes")
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        original_filename = file.filename or "uploaded_image.jpg"
        saved_filename = f"{timestamp}_{original_filename}"
        saved_filepath = os.path.join(TEMP_STORAGE_DIR, saved_filename)
        
        with open(saved_filepath, "wb") as f:
            f.write(image_bytes)
        logger.info(f"Image saved to: {saved_filepath}")
        
        image = Image.open(io.BytesIO(image_bytes))
        logger.info(f"Original image dimensions: {image.size}")
        
        # Apply preprocessing for better detection accuracy
        if ENABLE_PREPROCESSING:
            image = preprocess_camera_image(image)
        else:
            logger.info("Preprocessing disabled, using original image")

        response_data = {}

        # Default model detection (YOLOv5)
        logger.info("Running YOLOv5 object detection...")
        model_default.conf = CONF_THRESHOLD
        model_default.iou = IOU_THRESHOLD
        model_default.max_det = MAX_DETECTIONS

        results_default = model_default(image)
        detections_default = results_default.pandas().xyxy[0].to_dict(orient="records")
        logger.info(f"Default model found {len(detections_default)} detections")

        default_class_counts = Counter()
        default_response = []
        for det in detections_default:
            label = det["name"]
            confidence = float(det["confidence"])
            waste_type = WASTE_CLASSES.get(label, "unknown")
            default_class_counts[waste_type] += 1
            
            logger.info(f"Default: {label} -> {waste_type} (confidence: {confidence:.2f})")
            default_response.append({
                "item": label,
                "type": waste_type,
                "confidence": confidence,
            })

        total_default = len(detections_default)
        default_percentages = {}
        if total_default > 0:
            for waste_type, count in default_class_counts.items():
                percentage = (count / total_default) * 100
                default_percentages[waste_type] = round(percentage, 2)

        # Draw bounding boxes
        logger.info("Drawing YOLOv5 bounding boxes...")
        image_default = image.copy()
        draw_default = ImageDraw.Draw(image_default)
        try:
            font = ImageFont.truetype("arial.ttf", FONT_SIZE)
        except:
            font = ImageFont.load_default()

        for det in detections_default:
            xmin, ymin, xmax, ymax = det["xmin"], det["ymin"], det["xmax"], det["ymax"]
            label = det["name"]
            confidence = det["confidence"]
            waste_type = WASTE_CLASSES.get(label, "unknown")

            color = {
                "recyclable": "green",
                "biodegradable": "blue",
                "hazardous": "red",
                "unknown": "gray",
                "not waste": "orange"
            }.get(waste_type, "gray")

            display_label = f"{label} ({waste_type})"
            draw_default.rectangle([xmin, ymin, xmax, ymax], outline=color, width=LINE_THICKNESS)

            if not HIDE_LABELS:
                text = f"{display_label} {confidence:.2f}" if not HIDE_CONF else display_label
                draw_default.text((xmin, ymin - 25), text, fill=color, font=font)

        buffered_default = io.BytesIO()
        image_default.save(buffered_default, format="PNG")
        img_default_str = base64.b64encode(buffered_default.getvalue()).decode()

        # Ensure response matches frontend expectations: default_model only
        response_data["default_model"] = {
            "detections": default_response,
            "percentages": default_percentages,
            "total_detections": total_default,
            "image": f"data:image/png;base64,{img_default_str}"
        }
        # Explicitly set custom_model to null (removed)
        response_data["custom_model"] = None
        response_data["saved_file"] = saved_filename
        response_data["preprocessing_applied"] = ENABLE_PREPROCESSING

        logger.info("Request completed successfully")
        return JSONResponse(content=response_data)

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        return JSONResponse(content={"error": str(e)}, status_code=500)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=5000)