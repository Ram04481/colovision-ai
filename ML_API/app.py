"""
FastAPI ML Service for Colorectal Cancer Tissue Segmentation and Classification
"""
import os
import io
import base64
import tempfile
from typing import Dict, List, Optional

import torch
import torch.nn.functional as F
import torchvision.transforms as T
from PIL import Image
import numpy as np
import cv2
import segmentation_models_pytorch as smp
import timm

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Configuration
SEGMENTATION_MODEL_PATH = "best_segmentation_model.pth"
CLASSIFICATION_MODEL_PATH = "best_classifier_model_v3.pth"
SEGMENTATION_INPUT_SIZE = 256
CLASSIFICATION_INPUT_SIZE = 224
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]
SEGMENTATION_THRESHOLD = 0.5

# Device
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {DEVICE}")

# Class names from checkpoint
CLASS_NAMES = [
    "adenocarcinoma",
    "high-grade in",
    "low-grade in",
    "normal",
    "polyp",
    "serrated adenoma"
]

# Preprocessing transforms
segmentation_transform = T.Compose([
    T.Resize((SEGMENTATION_INPUT_SIZE, SEGMENTATION_INPUT_SIZE)),
    T.ToTensor(),
    T.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])

classification_transform = T.Compose([
    T.Resize((CLASSIFICATION_INPUT_SIZE, CLASSIFICATION_INPUT_SIZE)),
    T.ToTensor(),
    T.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])

# Global model holders
segmentation_model = None
classification_model = None

def load_segmentation_model():
    """Load U-Net segmentation model with ResNet34 encoder"""
    global segmentation_model
    
    model = smp.Unet(
        encoder_name="resnet34",
        encoder_weights=None,  # We'll load our own weights
        in_channels=3,
        classes=1,
        activation=None
    )
    
    checkpoint = torch.load(SEGMENTATION_MODEL_PATH, map_location=DEVICE, weights_only=False)
    
    # Handle both state_dict and full checkpoint
    if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
        state_dict = checkpoint["model_state_dict"]
    else:
        state_dict = checkpoint
    
    model.load_state_dict(state_dict)
    model.to(DEVICE)
    model.eval()
    
    segmentation_model = model
    print(f"Segmentation model loaded from {SEGMENTATION_MODEL_PATH}")

def load_classification_model():
    """Load EfficientNet-B0 classification model"""
    global classification_model
    
    model = timm.create_model(
        "efficientnet_b0",
        pretrained=False,
        num_classes=len(CLASS_NAMES)
    )
    
    checkpoint = torch.load(CLASSIFICATION_MODEL_PATH, map_location=DEVICE, weights_only=False)
    
    # Handle both state_dict and full checkpoint
    if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
        state_dict = checkpoint["model_state_dict"]
    else:
        state_dict = checkpoint
    
    model.load_state_dict(state_dict)
    model.to(DEVICE)
    model.eval()
    
    classification_model = model
    print(f"Classification model loaded from {CLASSIFICATION_MODEL_PATH}")

def load_models():
    """Load both models at startup"""
    load_segmentation_model()
    load_classification_model()

def preprocess_segmentation(image: Image.Image) -> torch.Tensor:
    """Preprocess image for segmentation model"""
    tensor = segmentation_transform(image)
    return tensor.unsqueeze(0).to(DEVICE)  # Add batch dimension

def preprocess_classification(image: Image.Image) -> torch.Tensor:
    """Preprocess image for classification model"""
    tensor = classification_transform(image)
    return tensor.unsqueeze(0).to(DEVICE)  # Add batch dimension

def run_segmentation(input_tensor: torch.Tensor) -> np.ndarray:
    """Run segmentation inference and return binary mask"""
    with torch.no_grad():
        logits = segmentation_model(input_tensor)
        probs = torch.sigmoid(logits)
        mask = (probs > SEGMENTATION_THRESHOLD).float()
        mask = mask.squeeze().cpu().numpy()  # Remove batch and channel dims
        return (mask * 255).astype(np.uint8)

def run_classification(input_tensor: torch.Tensor) -> tuple:
    """Run classification inference and return predictions"""
    with torch.no_grad():
        logits = classification_model(input_tensor)
        probs = F.softmax(logits, dim=1)
        probs_np = probs.squeeze().cpu().numpy()
        pred_idx = int(np.argmax(probs_np))
        confidence = float(probs_np[pred_idx])
        return pred_idx, confidence, probs_np

def mask_to_base64(mask: np.ndarray) -> str:
    """Convert binary mask to base64 encoded PNG"""
    mask_img = Image.fromarray(mask, mode='L')
    buffer = io.BytesIO()
    mask_img.save(buffer, format='PNG')
    return base64.b64encode(buffer.getvalue()).decode('utf-8')

# Pydantic models for API
class PredictionResponse(BaseModel):
    predicted_class: str
    confidence: float
    probabilities: Dict[str, float]
    mask_base64: str

class HealthResponse(BaseModel):
    status: str
    models_loaded: bool

# FastAPI app
app = FastAPI(
    title="ColoVision AI ML Service",
    description="ML inference service for colorectal cancer tissue segmentation and classification",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    """Load models on startup"""
    try:
        load_models()
        print("All models loaded successfully")
    except Exception as e:
        print(f"Failed to load models: {e}")
        raise

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    models_loaded = segmentation_model is not None and classification_model is not None
    return HealthResponse(
        status="ok" if models_loaded else "degraded",
        models_loaded=models_loaded
    )

@app.post("/predict", response_model=PredictionResponse)
async def predict(file: UploadFile = File(...)):
    """
    Perform segmentation and classification on uploaded histopathology image
    """
    # Validate file
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Read image
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert('RGB')
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")
    
    # Validate models are loaded
    if segmentation_model is None or classification_model is None:
        raise HTTPException(status_code=503, detail="Models not loaded")
    
    try:
        # Preprocess for both models
        seg_input = preprocess_segmentation(image)
        cls_input = preprocess_classification(image)
        
        # Run segmentation
        mask = run_segmentation(seg_input)
        
        # Run classification
        pred_idx, confidence, probs = run_classification(cls_input)
        
        # Convert mask to base64
        mask_base64 = mask_to_base64(mask)
        
        # Build probabilities dict
        probabilities = {
            CLASS_NAMES[i]: float(probs[i]) for i in range(len(CLASS_NAMES))
        }
        
        # Return prediction
        return PredictionResponse(
            predicted_class=CLASS_NAMES[pred_idx],
            confidence=confidence,
            probabilities=probabilities,
            mask_base64=mask_base64
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)