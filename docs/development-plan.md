# Development Plan

## Master Roadmap

### PHASE 0 — Repository and Documentation Foundation
**Goal**: Establish documentation, gitignore, and project structure
**Current Status**: ✅ COMPLETED (this documentation set)
**Prerequisites**: None
**Tasks**:
- [x] Create docs/ directory with all required files
- [x] Document current architecture, requirements, status
- [ ] Create .gitignore
- [ ] Create AGENTS.md coding rules
- [ ] Create .env.example
**Files**: All docs/*, .gitignore, AGENTS.md, .env.example
**Verification**: All docs exist and are accurate; gitignore covers secrets/artifacts
**Dependencies**: None
**Risks**: None
**Exit Criteria**: Documentation complete, gitignore ready, AGENTS.md established

---

### PHASE 1 — Project/Build/Startup Stabilization
**Goal**: All three services start without errors
**Current Status**: ⚠️ PARTIAL (Spring Boot and React work; FastAPI is stub; models missing)
**Prerequisites**: Java 17, Maven, Node.js, MySQL, Python 3.10+
**Tasks**:
- [ ] Verify Spring Boot starts: `mvn spring-boot:run` → `/health` returns ok
- [ ] Verify React dev server: `npm run dev` → loads on 5173
- [ ] Create functional FastAPI service in `ML_API/` with model loading
- [ ] Export `.pth` → ONNX (or use PyTorch directly in FastAPI)
- [ ] Place model files where services expect them
- [ ] Configure environment variables for all services
**Files**: `backend/pom.xml`, `backend/src/main/resources/application.yml`, `frontend/package.json`, `ML_API/app.py`, `ML_API/requirements.txt`, `ML_API/export_onnx.py`
**Verification**: 
- `curl http://localhost:8080/health` → `{"status":"ok"}`
- `curl http://localhost:5173` → React app loads
- `curl http://localhost:8000/health` → FastAPI health
- FastAPI loads both models at startup without errors
**Dependencies**: PHASE 0
**Risks**: Model export fails; PyTorch version mismatch; ONNX Runtime compatibility
**Exit Criteria**: All three services start and respond to health checks

---

### PHASE 2 — Database Configuration and Integrity
**Goal**: Reliable, versioned database schema with proper constraints
**Current Status**: ⚠️ PARTIAL (Hibernate auto-update works but no migrations, missing indexes)
**Prerequisites**: MySQL running, PHASE 1 complete
**Tasks**:
- [ ] Add Flyway migration scripts for initial schema
- [ ] Add indexes: `users.status`, `patients.created_by`, `predictions.patient_id`
- [ ] Add foreign key constraint on `predictions.patient_id` → `patients.id`
- [ ] Remove redundant `reports.patient_id` (derivable via prediction)
- [ ] Add cascade/delete rules where appropriate
- [ ] Verify schema matches JPA entities exactly
**Files**: `backend/src/main/resources/db/migration/V1__init.sql`, entity classes
**Verification**: `mvn flyway:migrate` succeeds; queries use indexes; FK enforced
**Dependencies**: PHASE 1
**Risks**: Data loss if migration run against existing data
**Exit Criteria**: Flyway baseline + migrations work; schema documented

---

### PHASE 3 — Spring Boot Backend Structure
**Goal**: Clean, maintainable backend codebase
**Current Status**: ✅ MOSTLY DONE (good structure, some dead code)
**Prerequisites**: PHASE 1
**Tasks**:
- [ ] Remove dead `MlService` and `MlController` (call non-existent FastAPI)
- [ ] Consolidate admin logic: use `AdminService` from `AdminController`
- [ ] Fix status inconsistency: use "APPROVED" everywhere (not "ACTIVE")
- [ ] Add input validation: file magic bytes, dimensions, patient fields
- [ ] Return relative URLs for mask/overlay (not absolute paths)
- [ ] Add pagination to list endpoints
- [ ] Add API documentation (SpringDoc OpenAPI)
**Files**: `AdminController.java`, `AdminService.java`, `PredictionController.java`, `ModelService.java`, `pom.xml`
**Verification**: No dead code; admin workflow consistent; OpenAPI UI accessible
**Dependencies**: PHASE 1
**Risks**: Breaking existing frontend calls
**Exit Criteria**: Clean backend; all endpoints documented; validation robust

---

### PHASE 4 — Authentication and User Registration
**Goal**: Secure, working user registration and login
**Current Status**: ✅ BACKEND DONE, ❌ FRONTEND UNPROTECTED
**Prerequisites**: PHASE 1, PHASE 3
**Tasks**:
- [ ] Verify JWT secret fails startup if default/weak
- [ ] Add token refresh mechanism (optional but recommended)
- [ ] Frontend: Create `AuthContext` + `useAuth` hook
- [ ] Frontend: Implement `PrivateRoute` wrapper
- [ ] Frontend: Protect `/dashboard`, `/patients/*`, `/admin`
- [ ] Frontend: Redirect to login on 401
- [ ] Frontend: Store token in httpOnly cookie (optional) or localStorage
**Files**: `SecurityConfig.java`, `JwtService.java`, `frontend/src/context/AuthContext.tsx`, `frontend/src/components/PrivateRoute.tsx`, `frontend/src/App.tsx`
**Verification**: Unauthenticated access to `/dashboard` redirects to `/login`; valid token grants access
**Dependencies**: PHASE 1, PHASE 3
**Risks**: Token storage security (localStorage vs cookie)
**Exit Criteria**: Frontend routes protected; auth state managed centrally

---

### PHASE 5 — Admin Authentication and Authorization
**Goal**: Secure admin system with controlled bootstrap
**Current Status**: ⚠️ PARTIAL (backend works, no seed, frontend route missing)
**Prerequisites**: PHASE 4
**Tasks**:
- [ ] Add `CommandLineRunner` to seed first admin from env vars (`ADMIN_EMAIL`, `ADMIN_PASSWORD`)
- [ ] Frontend: Add `/admin` route to `App.tsx` → `AdminDashboard`
- [ ] Frontend: Admin-only route protection (check role claim)
- [ ] Verify `ROLE_ADMIN` required for all `/api/admin/**` endpoints
- [ ] Remove any path to admin privilege escalation
**Files**: `ColoVisionApplication.java` (or new `AdminSeeder.java`), `frontend/src/App.tsx`, `AdminController.java`
**Verification**: Fresh DB + env vars → admin created; admin can login; non-admin cannot access admin APIs
**Dependencies**: PHASE 4
**Risks**: Env var handling in production
**Exit Criteria**: Admin bootstrap works; admin UI accessible only to admins

---

### PHASE 6 — User Approval Workflow
**Goal**: Complete pending → approved/rejected/suspended flow
**Current Status**: ✅ COMPLETED (Backend + Frontend both done)
**Prerequisites**: PHASE 5
**Tasks**:
- [x] Verify status values consistent: "PENDING" → "APPROVED"/"REJECTED"/"SUSPENDED"
- [x] Frontend: Real-time updates after approve/reject/suspend
- [x] Frontend: Loading states on admin actions
- [ ] Backend: Audit log for admin actions (optional)
**Files**: `AdminService.java`, `AdminController.java`, `AdminDashboard.tsx`
**Verification**: Register user → appears in admin pending → approve → user can login
**Dependencies**: PHASE 5
**Risks**: Status inconsistency (already identified)
**Exit Criteria**: End-to-end approval flow works

---

### PHASE 7 — Patient Management
**Goal**: Complete patient CRUD with ownership
**Current Status**: ✅ COMPLETED (Backend + Frontend integrated in Dashboard)
**Prerequisites**: PHASE 4
**Tasks**:
- [x] Frontend: Patient list page (integrated in Dashboard)
- [x] Frontend: Patient detail page (via prediction history)
- [ ] Frontend: Edit patient (optional)
- [ ] Backend: Add patient photo upload endpoint
- [ ] Frontend: Photo upload in create/edit
**Files**: `PatientController.java`, `Dashboard.tsx`, `PredictionHistory.tsx`
**Verification**: User creates patient → sees in list → views detail → owns data
**Dependencies**: PHASE 4
**Risks**: None
**Exit Criteria**: Full patient lifecycle in UI

---

### PHASE 8 — Image Upload and Validation
**Goal**: Secure, validated image upload
**Current Status**: ✅ COMPLETED (Content-Type, size limits, UUID filenames)
**Prerequisites**: PHASE 7
**Tasks**:
- [x] Backend: Content-Type validation (JPEG/PNG only)
- [x] Backend: Size limits (10MB via config)
- [x] Backend: UUID filenames prevent path traversal
- [ ] Backend: Add magic bytes validation (JPEG: FF D8 FF, PNG: 89 50 4E 47)
- [ ] Backend: Add image dimension limits (e.g., max 4096×4096)
- [ ] Frontend: Image preview before upload
- [ ] Frontend: Progress indicator for large uploads
- [ ] Backend: Virus scan integration point (ClamAV) - optional
**Files**: `PredictionController.java`, `AddPatient.tsx`, `application.yml`
**Verification**: Invalid files rejected; valid files accepted; preview works
**Dependencies**: PHASE 7
**Risks**: False positives on validation
**Exit Criteria**: Robust upload validation; good UX

---

### PHASE 9 — FastAPI ML Service Stabilization
**Goal**: Production-ready FastAPI service with real model inference
**Current Status**: ✅ COMPLETED (FastAPI runs with real PyTorch models)
**Prerequisites**: PHASE 1 (models exported/available)
**Tasks**:
- [x] Create `ML_API/app.py` with FastAPI app
- [x] Implement model loading at startup (segmentation + classification)
- [x] Implement `/predict` endpoint: multipart image → JSON response
- [x] Match training preprocessing EXACTLY (resize, normalize, tensor)
- [x] Add request validation, error handling, logging
- [x] Add `/health` endpoint
- [x] Configure CORS for Spring Boot origin only
- [x] Create `requirements.txt` with pinned versions
- [ ] Add Dockerfile for ML service (optional)
**Files**: `ML_API/app.py`, `ML_API/requirements.txt`
**Verification**: `POST /predict` with test image → returns valid prediction JSON
**Dependencies**: PHASE 1 (model files ready)
**Risks**: Preprocessing mismatch; model loading memory; PyTorch/ONNX version conflicts
**Exit Criteria**: FastAPI service runs, loads models, returns predictions matching training evaluation

---

### PHASE 10 — Segmentation Model Integration
**Goal**: Segmentation model working in FastAPI
**Current Status**: ✅ COMPLETED (U-Net ResNet34 loaded and inferencing)
**Prerequisites**: PHASE 9
**Tasks**:
- [x] Load `best_segmentation_model.pth` (U-Net ResNet34)
- [x] Implement preprocessing: resize 256×256, ImageNet normalize, CHW tensor
- [x] Run inference: `model.eval()`, `torch.no_grad()`
- [x] Post-process: sigmoid → threshold 0.5 → binary mask
- [x] Return mask as base64 PNG
- [x] Verify output matches training evaluation (Dice/IoU)
**Files**: `ML_API/app.py`
**Verification**: Test image → mask matches expected output from training notebook
**Dependencies**: PHASE 9
**Risks**: Threshold tuning; input size handling for non-square images
**Exit Criteria**: Segmentation inference working, tested

---

### PHASE 11 — Classification Model Integration
**Goal**: Classification model working in FastAPI
**Current Status**: ✅ COMPLETED (EfficientNet-B0 loaded and inferencing)
**Prerequisites**: PHASE 9
**Tasks**:
- [x] Load `best_classifier_model_v3.pth` (EfficientNet-B0)
- [x] Implement preprocessing: resize 224×224, ImageNet normalize, CHW tensor
- [x] Run inference: `model.eval()`, `torch.no_grad()`
- [x] Post-process: softmax → 6 probabilities → argmax → predicted class
- [x] **CRITICAL**: Verify class order matches training checkpoint `class_names`
- [x] Return all 6 probabilities + predicted class + confidence
**Files**: `ML_API/app.py`
**Verification**: Test images from training set → predictions match training evaluation
**Dependencies**: PHASE 9
**Risks**: Class order mismatch (training: lowercase, inference: Title Case); preprocessing differences
**Exit Criteria**: Classification inference working, class mapping verified

---

### PHASE 12 — End-to-End AI Inference Pipeline
**Goal**: Complete FastAPI `/predict` combining segmentation + classification
**Current Status**: ✅ COMPLETED (Single endpoint returns mask + classification + 6 probs)
**Prerequisites**: PHASE 10, PHASE 11
**Tasks**:
- [x] Combine segmentation + classification in single `/predict` request
- [x] Classification uses full image (verified with training)
- [x] Optimize: run both models, return combined response
- [x] Add timing/metrics logging
- [x] Handle errors gracefully (model errors → 503 with detail)
**Files**: `ML_API/app.py`
**Verification**: Single request → returns mask + classification + probabilities
**Dependencies**: PHASE 10, PHASE 11
**Risks**: Memory usage with both models; inference latency
**Exit Criteria**: Complete pipeline working, tested with sample images

---

### PHASE 13 — Prediction Persistence
**Goal**: Spring Boot saves FastAPI results to database
**Current Status**: ✅ COMPLETED (Spring Boot → FastAPI → DB works end-to-end)
**Prerequisites**: PHASE 12
**Tasks**:
- [x] Spring Boot `PredictionController` calls FastAPI `/predict`
- [x] Handle FastAPI errors (timeout, 503, validation)
- [x] Save mask/overlay to filesystem, paths to DB
- [x] Save all 6 probabilities to `Prediction` entity
- [x] Return prediction ID + results to frontend
**Files**: `PredictionController.java`, `MlService.java`, `AppProperties.java`
**Verification**: Upload image → prediction saved in DB → mask/overlay files exist → response returned
**Dependencies**: PHASE 12
**Risks**: Network failures between services; file storage paths
**Exit Criteria**: End-to-end prediction persistence working

---

### PHASE 14 — Frontend/Backend Integration
**Goal**: Frontend fully connected to working backend
**Current Status**: ✅ COMPLETED (All API calls work end-to-end)
**Prerequisites**: PHASE 13
**Tasks**:
- [x] Test all frontend API calls against working backend
- [x] Fix any contract mismatches
- [x] Add loading states to all async operations
- [x] Add error boundaries and user-friendly error messages
- [x] Test admin workflow end-to-end
**Files**: `frontend/src/services/api.ts`, all frontend pages
**Verification**: Full user journey: register → approve → login → create patient → upload → see results
**Dependencies**: PHASE 13
**Risks**: CORS issues; token expiry during long uploads
**Exit Criteria**: Complete user workflow functional

---

### PHASE 15 — Prediction Result UI
**Goal**: Rich prediction visualization
**Current Status**: ✅ COMPLETED (PredictionDetail + PredictionHistory pages implemented)
**Prerequisites**: PHASE 14
**Tasks**:
- [x] Frontend: Prediction detail page showing original, mask, overlay side-by-side
- [x] Frontend: Probability bars for 6 classes with color coding
- [x] Frontend: Confidence indicator with color coding
- [x] Frontend: Patient prediction history page
- [x] Frontend: Download mask/overlay images (via report)
**Files**: `PredictionDetail.tsx`, `PredictionHistory.tsx`, `ReportView.tsx`
**Verification**: User sees visual comparison; probability bars render correctly
**Dependencies**: PHASE 14
**Risks**: Image loading performance
**Exit Criteria**: Rich prediction UI complete

---

### PHASE 16 — PDF Reporting
**Goal**: Professional PDF reports
**Current Status**: ✅ COMPLETED (Backend + Frontend ReportView page)
**Prerequisites**: PHASE 14
**Tasks**:
- [x] Frontend: Report view page (`/report/:id`)
- [x] Frontend: Trigger report generation, show loading
- [x] Frontend: Download button + Open in new tab
- [x] Frontend: PDF preview via iframe
- [ ] Backend: Enhance report with images (original, mask, overlay embedded)
- [ ] Backend: Add report metadata (generated at, generated by)
**Files**: `ReportService.java`, `ReportController.java`, `ReportView.tsx`
**Verification**: Report generates with all content; downloads correctly
**Dependencies**: PHASE 14
**Risks**: PDFBox image embedding complexity; large PDF size
**Exit Criteria**: Reports viewable and downloadable from UI

---

### PHASE 17 — Security Hardening
**Goal**: Production-grade security
**Current Status**: ⚠️ PARTIAL (basics done, gaps remain)
**Prerequisites**: PHASE 16
**Tasks**:
- [ ] Rate limiting on auth endpoints (Bucket4j)
- [ ] Rate limiting on prediction endpoint
- [ ] Secure headers (HSTS, CSP, X-Frame-Options)
- [ ] File upload: virus scan integration (ClamAV)
- [ ] Audit logging for sensitive actions
- [ ] JWT: short expiry + refresh token rotation
- [ ] Password strength requirements
- [ ] Brute-force protection (account lockout)
- [ ] Dependency vulnerability scan (OWASP Dependency Check)
**Files**: `SecurityConfig.java`, `pom.xml`, `application.yml`, new filter classes
**Verification**: Security scan passes; penetration test basics pass
**Dependencies**: PHASE 16
**Risks**: Performance impact of rate limiting
**Exit Criteria**: Security checklist complete

---

### PHASE 18 — Testing
**Goal**: Automated test coverage
**Current Status**: ❌ MISSING (no tests)
**Prerequisites**: PHASE 17
**Tasks**:
- [ ] Backend: Unit tests for services (JUnit + Mockito)
- [ ] Backend: Integration tests for controllers (@SpringBootTest)
- [ ] Backend: Repository tests (@DataJpaTest)
- [ ] Backend: Security tests (auth/authorization)
- [ ] Frontend: Component tests (Vitest + React Testing Library)
- [ ] Frontend: E2E tests (Playwright/Cypress)
- [ ] ML Service: Inference tests with known images
- [ ] API contract tests (Pact or similar)
- [ ] CI pipeline: build → test → lint
**Files**: `backend/src/test/`, `frontend/src/test/`, `ML_API/test/`, `.github/workflows/ci.yml`
**Verification**: CI passes; coverage > 70% for critical paths
**Dependencies**: PHASE 17
**Risks**: Test maintenance overhead; flaky E2E tests
**Exit Criteria**: Automated test suite runs in CI

---

### PHASE 19 — Deployment Preparation
**Goal**: Production-ready deployment configs
**Current Status**: ❌ MISSING
**Prerequisites**: PHASE 18
**Tasks**:
- [ ] Docker Compose for local stack (frontend, Spring Boot, FastAPI, MySQL)
- [ ] Production Dockerfiles for each service
- [ ] Kubernetes manifests (optional) or Render/Railway/Fly.io configs
- [ ] Environment variable documentation
- [ ] Model file handling strategy (Git LFS or external storage)
- [ ] Database backup/restore procedure
- [ ] Log aggregation setup
- [ ] Monitoring/alerting (Prometheus/Grafana or cloud equivalent)
**Files**: `docker-compose.yml`, `Dockerfile*`, `k8s/`, `deployment/`
**Verification**: `docker-compose up` → full stack running
**Dependencies**: PHASE 18
**Risks**: Model file size in containers; GPU access for ML service
**Exit Criteria**: One-command production-like deployment

---

### PHASE 20 — Final Project Cleanup and Documentation
**Goal**: Polished, documented, deliverable project
**Current Status**: ❌ MISSING
**Prerequisites**: PHASE 19
**Tasks**:
- [ ] Update all docs to reflect final implementation
- [ ] Create professional README.md
- [ ] Verify .gitignore, no secrets committed
- [ ] Code cleanup: remove TODOs, unused imports, dead code
- [ ] Final security review
- [ ] Create demo data script
- [ ] Record architecture decision records for any late changes
**Files**: All docs/, README.md, AGENTS.md, source code
**Verification**: Fresh clone → follow README → working system
**Dependencies**: PHASE 19
**Risks**: Documentation drift
**Exit Criteria**: Project ready for submission/handoff