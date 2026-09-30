# Backend (Spring Boot)

## Tech Stack
- Spring Boot 3.4.3
- Java 17
- Spring Web (REST)
- Spring Data JPA (Hibernate)
- Spring Security (JWT)
- Spring Validation (Bean Validation)
- MySQL Connector/J
- ONNX Runtime 1.20.0 (for model inference)
- PDFBox 3.0.3 (PDF generation)
- jjwt 0.12.6 (JWT)

---

## Package Structure
```
com.colovision
├── ColoVisionApplication.java
├── config/
│   ├── AppProperties.java       # @ConfigurationProperties
│   └── WebConfig.java           # CORS config
├── controller/
│   ├── AdminController.java     # /api/admin/**
│   ├── ApiExceptionHandler.java # Global exception handling
│   ├── AuthController.java      # /api/auth/**
│   ├── HealthController.java    # /health
│   ├── MlController.java        # /api/ml/** (DEAD CODE)
│   ├── PatientController.java   # /api/patients
│   ├── PredictionController.java # /api/prediction, /api/predictions
│   └── ReportController.java    # /api/reports/**
├── model/
│   ├── Admin.java
│   ├── Patient.java
│   ├── Prediction.java
│   ├── Report.java
│   └── User.java
├── repository/
│   ├── AdminRepository.java
│   ├── PatientRepository.java
│   ├── PredictionRepository.java
│   ├── ReportRepository.java
│   └── UserRepository.java
├── security/
│   ├── JwtService.java          # JWT create/parse
│   └── SecurityConfig.java      # Security filter chain
└── service/
    ├── AdminService.java        # Admin business logic
    ├── AuthService.java         # Auth business logic
    ├── ModelService.java        # ONNX inference (CURRENT)
    ├── MlService.java           # FastAPI client (DEAD CODE)
    └── ReportService.java       # PDF generation
```

---

## Configuration (`application.yml`)

```yaml
server:
  port: ${SERVER_PORT:8080}

spring:
  datasource:
    url: ${DATABASE_URL:jdbc:mysql://localhost:3306/colorectal_ai?createDatabaseIfNotExist=true&serverTimezone=UTC}
    username: ${DATABASE_USERNAME:root}
    password: ${DATABASE_PASSWORD:ram123}
  jpa:
    hibernate.ddl-auto: update
    open-in-view: false
  servlet.multipart.max-file-size: ${MAX_UPLOAD_MB:10}MB
  servlet.multipart.max-request-size: ${MAX_UPLOAD_MB:10}MB

app:
  jwt-secret: ${JWT_SECRET_KEY:change-this-to-a-long-random-secret-at-least-32-characters}
  access-token-expire-minutes: ${ACCESS_TOKEN_EXPIRE_MINUTES:60}
  cors-origins: ${CORS_ORIGINS:http://localhost:5173}
  upload-dir: ${UPLOAD_DIR:uploads}
  models-dir: ${MODELS_DIR:models}
```

---

## Controllers

### AuthController (`/api/auth`)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/register` | User registration (PENDING) |
| POST | `/login` | User login → JWT (ROLE_USER) |
| POST | `/admin/login` | Admin login → JWT (ROLE_ADMIN) |

### AdminController (`/api/admin`) - Requires ROLE_ADMIN
| Method | Path | Description |
|--------|------|-------------|
| GET | `/users/pending` | List PENDING users |
| GET | `/users/approved` | List APPROVED users |
| PUT | `/users/{id}/approve` | Approve user |
| PUT | `/users/{id}/reject` | Reject user |
| PUT | `/users/{id}/suspend` | Suspend user |

### PatientController (`/api/patients`) - Requires ROLE_USER
| Method | Path | Description |
|--------|------|-------------|
| POST | `/` | Create patient (ownership: createdBy) |
| GET | `/` | List current user's patients |
| GET | `/{id}` | Get patient (ownership check) |

### PredictionController (`/api`) - Requires ROLE_USER
| Method | Path | Description |
|--------|------|-------------|
| POST | `/prediction` | Upload image + patient_id → inference → save |
| GET | `/predictions/{patientId}` | Patient's prediction history |

### ReportController (`/api/reports`) - Requires ROLE_USER
| Method | Path | Description |
|--------|------|-------------|
| GET | `/{id}` | Get report metadata (generates if missing) |
| GET | `/{id}/download` | Stream PDF file |

### MlController (`/api/ml`) - **DEAD CODE**
| Method | Path | Description |
|--------|------|-------------|
| POST | `/predict` | Delegates to MlService → calls non-existent FastAPI |

### HealthController
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Returns `{"status":"ok"}` |

---

## Services

### AuthService
- `register(name, email, phone, username, password)` → creates User (PENDING)
- `login(identifier, password, admin)` → validates, returns JWT
- `currentUser(id)` → loads User, verifies APPROVED
- `currentAdmin(id)` → loads Admin
- Uses `BCryptPasswordEncoder`

### AdminService
- `getPendingUsers()` / `getActiveMembers()` (uses "ACTIVE" status - BUG)
- `approveUser(id, adminId)` → sets status="ACTIVE" (should be "APPROVED")
- `rejectUser(id, adminId)` → sets status="REJECTED"
- `suspendUser(id)` → sets status="SUSPENDED"
- **Duplicate logic with AdminController** (controller doesn't use service)

### ModelService (ONNX Inference)
- Loads ONNX models at startup from `app.models-dir`
- `predict(BufferedImage)` → runs segmentation + classification
- **Issues**: Models missing, hardcoded threshold, coordinate mapping bug, hardcoded class names
- Uses ONNX Runtime Java API

### MlService - **DEAD CODE**
- RestClient to `http://127.0.0.1:8000` (FastAPI)
- Called by MlController
- FastAPI doesn't exist yet

### ReportService
- `write(Path, Patient, Prediction)` → generates PDF with PDFBox
- Includes patient info, prediction results, all 6 probabilities

---

## Security

### SecurityConfig
- Stateless session management
- JWT filter (`OncePerRequestFilter`)
- Permits: `/health`, `/api/auth/**`, `/error`
- All other requests: authenticated

### JwtService
- HS256 signing
- Claims: `sub` (user/admin ID), `role` ("user"/"admin")
- Expiry: configurable (default 60 min)
- Secret from `app.jwt-secret`

---

## File Storage

```
uploads/
├── images/           # Original uploads (UUID + ext)
├── results/          # Masks + overlays (UUID_mask.png, UUID_overlay.png)
└── reports/          # PDFs (prediction_{id}.pdf)
```

Configured via `app.upload-dir` (default `uploads`)

---

## Current Issues

| Issue | Location | Severity |
|-------|----------|----------|
| Dead MlService/MlController | `service/MlService.java`, `controller/MlController.java` | HIGH |
| Admin status inconsistency ("ACTIVE" vs "APPROVED") | `AdminService.java` vs `AdminController.java` | HIGH |
| Missing ONNX models | `models/` directory empty | CRITICAL |
| Hardcoded segmentation threshold (0.5) | `ModelService.java:40` | MEDIUM |
| Segmentation coordinate mapping assumes square | `ModelService.java:39` | HIGH |
| Hardcoded class names (Title Case vs lowercase) | `ModelService.java:14` | HIGH |
| No Flyway migrations | `pom.xml` | MEDIUM |
| No database indexes | Entity classes | MEDIUM |
| No rate limiting | - | MEDIUM |
| Default JWT secret insecure | `application.yml:14` | CRITICAL |
| Absolute paths in API response | `PredictionController.java:130-131` | MEDIUM |
| No admin seeding | - | CRITICAL |
| No SpringDoc OpenAPI | `pom.xml` | LOW |

---

## Required Changes (Priority)

1. **Remove dead code**: Delete `MlService`, `MlController`
2. **Fix admin status**: Use "APPROVED" everywhere, remove `AdminService` duplicate logic
3. **Add model files**: Export `.pth` → ONNX, place in `models/`
4. **Fix ModelService**: Configurable threshold, aspect-ratio-aware mapping, load class names from ONNX metadata
5. **Add Flyway**: Schema versioning
6. **Add indexes**: On `users.status`, `patients.created_by`, `predictions.patient_id`
7. **Add admin seeder**: `CommandLineRunner` from env vars
8. **Fail on default JWT secret**: Startup check
9. **Return relative URLs**: Not absolute filesystem paths
10. **Add SpringDoc**: API documentation
11. **Add rate limiting**: Bucket4j on auth endpoints