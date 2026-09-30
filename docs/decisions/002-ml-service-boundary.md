# ADR 002: ML Service Boundary

## Status
Accepted

## Date
2024-09-30

## Context
The Spring Boot backend currently has `ModelService` using ONNX Runtime for inference. The original specification called for a Python/FastAPI ML service with native PyTorch models.

## Decision
**Move all ML inference to a dedicated FastAPI service** running native PyTorch models (.pth files). Spring Boot will call FastAPI via HTTP.

## Service Boundaries

### Spring Boot Backend (Port 8080)
**Owns**:
- User authentication & authorization
- Patient CRUD
- Prediction orchestration (call ML service, persist results)
- Report generation (PDFBox)
- File storage (uploads, masks, overlays, reports)
- Admin user management
- Database operations

**Does NOT Own**:
- Model loading/inference
- Preprocessing logic
- PyTorch dependencies

### FastAPI ML Service (Port 8000)
**Owns**:
- Model loading at startup (segmentation + classification)
- Preprocessing (matching training exactly)
- PyTorch inference (`model.eval()`, `torch.no_grad()`)
- Post-processing (sigmoid, softmax, thresholding)
- Response formatting

**Does NOT Own**:
- Authentication (trusted internal call)
- Database persistence
- File storage (returns base64 or saves to shared volume)
- Business logic

## Communication Contract

### Request: Spring Boot → FastAPI
```
POST /predict
Content-Type: multipart/form-data
Body: file (image)
```

### Response: FastAPI → Spring Boot
```json
{
  "predicted_class": "Adenocarcinoma",
  "confidence": 0.92,
  "probabilities": {
    "Adenocarcinoma": 0.92,
    "High-grade IN": 0.03,
    "Low-grade IN": 0.01,
    "Normal": 0.02,
    "Polyp": 0.01,
    "Serrated Adenoma": 0.01
  },
  "mask_base64": "iVBORw0KGgoAAAANSUhEUgAA..."
}
```

## Rationale
1. **Exact training parity** - Native PyTorch avoids ONNX export differences
2. **No model export step** - Use .pth files directly
3. **Independent scaling** - ML service can have GPU, backend CPU-only
4. **Technology fit** - Python/PyTorch for ML, Java/Spring for business logic
5. **Team separation** - ML engineers work in Python, backend engineers in Java

## Migration Path
1. Remove `ModelService` and `MlService`/`MlController` from Spring Boot
2. Create FastAPI service with `/predict` endpoint
3. Update `PredictionController` to call FastAPI via `WebClient`/`RestClient`
4. Spring Boot decodes base64 mask, creates overlay, saves files

## Consequences
- **Positive**: Simpler ML deployment, exact model fidelity, independent scaling
- **Negative**: Network call latency, two services to monitor
- **Mitigation**: Async calls, timeouts, health checks, shared volume for large files if needed

## Related
- ADR 001: Current Technology Stack