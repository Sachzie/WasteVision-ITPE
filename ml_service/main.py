from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import torch
from PIL import Image, ImageDraw, ImageFont
import io
import base64
import logging
import platform
import pathlib

# Fix for loading models trained on Linux/Mac in Windows
if platform.system() == 'Windows':
    pathlib.PosixPath = pathlib.WindowsPath

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="WasteVision API", description="Identify recyclable, biodegradable, and hazardous waste from images.")

# Allow specific origins
origins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
]

app.add_middleware(
   CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Load both YOLOv5 models
MODEL_PATH_CUSTOM = "models/trained-v2.pt"
MODEL_PATH_DEFAULT = "models/yolov5s.pt"

logger.info("Loading YOLOv5 models...")
model_custom = torch.hub.load('ultralytics/yolov5', 'custom', path=MODEL_PATH_CUSTOM, force_reload=False)
model_default = torch.hub.load('ultralytics/yolov5', 'custom', path=MODEL_PATH_DEFAULT, force_reload=False)
logger.info("Models loaded successfully")

# Detection configuration (similar to detect.py)
CONF_THRESHOLD = 0.15  # confidence threshold
IOU_THRESHOLD = 0.15   # NMS IoU threshold
MAX_DETECTIONS = 1000  # maximum detections per image

# Bounding box configuration
LINE_THICKNESS = 5     # bounding box line thickness
FONT_SIZE = 20         # label font size
HIDE_LABELS = False    # hide labels
HIDE_CONF = False      # hide confidence scores

# Waste classification mapping (only for default yolov5s.pt)
WASTE_CLASSES = {
    # People and animals - not waste
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

    # Vehicles - hazardous (large waste items with fluids/batteries)
    "bicycle": "hazardous",
    "car": "hazardous",
    "motorcycle": "hazardous",
    "airplane": "hazardous",
    "bus": "hazardous",
    "train": "hazardous",
    "truck": "hazardous",
    "boat": "hazardous",

    # Street items - recyclable/hazardous
    "traffic light": "hazardous",
    "fire hydrant": "recyclable",
    "stop sign": "recyclable",
    "parking meter": "hazardous",
    "bench": "recyclable",

    # Personal items - recyclable
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

    # Containers - recyclable
    "bottle": "recyclable",
    "wine glass": "recyclable",
    "cup": "recyclable",
    "bowl": "recyclable",
    "vase": "recyclable",

    # Utensils - recyclable
    "fork": "recyclable",
    "knife": "recyclable",
    "spoon": "recyclable",

    # Food - biodegradable
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

    # Furniture - recyclable
    "chair": "recyclable",
    "couch": "recyclable",
    "potted plant": "biodegradable",
    "bed": "recyclable",
    "dining table": "recyclable",
    "toilet": "recyclable",

    # Electronics - hazardous
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

    # Other items
    "book": "recyclable",
    "clock": "hazardous",
    "scissors": "recyclable",
    "teddy bear": "recyclable",
    "hair drier": "hazardous",
    "toothbrush": "recyclable",
    "sink": "recyclable",
}


@app.post("/identify")
async def identify(file: UploadFile = File(...)):
    try:
        logger.info(f"Received file: {file.filename}")

        # Read image
        image_bytes = await file.read()
        logger.info(f"Image size: {len(image_bytes)} bytes")
        image = Image.open(io.BytesIO(image_bytes))
        logger.info(f"Image dimensions: {image.size}")

        # Run detection on CUSTOM model (trained-v2.pt)
        logger.info("Running custom model detection...")
        model_custom.conf = CONF_THRESHOLD
        model_custom.iou = IOU_THRESHOLD
        model_custom.max_det = MAX_DETECTIONS

        results_custom = model_custom(image)
        detections_custom = results_custom.pandas().xyxy[0].to_dict(orient="records")
        logger.info(f"Custom model found {len(detections_custom)} detections")

        custom_response = []
        for det in detections_custom:
            label = det["name"]
            confidence = float(det["confidence"])
            logger.info(f"Custom: {label} (confidence: {confidence:.2f})")
            custom_response.append({
                "item": label,
                "type": label,
                "confidence": confidence,
            })

        # Run detection on DEFAULT model (yolov5s.pt)
        logger.info("Running default model detection...")
        model_default.conf = CONF_THRESHOLD
        model_default.iou = IOU_THRESHOLD
        model_default.max_det = MAX_DETECTIONS

        results_default = model_default(image)
        detections_default = results_default.pandas().xyxy[0].to_dict(orient="records")
        logger.info(f"Default model found {len(detections_default)} detections")

        default_response = []
        for det in detections_default:
            label = det["name"]
            confidence = float(det["confidence"])
            waste_type = WASTE_CLASSES.get(label, "unknown")
            logger.info(f"Default: {label} -> {waste_type} (confidence: {confidence:.2f})")
            default_response.append({
                "item": label,
                "type": waste_type,
                "confidence": confidence,
            })

        # Draw bounding boxes for CUSTOM model
        logger.info("Drawing custom model bounding boxes...")
        image_custom = image.copy()
        draw_custom = ImageDraw.Draw(image_custom)
        try:
            font = ImageFont.truetype("arial.ttf", FONT_SIZE)
        except:
            font = ImageFont.load_default()

        for det in detections_custom:
            xmin, ymin, xmax, ymax = det["xmin"], det["ymin"], det["xmax"], det["ymax"]
            label = det["name"]
            confidence = det["confidence"]

            color = "green"
            draw_custom.rectangle([xmin, ymin, xmax, ymax], outline=color, width=LINE_THICKNESS)

            if not HIDE_LABELS:
                text = f"{label} {confidence:.2f}" if not HIDE_CONF else label
                draw_custom.text((xmin, ymin - 25), text, fill=color, font=font)

        # Draw bounding boxes for DEFAULT model
        logger.info("Drawing default model bounding boxes...")
        image_default = image.copy()
        draw_default = ImageDraw.Draw(image_default)

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

        # Convert images to base64
        logger.info("Converting images to base64...")

        buffered_custom = io.BytesIO()
        image_custom.save(buffered_custom, format="PNG")
        img_custom_str = base64.b64encode(buffered_custom.getvalue()).decode()

        buffered_default = io.BytesIO()
        image_default.save(buffered_default, format="PNG")
        img_default_str = base64.b64encode(buffered_default.getvalue()).decode()
        # print(custom_response)
        logger.info("Request completed successfully")
        return JSONResponse(content={
            "default_model": {
                "detections": default_response,
                # "image": f"data:image/png;base64,{img_default_str}"
            }
        })

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        return JSONResponse(content={"error": str(e)}, status_code=500)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
