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
import numpy as np

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

# Model paths
MODEL_PATH_SAVEDMODEL = "models/trained_v3_savedmodel"  # SavedModel format
MODEL_PATH_DEFAULT = "models/yolov5s.pt"

logger.info("Loading models...")

# Load TensorFlow SavedModel
model_custom = None
try:
    import tensorflow as tf
    from tensorflow import keras
    
    logger.info(f"TensorFlow version: {tf.__version__}")
    
    if not os.path.exists(MODEL_PATH_SAVEDMODEL):
        raise FileNotFoundError(f"SavedModel not found at {MODEL_PATH_SAVEDMODEL}")
    
    logger.info(f"Loading SavedModel from {MODEL_PATH_SAVEDMODEL}...")
    
    # Use TFSMLayer for Keras 3 compatibility
    model_custom = keras.layers.TFSMLayer(
        MODEL_PATH_SAVEDMODEL, 
        call_endpoint='serving_default'
    )
    logger.info("✓ SavedModel loaded successfully as TFSMLayer")
    
except Exception as e:
    logger.error(f"Failed to load SavedModel: {str(e)}", exc_info=True)
    logger.error("Make sure tensorflow is installed: pip install tensorflow")
    logger.error(f"And that the SavedModel exists at: {MODEL_PATH_SAVEDMODEL}")
    model_custom = None

# Load default YOLOv5 model
try:
    model_default = torch.hub.load('ultralytics/yolov5', 'yolov5s', force_reload=False)
    logger.info("✓ Default YOLOv5 model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load default model: {str(e)}")
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

# Custom model waste classes mapping
CUSTOM_WASTE_CLASSES = {
    0: "hazardous",
    1: "recyclable",
    2: "biodegradable",
    3: "nonbiodegradable"
}

CUSTOM_COLORS = {
    "hazardous": "red",
    "recyclable": "green",
    "biodegradable": "blue",
    "nonbiodegradable": "orange"
}

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
        "custom_model_loaded": model_custom is not None,
        "custom_model_format": "SavedModel (TFSMLayer)" if model_custom else "Not loaded",
        "custom_model_type": "Image Classification (entire image)" if model_custom else None,
        "default_model_loaded": True,
        "default_model_type": "YOLOv5 Object Detection (with bounding boxes)",
        "classes": list(CUSTOM_WASTE_CLASSES.values()),
        "detection_config": {
            "confidence_threshold": CONF_THRESHOLD,
            "iou_threshold": IOU_THRESHOLD,
            "max_detections": MAX_DETECTIONS,
            "preprocessing_enabled": ENABLE_PREPROCESSING
        }
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


def classify_with_tensorflow(image, model):
    """Classify entire image using TensorFlow SavedModel via TFSMLayer"""
    try:
        import tensorflow as tf
        
        # Default input size - adjust based on your model
        target_size = (224, 224)  # Common size, adjust if needed
        
        logger.info(f"Resizing image to {target_size}")
        
        # Preprocess image
        img_resized = image.resize(target_size)
        img_array = np.array(img_resized, dtype=np.float32)
        
        # Normalize to [0, 1]
        img_array = img_array / 255.0
        
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        
        logger.info(f"Input shape: {img_array.shape}")
        
        # Run inference - TFSMLayer returns a dictionary
        result = model(img_array)
        
        # Extract predictions from the result dictionary
        if isinstance(result, dict):
            # Try common output keys
            if 'output_0' in result:
                predictions = result['output_0'].numpy()
            elif 'dense' in result:
                predictions = result['dense'].numpy()
            else:
                # Take the first output
                predictions = list(result.values())[0].numpy()
                logger.info(f"Available output keys: {list(result.keys())}")
        else:
            predictions = result.numpy()
        
        logger.info(f"Raw predictions shape: {predictions.shape}")
        logger.info(f"Raw predictions: {predictions[0]}")
        
        # Get class with highest confidence
        class_idx = np.argmax(predictions[0])
        confidence = float(predictions[0][class_idx])
        
        waste_type = CUSTOM_WASTE_CLASSES.get(class_idx, "unknown")
        
        logger.info(f"✓ Classification: {waste_type} (class {class_idx}) with confidence {confidence:.2%}")
        
        # Get all class probabilities
        all_predictions = {}
        for idx, prob in enumerate(predictions[0]):
            class_name = CUSTOM_WASTE_CLASSES.get(idx, f"class_{idx}")
            all_predictions[class_name] = float(prob)
        
        logger.info(f"All class probabilities: {all_predictions}")
        
        return [{
            "item": waste_type,
            "type": waste_type,
            "confidence": confidence,
            "all_probabilities": all_predictions
        }], {waste_type: 100.0}, 1
        
    except Exception as e:
        logger.error(f"TensorFlow classification error: {str(e)}", exc_info=True)
        return [], {}, 0


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

        # Custom model classification (TensorFlow)
        if model_custom is not None:
            logger.info("Running TensorFlow SavedModel classification...")
            
            custom_response, custom_percentages, total_custom = classify_with_tensorflow(image, model_custom)
            
            # Create image with text overlay
            image_custom = image.copy()
            draw_custom = ImageDraw.Draw(image_custom)
            try:
                font = ImageFont.truetype("arial.ttf", 40)
            except:
                font = ImageFont.load_default()
            
            if custom_response:
                waste_type = custom_response[0]["type"]
                confidence = custom_response[0]["confidence"]
                color = CUSTOM_COLORS.get(waste_type, "white")
                text = f"{waste_type.upper()}: {confidence:.2%}"
                
                # Draw text with background
                text_bbox = draw_custom.textbbox((10, 10), text, font=font)
                draw_custom.rectangle(text_bbox, fill="black")
                draw_custom.text((10, 10), text, fill=color, font=font)
            
            buffered_custom = io.BytesIO()
            image_custom.save(buffered_custom, format="PNG")
            img_custom_str = base64.b64encode(buffered_custom.getvalue()).decode()
            
            response_data["custom_model"] = {
                "detections": custom_response,
                "percentages": custom_percentages,
                "total_detections": total_custom,
                "image": f"data:image/png;base64,{img_custom_str}",
                "model_format": "SavedModel (TFSMLayer)",
                "note": "TensorFlow classification - classifies entire image into one category"
            }
        else:
            logger.warning("Custom model not available")
            response_data["custom_model"] = {
                "error": "Model not loaded",
                "detections": [],
                "percentages": {},
                "total_detections": 0,
                "solution": f"Place your SavedModel at {MODEL_PATH_SAVEDMODEL}"
            }

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

        response_data["default_model"] = {
            "detections": default_response,
            "percentages": default_percentages,
            "total_detections": total_default,
            "image": f"data:image/png;base64,{img_default_str}"
        }
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