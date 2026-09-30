# ML Inference Pipeline

## Intended Pipeline (Specification)

```
Input Image
    ↓
Image Validation (type, size, readability)
    ↓
Preprocessing
    ├─ Segmentation: Resize 256×256, ImageNet normalize, CHW tensor
    └─ Classification: Resize 224×224, ImageNet normalize, CHW tensor
    ↓
Segmentation Model (U-Net ResNet34)
    ↓
Segmentation Mask (sigmoid > 0.5)
    ↓
Post-processing / Region Extraction (if required)
    ↓
Classification Preprocessing
    ↓
Classification Model (EfficientNet-B0)
    ↓
Class Probabilities (softmax)
    ↓
Predicted Class (argmax)
    ↓
Save Results to Database
    ↓
Return to Frontend
```

---

## Actual Current Implementation (Spring Boot ModelService)

**File**: `backend/src/main/java/com/colovision/service/ModelService.java`

### Current Flow
```java
public Result predict(BufferedImage image) {
    // 1. SEGMENTATION
    // Resize to 256×256, normalize ImageNet → ONNX tensor [1,3,256,256]
    // Run segmenter (U-Net) → logits [1,1,256,256]
    // Sigmoid → threshold 0.5 → binary mask (BufferedImage)
    // Create overlay: red mask at 35% opacity on original
    
    // 2. CLASSIFICATION
    // Resize ORIGINAL image to 224×224, normalize ImageNet → ONNX tensor [1,3,224,224]
    // Run classifier (EfficientNet-B0) → logits [1,6]
    // Softmax → probabilities[6]
    // Argmax → predicted class
    
    return new Result(label, confidence, probabilities, mask, overlay);
}
```

### Key Differences from Spec

| Step | Spec | Actual | Status |
|------|------|--------|--------|
| Classification input | Segmented region? | **Full original image** | ⚠️ NEEDS VERIFICATION |
| Segmentation threshold | Configurable? | **Hardcoded 0.5** | ❌ FIX NEEDED |
| Coordinate mapping | Aspect-ratio aware? | **Assumes square** | ❌ BUG |
| Class names | From training? | **Hardcoded Title Case** | ❌ MISMATCH |
| Model loading | Once at startup | ✅ Once at startup | ✅ OK |
| Inference mode | `eval()` + `no_grad()` | ✅ ONNX Runtime handles | ✅ OK |

---

## Actual Planned Implementation (FastAPI ML Service)

**Target**: `ML_API/main.py` (to be created)

### Planned Flow
```python
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # 1. VALIDATION
    content = await file.read()
    validate_image(content)  # magic bytes, dimensions
    
    # 2. PREPROCESSING
    image = load_image(content)  # PIL/RGB
    
    # Segmentation preprocessing
    seg_tensor = preprocess_segmentation(image)  # 256×256, norm, CHW
    
    # Classification preprocessing  
    cls_tensor = preprocess_classification(image)  # 224×224, norm, CHW
    
    # 3. INFERENCE
    with torch.no_grad():
        # Segmentation
        seg_logits = seg_model(seg_tensor)
        seg_mask = (torch.sigmoid(seg_logits) > 0.5).float()
        
        # Classification - DECISION NEEDED:
        # Option A: Full image (matches training notebook)
        cls_logits = cls_model(cls_tensor)
        # Option B: Cropped region from mask
        # cls_logits = cls_model(crop_and_preprocess(image, seg_mask))
    
    # 4. POST-PROCESS
    probs = torch.softmax(cls_logits, dim=1)[0].cpu().numpy()
    pred_idx = int(probs.argmax())
    confidence = float(probs.max())
    pred_class = CLASS_NAMES[pred_idx]  # From checkpoint
    
    # 5. RESPONSE
    mask_b64 = mask_to_base64(seg_mask[0,0].cpu().numpy())
    return {
        "predicted_class": pred_class,
        "confidence": confidence,
        "probabilities": {CLASS_NAMES[i]: float(probs[i]) for i in range(6)},
        "mask_base64": mask_b64
    }
```

### Critical Decisions Needed

1. **Classification Input**: Full image or segmented crop?
   - Training notebook uses full images (labels from filenames)
   - If training used full images → use full image
   - If training used crops → implement crop logic

2. **Class Names Source**: 
   - Load from `checkpoint["class_names"]` at startup
   - Never hardcode

3. **Segmentation Threshold**:
   - Make configurable (default 0.5)
   - Allow per-class if needed

4. **Mask Output Format**:
   - Base64 PNG (simple, no shared filesystem)
   - Or save to shared volume, return path

---

## Spring Boot → FastAPI Integration

**Current**: `PredictionController` calls `ModelService.predict()` (ONNX)
**Target**: `PredictionController` calls FastAPI `/predict`

```java
// PredictionController.java - updated
@PostMapping(value = "/prediction", consumes = MULTIPART_FORM_DATA_VALUE)
Map<String, Object> predict(@RequestParam Long patient_id, @RequestParam MultipartFile image, Authentication auth) {
    // ... validation, save original ...
    
    // Call FastAPI
    FastApiResponse response = fastApiClient.predict(image);
    
    // Decode mask, create overlay
    BufferedImage mask = Base64Decoder.decode(response.maskBase64());
    BufferedImage overlay = createOverlay(original, mask);
    
    // Save mask/overlay files
    // Save Prediction with all 6 probs from response.probabilities()
    // Return response
}
```

---

## Data Flow Summary

| Stage | Input | Output | Owner |
|-------|-------|--------|-------|
| Upload | Multipart File | Validated BufferedImage | Spring Boot |
| Seg Preprocess | BufferedImage | Tensor [1,3,256,256] | FastAPI |
| Seg Inference | Tensor | Logits [1,1,256,256] | FastAPI (PyTorch) |
| Seg Postprocess | Logits | Binary Mask [256,256] | FastAPI |
| Cls Preprocess | BufferedImage | Tensor [1,3,224,224] | FastAPI |
| Cls Inference | Tensor | Logits [1,6] | FastAPI (PyTorch) |
| Cls Postprocess | Logits | Probs[6], Pred Class | FastAPI |
| Response | All results | JSON + Base64 Mask | FastAPI → Spring Boot |
| Persistence | Response | DB Record + Files | Spring Boot |

---

## Error Handling

| Error | HTTP Code | Handling |
|-------|-----------|----------|
| Invalid image format | 400 | Reject early |
| Image too large | 413 | Spring Boot multipart limit |
| Model not loaded | 503 | FastAPI health check |
| Inference timeout | 504 | Configure client timeout |
| CUDA OOM | 503 | Catch, log, return error |

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Segmentation inference | < 500ms |
| Classification inference | < 200ms |
| Total pipeline | < 1s |
| Memory (GPU) | < 4GB |
| Concurrent requests | 2-4 (depends on GPU) |