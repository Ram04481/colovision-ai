# Requirements

## Functional Requirements

### User Management
| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| FR-001 | User registration with name, email, phone, username, password | ✅ DONE | `AuthController.register`, `AuthService.register` |
| FR-002 | New users have status PENDING | ✅ DONE | `User.status` defaults to "PENDING" |
| FR-003 | Admin can view pending users | ✅ DONE | `AdminController.pending()`, `AdminDashboard` |
| FR-004 | Admin can approve users → status=APPROVED | ⚠️ PARTIAL | `AdminController.approve()` sets APPROVED, but `AdminService.approveUser()` sets ACTIVE |
| FR-005 | Admin can reject users → status=REJECTED | ✅ DONE | `AdminController.reject()` |
| FR-006 | Admin can suspend users → status=SUSPENDED | ✅ DONE | `AdminController.suspend()` |
| FR-007 | Only APPROVED users can login | ✅ DONE | `AuthService.login` checks status |
| FR-008 | Admin login separate from user login | ✅ DONE | `/api/auth/admin/login` endpoint |

### Authentication
| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| FR-009 | JWT access tokens with 60-min expiry | ✅ DONE | `JwtService.create()`, `application.yml` |
| FR-010 | BCrypt password hashing | ✅ DONE | `AuthService.encoder` |
| FR-011 | Role claim in JWT (user/admin) | ✅ DONE | `JwtService.create()` adds role claim |
| FR-012 | Stateless JWT validation filter | ✅ DONE | `SecurityConfig.Filter` |
| FR-013 | Protected routes require valid JWT | ✅ DONE | `SecurityConfig` authorizeHttpRequests |
| FR-014 | Frontend route protection | ❌ MISSING | No `PrivateRoute` in `App.tsx` |

### Patient Management
| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| FR-015 | Create patient with ID, name, age, gender, address, contact | ✅ DONE | `PatientController.create`, `Patient.Input` |
| FR-016 | Patient ID uniqueness enforced | ✅ DONE | `PatientController.create` checks `findByPatientId` |
| FR-017 | List patients for current user | ✅ DONE | `PatientController.all()` |
| FR-018 | View patient detail with ownership check | ✅ DONE | `PatientController.detail()` |
| FR-019 | Patient photo upload | ❌ MISSING | `Patient.photoPath` exists but no endpoint |

### Image Upload
| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| FR-020 | Accept JPG, JPEG, PNG | ✅ DONE | `PredictionController` checks content-type |
| FR-021 | Max file size 10MB | ✅ DONE | `application.yml` multipart config |
| FR-022 | Validate image readability | ✅ DONE | `ImageIO.read()` check |
| FR-023 | Validate file content (magic bytes) | ❌ MISSING | Only checks Content-Type header |

### AI Inference
| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| FR-024 | Segmentation: U-Net ResNet34, 256×256 input | ❌ MISSING | `ModelService` uses ONNX but models not present |
| FR-025 | Classification: EfficientNet-B0, 224×224 input, 6 classes | ❌ MISSING | `ModelService` uses ONNX but models not present |
| FR-026 | Preprocessing matches training (ImageNet norm) | ✅ DONE | `ModelService.tensor()` uses correct mean/std |
| FR-027 | Return mask, overlay, predicted class, confidence, all 6 probs | ✅ DONE | `ModelService.Result` + `PredictionController` |
| FR-028 | Save prediction with all probabilities | ✅ DONE | `Prediction` entity has 6 probability fields |
| FR-029 | FastAPI ML service with PyTorch models | ❌ MISSING | Only stub `app.py` exists |

### Reporting
| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| FR-030 | Generate PDF report on demand | ✅ DONE | `ReportController` + `ReportService` (PDFBox) |
| FR-031 | Report includes patient info, prediction, probabilities | ✅ DONE | `ReportService.write()` |
| FR-032 | Download PDF report | ✅ DONE | `ReportController.download()` |
| FR-033 | View report in browser | ❌ MISSING | No frontend report view page |

### Frontend UI
| ID | Requirement | Status | Evidence |
|----|-------------|--------|----------|
| FR-034 | Home page with project info | ✅ DONE | `Home.tsx` |
| FR-035 | Login page (user + admin toggle) | ✅ DONE | `Login.tsx` |
| FR-036 | Registration page | ✅ DONE | `Register.tsx` |
| FR-037 | Dashboard with stats + add patient link | ⚠️ PARTIAL | `Dashboard.tsx` shows hardcoded zeros |
| FR-038 | Add patient + image upload form | ✅ DONE | `AddPatient.tsx` |
| FR-039 | Admin dashboard (pending/approved tabs) | ✅ DONE | `AdminDashboard.tsx` |
| FR-040 | Patient list page | ❌ MISSING | Not in `App.tsx` routes |
| FR-041 | Prediction history page | ❌ MISSING | Not in `App.tsx` routes |
| FR-042 | Report view/download page | ❌ MISSING | Not in `App.tsx` routes |

## Non-Functional Requirements

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| NFR-001 | JWT secret configurable via env | ✅ DONE | `JWT_SECRET_KEY` env var |
| NFR-002 | Database credentials via env | ✅ DONE | `DATABASE_USERNAME`, `DATABASE_PASSWORD` |
| NFR-003 | CORS configurable | ✅ DONE | `app.cors-origins` |
| NFR-004 | Upload directory configurable | ✅ DONE | `app.upload-dir` |
| NFR-005 | Models directory configurable | ✅ DONE | `app.models-dir` |
| NFR-006 | Rate limiting on auth endpoints | ❌ MISSING | No Bucket4j or similar |
| NFR-007 | Request validation on all endpoints | ⚠️ PARTIAL | Bean validation present, no content validation |
| NFR-008 | Proper HTTP status codes | ✅ DONE | `ApiExceptionHandler` maps exceptions |
| NFR-009 | Error responses without stack traces | ✅ DONE | `ApiExceptionHandler` returns `detail` only |
| NFR-010 | Database migrations (Flyway/Liquibase) | ❌ MISSING | Uses `ddl-auto: update` |
| NFR-011 | API documentation (OpenAPI) | ❌ MISSING | No SpringDoc |
| NFR-012 | Health check endpoint | ✅ DONE | `/health` returns `{"status":"ok"}` |

## Admin Requirements

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| ADM-001 | No public admin registration | ✅ DONE | No `/api/auth/admin/register` endpoint |
| ADM-002 | First admin created via controlled seed | ❌ MISSING | README says manual SQL insert |
| ADM-003 | Admin can view all pending users | ✅ DONE | `/api/admin/users/pending` |
| ADM-004 | Admin can view all approved users | ✅ DONE | `/api/admin/users/approved` |
| ADM-005 | Admin approve/reject/suspend actions | ✅ DONE | PUT endpoints exist |
| ADM-006 | Admin APIs protected by ROLE_ADMIN | ✅ DONE | `AdminController.admin()` check |

## AI Requirements

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| AI-001 | Real PyTorch models (no mocks) | ❌ MISSING | `.pth` files exist but not integrated |
| AI-002 | Segmentation output: mask + overlay | ✅ DONE | `ModelService` creates both |
| AI-003 | Classification: 6 classes as trained | ⚠️ NEEDS VERIFICATION | Class name case mismatch possible |
| AI-004 | Preprocessing identical to training | ⚠️ NEEDS VERIFICATION | Need to verify against notebooks |
| AI-005 | Model loading at startup (not per-request) | ✅ DONE | `ModelService` constructor loads ONNX |
| AI-006 | GPU support if available | ⚠️ PARTIAL | ONNX Runtime CPU only in pom.xml |

## Security Requirements

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| SEC-001 | JWT secret not hardcoded | ⚠️ PARTIAL | Default in `application.yml` is insecure |
| SEC-002 | Passwords never logged | ✅ DONE | No logging of passwords found |
| SEC-003 | SQL injection prevention | ✅ DONE | JPA parameterized queries |
| SEC-004 | File upload validation | ⚠️ PARTIAL | Only content-type, no magic bytes |
| SEC-005 | Path traversal prevention | ✅ DONE | UUID filenames |
| SEC-006 | Resource ownership checks | ✅ DONE | Patient/prediction ownership verified |
| SEC-007 | Admin privilege escalation prevention | ✅ DONE | Separate admin table, ROLE_ADMIN check |
| SEC-008 | CORS restricted to frontend origin | ✅ DONE | Configurable via `app.cors-origins` |
| SEC-009 | Secure headers (HSTS, CSP) | ❌ MISSING | Not configured |

## Reporting Requirements

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| REP-001 | PDF report with patient details | ✅ DONE | `ReportService` |
| REP-002 | PDF report with prediction results | ✅ DONE | Includes class, confidence, all probs |
| REP-003 | Report downloadable | ✅ DONE | `ReportController.download()` |
| REP-004 | Report viewable in browser | ❌ MISSING | No frontend page |