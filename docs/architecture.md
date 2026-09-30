# Architecture

## System Overview

```
┌─────────────┐      REST/JSON      ┌──────────────────┐
│   React     │ ◄─────────────────► │  Spring Boot     │
│  Frontend   │    (port 5173)      │   Backend        │
│  (Vite)     │                     │  (port 8080)     │
└─────────────┘                     └────────┬─────────┘
                                              │
                                              │ JDBC
                                              ▼
                                    ┌──────────────────┐
                                    │     MySQL        │
                                    │  (port 3306)     │
                                    └──────────────────┘
                                              │
                                              │ HTTP (internal)
                                              ▼
                                    ┌──────────────────┐
                                    │    FastAPI       │
                                    │  ML Service      │
                                    │  (port 8000)     │
                                    └────────┬─────────┘
                                             │
                                             │ Python/PyTorch
                                             ▼
                                    ┌──────────────────┐
                                    │  PyTorch Models  │
                                    │  (.pth files)    │
                                    └──────────────────┘
```

## Service Responsibilities

### React Frontend (Port 5173)
- User interface: registration, login, dashboard, patient management, image upload, results display
- State management: React hooks, localStorage for JWT
- API communication: Axios with Bearer token interceptor
- Routing: React Router v6

### Spring Boot Backend (Port 8080)
- **Authentication/Authorization**: JWT issuance/validation, BCrypt password hashing, role-based access (ROLE_USER, ROLE_ADMIN)
- **Business Logic**: Patient CRUD, prediction orchestration, report generation coordination
- **Data Persistence**: JPA/Hibernate → MySQL
- **File Storage**: Local filesystem (`uploads/images`, `uploads/results`, `uploads/reports`)
- **ML Orchestration**: Calls FastAPI `/predict` endpoint with uploaded image
- **Admin Management**: User approval/rejection/suspension

### FastAPI ML Service (Port 8000)
- **Model Loading**: Load segmentation + classification `.pth` models at startup
- **Preprocessing**: Match training preprocessing exactly (resize, normalize, tensor conversion)
- **Inference**: 
  - Segmentation: U-Net ResNet34 → binary mask (256×256)
  - Classification: EfficientNet-B0 → 6-class logits → softmax (224×224)
- **Post-processing**: Sigmoid thresholding, probability formatting
- **Response**: JSON with predicted class, confidence, all 6 probabilities, mask (base64 or file path)

### MySQL Database (Port 3306)
- Tables: `admins`, `users`, `patients`, `predictions`, `reports`
- Managed by Hibernate (`ddl-auto: update`)

### PyTorch Models
- **Segmentation**: `best_segmentation_model.pth` (293 MB) - U-Net + ResNet34 encoder, 1 output channel
- **Classification**: `best_classifier_model_v3.pth` (48 MB) - EfficientNet-B0, 6 classes

## Communication Patterns

| From | To | Protocol | Purpose |
|------|-----|----------|---------|
| Browser | React | HTTPS | Static assets, SPA |
| React | Spring Boot | REST/JSON + JWT | All application APIs |
| Spring Boot | MySQL | JDBC | Persistent data |
| Spring Boot | FastAPI | HTTP multipart | Image → prediction |
| FastAPI | PyTorch | Python API | Model inference |

## Authentication Flow

```
Registration:
POST /api/auth/register → Spring Boot creates User (status=PENDING) → returns 201

Admin Approval:
PUT /api/admin/users/{id}/approve → Spring Boot updates User.status=APPROVED

User Login:
POST /api/auth/login → Spring Boot validates credentials + status=APPROVED → returns JWT (sub=userId, role=user)

Admin Login:
POST /api/auth/admin/login → Spring Boot validates against admins table → returns JWT (sub=adminId, role=admin)

Protected Request:
React adds Authorization: Bearer <token> → Spring Boot JWT filter validates → sets SecurityContext with ROLE_USER/ROLE_ADMIN
```

## AI Prediction Flow

```
1. React: POST /api/prediction (multipart: patient_id + image file)
2. Spring Boot: 
   - Validates patient ownership
   - Saves original to uploads/images/
   - Forwards image to FastAPI POST /predict
3. FastAPI:
   - Loads image, validates
   - Preprocess for segmentation (256×256, ImageNet norm)
   - Run U-Net → mask logits → sigmoid > 0.5 → binary mask
   - Preprocess for classification (224×224, ImageNet norm)
   - Run EfficientNet-B0 → logits → softmax → 6 probabilities
   - Determine predicted class (argmax)
   - Return JSON: {predicted_class, confidence, probabilities[6], mask_base64}
4. Spring Boot:
   - Decodes mask, creates overlay
   - Saves mask/overlay to uploads/results/
   - Creates Prediction record with all probabilities + file paths
   - Returns response to React
5. React: Displays prediction, mask, overlay, confidence
```

## Data Flow Summary

| Data | Owner | Storage |
|------|-------|---------|
| User accounts | Spring Boot | MySQL (`users`, `admins`) |
| Patient records | Spring Boot | MySQL (`patients`) |
| Predictions | Spring Boot | MySQL (`predictions`) |
| Reports | Spring Boot | MySQL (`reports`) + filesystem (PDF) |
| Original images | Spring Boot | Filesystem (`uploads/images/`) |
| Segmentation masks | Spring Boot | Filesystem (`uploads/results/`) |
| Overlay images | Spring Boot | Filesystem (`uploads/results/`) |
| Model weights | FastAPI | `ML_API/*.pth` (loaded at startup) |