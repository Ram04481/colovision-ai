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