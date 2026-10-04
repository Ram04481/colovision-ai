# Changelog

## [Unreleased] - Phase 0: Documentation Foundation
### Added
- Complete documentation set in `docs/`
- Project overview, architecture, requirements
- Development plan with 20 phases
- Implementation status tracking
- API contract documentation
- Database design documentation
- Authentication and admin security docs
- ML models and inference pipeline docs
- Frontend and backend architecture docs
- Testing strategy
- Deployment guide
- Troubleshooting knowledge base

## [2024-09-30] - Initial Repository State
### Backend (Spring Boot)
- Spring Boot 3.4.3 with Java 17
- Spring Web, Data JPA, Security, Validation
- MySQL with Hibernate auto-update
- JWT authentication (jjwt 0.12.6)
- ONNX Runtime 1.20.0 for model inference
- PDFBox 3.0.3 for report generation
- Entities: Admin, User, Patient, Prediction, Report
- Controllers: Auth, Admin, Patient, Prediction, Report, Health
- Services: Auth, Admin, Model (ONNX), Report
- Security: JWT filter, BCrypt, role-based access
- CORS configuration
- Global exception handling

### Frontend (React + Vite)
- React 18 + TypeScript + Vite
- React Router v6
- Axios with Bearer token interceptor
- Tailwind CSS v4
- Framer Motion, Lucide React, Recharts
- Pages: Home, Login, Register, Dashboard, AddPatient, AdminDashboard, InfoPage
- Components: SiteLayout, FeatureCard
- API service with admin functions

### ML Assets
- Segmentation model: `best_segmentation_model.pth` (293 MB) - U-Net ResNet34
- Classification model: `best_classifier_model_v3.pth` (48 MB) - EfficientNet-B0
- Training notebooks: `final_segmentation.ipynb`, `final_mega_project__classification_model.ipynb`

### Known Issues at Baseline
- ONNX models not exported (backend ModelService non-functional)
- FastAPI ML service is stub only
- Frontend routes unprotected
- Admin bootstrap manual
- Status inconsistency: "ACTIVE" vs "APPROVED"
- Dead code: MlService, MlController
- No database migrations (Flyway)
- No indexes on query columns
- Default JWT secret insecure
- No rate limiting
- No tests

---

## [2026-10-01] - Phase 1: Project/Build/Startup Stabilization

### Verified
- Backend: Maven build successful (`mvn clean install` ✅)
- Backend: Spring Boot starts on port 8080, `/health` returns `{"status":"ok"}`
- Backend: MySQL connection verified (HikariPool connects to colorectal_ai DB)
- Backend: CORS configuration working
- Frontend: `npm run build` successful (Tailwind v4 @theme warnings noted)
- ML Service: FastAPI starts on port 8000, `/` returns `{"message":"ML API is running"}`
- ML Service: `.pth` model files exist (293 MB + 48 MB)

### Identified Issues (Phase 1)
- **Backend**: Application terminates after ~12 seconds (no foreground process management)
- **Backend**: Default JWT secret in `application.yml` (security risk)
- **Backend**: Generated security password used instead of configured JWT secret
- **Backend**: Dead code: `MlService` and `MlController` call non-existent FastAPI endpoint
- **Backend**: Admin status inconsistency ("ACTIVE" vs "APPROVED")
- **Backend**: No Flyway migrations, no database indexes
- **Backend**: `MlController` at `/api/ml/predict` delegates to broken `MlService`
- **Frontend**: Tailwind v4 `@theme` warnings during build (css-post timing)
- **Frontend**: No `/admin` route registered in `App.tsx`
- **Frontend**: No protected routes / auth context
- **ML Service**: FastAPI `/health` endpoint missing (returns 404)
- **ML Service**: `.pth` models not loaded at startup
- **ML Service**: `/predict` endpoint returns stub response
- **Config**: Spring Boot generates random security password instead of using JWT secret

### Root Causes
- Spring Boot's `UserDetailsServiceAutoConfiguration` activates due to missing custom UserDetailsService
- `MlService` hardcoded to `http://127.0.0.1:8000` but FastAPI wasn't running during testing
- Tailwind CSS v4 uses `@theme` directive not recognized by lightningcss
- FastAPI app missing `/health` endpoint
- Application runs but process exits when Maven plugin / background process ends

### Next Steps (Phase 2+)
- Fix Spring Boot security configuration to use JWT properly
- Remove dead `MlService`/`MlController` code
- Implement FastAPI model loading at startup
- Add `/health` endpoint to FastAPI
- Add Flyway migrations
- Add database indexes
- Implement admin seeding

---

## [2026-10-01] - Phase 2: Database Configuration and Integrity

### Added
- Flyway database migration dependency (`flyway-core`, `flyway-mysql`)
- Initial migration `V1__initial_schema.sql` creating all 5 tables with proper constraints
- Migration `V2__add_missing_fk_and_indexes.sql` adding missing FK for predictions.patient_id and index
- Flyway configuration in `application.yml` with `baseline-on-migrate: true`
- Changed `spring.jpa.hibernate.ddl-auto` from `update` to `validate`
- 9 database indexes for query performance (users.status, users.approved_by, patients.created_by, predictions.patient_id, etc.)
- 5 foreign key constraints for data integrity (users→admins, patients→users, predictions→patients, reports→patients, reports→predictions)

### Changed
- `spring.jpa.hibernate.ddl-auto` changed from `update` to `validate` (Flyway controls schema)
- MySQL schema now version-controlled via Flyway migrations

### Fixed
- Missing foreign key constraint on `predictions.patient_id` → `patients.id` (ON DELETE CASCADE)
- Missing index on `predictions.patient_id` for query performance
- Missing index on `users.status` for admin approval queries
- Missing index on `users.approved_by` for admin lookup
- Missing index on `patients.created_by` for user's patient list queries
- Missing foreign keys: users.approved_by→admins.id, patients.created_by→users.id, reports.patient_id→patients.id, reports.prediction_id→predictions.id

### Verified
- Flyway migrations applied successfully on fresh database (V1 and V2)
- `mvn clean install` successful
- Spring Boot starts with `ddl-auto: validate` (no auto DDL)
- Flyway schema history table tracks migrations correctly
- All 5 foreign keys created and verified in MySQL
- All 9 indexes created and verified in MySQL
- Application starts and `/health` returns `{"status":"ok"}`

---

## Future Entries Template

### [YYYY-MM-DD] - Phase X: Phase Name
#### Added
- Feature description

#### Changed
- Modification description

#### Fixed
- Bug fix description

#### Removed
- Removed feature/code

#### Security
- Security improvement