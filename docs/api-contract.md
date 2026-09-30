# API Contract

## Frontend → Spring Boot (Port 8080)

### Authentication Endpoints

| Method | Path | Auth | Request | Response | Status Codes |
|--------|------|------|---------|----------|--------------|
| POST | `/api/auth/register` | None | `{name, email, phone, username, password}` | `{message}` | 201, 400 |
| POST | `/api/auth/login` | None | `{identifier, password}` | `{access_token, token_type}` | 200, 401 |
| POST | `/api/auth/admin/login` | None | `{identifier, password}` | `{access_token, token_type}` | 200, 401 |

### Admin Endpoints (require ROLE_ADMIN)

| Method | Path | Auth | Request | Response | Status Codes |
|--------|------|------|---------|----------|--------------|
| GET | `/api/admin/users/pending` | Bearer | - | `User[]` | 200, 401, 403 |
| GET | `/api/admin/users/approved` | Bearer | - | `User[]` | 200, 401, 403 |
| PUT | `/api/admin/users/{id}/approve` | Bearer | - | `{message}` | 200, 401, 403, 404 |
| PUT | `/api/admin/users/{id}/reject` | Bearer | - | `{message}` | 200, 401, 403, 404 |
| PUT | `/api/admin/users/{id}/suspend` | Bearer | - | `{message}` | 200, 401, 403, 404 |

### Patient Endpoints (require ROLE_USER)

| Method | Path | Auth | Request | Response | Status Codes |
|--------|------|------|---------|----------|--------------|
| POST | `/api/patients` | Bearer | `{patientId, name, age, gender, address, contact}` | `Patient` | 201, 400, 401, 403 |
| GET | `/api/patients` | Bearer | - | `Patient[]` | 200, 401, 403 |
| GET | `/api/patients/{id}` | Bearer | - | `Patient` | 200, 401, 403, 404 |

### Prediction Endpoints (require ROLE_USER)

| Method | Path | Auth | Request | Response | Status Codes |
|--------|------|------|---------|----------|--------------|
| POST | `/api/prediction` | Bearer | multipart: `patient_id` (Long), `image` (File) | `{id, predicted_class, confidence, probabilities[6], mask_path, overlay_path}` | 200, 400, 401, 403, 404, 415, 503 |
| GET | `/api/predictions/{patientId}` | Bearer | - | `Prediction[]` | 200, 401, 403, 404 |

### Report Endpoints (require ROLE_USER)

| Method | Path | Auth | Request | Response | Status Codes |
|--------|------|------|---------|----------|--------------|
| GET | `/api/reports/{id}` | Bearer | - | `{id, prediction_id, report_path}` | 200, 401, 403, 404 |
| GET | `/api/reports/{id}/download` | Bearer | - | PDF file | 200, 401, 403, 404 |

### Health Endpoint

| Method | Path | Auth | Request | Response | Status Codes |
|--------|------|------|---------|----------|--------------|
| GET | `/health` | None | - | `{status: "ok"}` | 200 |

---

## Spring Boot → FastAPI (Port 8000)

### Prediction Endpoint

| Method | Path | Auth | Request | Response | Status Codes |
|--------|------|------|---------|----------|--------------|
| POST | `/predict` | None (internal) | multipart: `file` (image) | `{predicted_class, confidence, probabilities[6], mask_base64}` | 200, 400, 415, 503 |

### Health Endpoint

| Method | Path | Auth | Request | Response | Status Codes |
|--------|------|------|---------|----------|--------------|
| GET | `/health` | None | - | `{status: "ok", models_loaded: boolean}` | 200 |

---

## Data Models

### User (Frontend ↔ Backend)
```typescript
interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  username: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  createdAt: string; // ISO 8601
  approvedBy?: number;
  approvedAt?: string;
}
```

### Patient (Frontend ↔ Backend)
```typescript
interface Patient {
  id: number;
  patientId: string;
  name: string;
  address: string;
  age: number;
  gender: string;
  contact: string;
  photoPath?: string;
  createdBy: number;
  createdAt: string;
}
```

### Prediction (Frontend ↔ Backend)
```typescript
interface Prediction {
  id: number;
  patientId: number;
  imagePath: string;
  segmentationPath: string;
  overlayPath: string;
  predictedClass: string;
  confidence: number;
  adenocarcinomaProbability: number;
  highGradeProbability: number;
  lowGradeProbability: number;
  normalProbability: number;
  polypProbability: number;
  serratedProbability: number;
  createdAt: string;
}
```

### Report (Frontend ↔ Backend)
```typescript
interface Report {
  id: number;
  patientId: number;
  predictionId: number;
  reportPath: string;
  createdAt: string;
}
```

### FastAPI Prediction Response
```python
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
  "mask_base64": "iVBORw0KGgoAAAANSUhEUgAA..."  # PNG base64
}
```

---

## Frontend API Calls vs Backend Endpoints

| Frontend Call | Backend Endpoint | Match |
|---------------|------------------|-------|
| `api.post("/auth/register", data)` | `POST /api/auth/register` | ✅ |
| `api.post("/auth/login", {...})` | `POST /api/auth/login` | ✅ |
| `api.post("/auth/admin/login", {...})` | `POST /api/auth/admin/login` | ✅ |
| `api.get("/admin/users/pending")` | `GET /api/admin/users/pending` | ✅ |
| `api.get("/admin/users/approved")` | `GET /api/admin/users/approved` | ✅ |
| `api.put("/admin/users/{id}/approve")` | `PUT /api/admin/users/{id}/approve` | ✅ |
| `api.put("/admin/users/{id}/reject")` | `PUT /api/admin/users/{id}/reject` | ✅ |
| `api.put("/admin/users/{id}/suspend")` | `PUT /api/admin/users/{id}/suspend` | ✅ |
| `api.post("/patients", data)` | `POST /api/patients` | ✅ |
| `api.get("/patients")` | `GET /api/patients` | ✅ |
| `api.post("/prediction", formData)` | `POST /api/prediction` | ✅ |
| `api.get("/predictions/{patientId}")` | `GET /api/predictions/{patientId}` | ✅ |
| `api.get("/reports/{id}")` | `GET /api/reports/{id}` | ✅ |
| `api.get("/reports/{id}/download")` | `GET /api/reports/{id}/download` | ✅ |

**Missing Frontend Calls** (endpoints exist but no frontend page):
- `GET /api/patients` → Patient list page
- `GET /api/patients/{id}` → Patient detail page
- `GET /api/predictions/{patientId}` → Prediction history page
- `GET /api/reports/{id}` → Report view page

---

## Error Response Format

All error responses follow:
```json
{
  "detail": "Human-readable error message"
}
```

| HTTP Code | Meaning | When |
|-----------|---------|------|
| 400 | Bad Request | Validation failed, invalid input |
| 401 | Unauthorized | Invalid/expired token, bad credentials |
| 403 | Forbidden | Valid token but insufficient role |
| 404 | Not Found | Resource doesn't exist or not owned |
| 415 | Unsupported Media Type | Invalid file type uploaded |
| 503 | Service Unavailable | ML models not loaded, FastAPI down |