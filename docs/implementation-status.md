# Implementation Status

| ID | Area | Feature | Status | Evidence | Related Files | Phase |
|----|------|---------|--------|----------|---------------|-------|
| IMP-001 | Backend | Spring Boot starts | ✅ DONE | `/health` returns ok, app starts on port 8080 | `ColoVisionApplication.java`, `pom.xml` | 1 |
| IMP-002 | Backend | MySQL + JPA | ✅ DONE | Tables created via Flyway, DB connection verified | `application.yml`, entities | 2 |
| IMP-003 | Backend | User registration | ✅ DONE | `POST /api/auth/register` | `AuthController.java`, `AuthService.java` | 4 |
| IMP-004 | Backend | User login (JWT) | ✅ DONE | Returns access_token | `AuthController.java`, `JwtService.java` | 4 |
| IMP-005 | Backend | Admin login (JWT) | ✅ DONE | Validates admins table | `AuthController.java`, `AuthService.java` | 5 |
| IMP-006 | Backend | JWT validation filter | ✅ DONE | Parses Bearer token | `SecurityConfig.java` | 4 |
| IMP-007 | Backend | Role-based auth | ✅ DONE | `ROLE_USER`/`ROLE_ADMIN` | `SecurityConfig.java`, `AdminController.java` | 5 |
| IMP-008 | Backend | Admin approval API | ✅ DONE | Approve/reject/suspend | `AdminController.java` | 6 |
| IMP-009 | Backend | Patient CRUD | ✅ DONE | Create, list, detail | `PatientController.java` | 7 |
| IMP-010 | Backend | Image upload | ✅ DONE | `POST /api/prediction` | `PredictionController.java` | 8 |
| IMP-011 | Backend | Image validation | ✅ DONE | Content-Type, 10MB | `PredictionController.java`, `application.yml` | 8 |
| IMP-012 | Backend | ModelService (ONNX) | ⚠️ PARTIAL | Code exists, ONNX models missing | `ModelService.java` | 9-12 |
| IMP-013 | Backend | Prediction persistence | ✅ DONE | 6 probs + paths saved | `PredictionController.java`, `Prediction.java` | 13 |
| IMP-014 | Backend | Report generation | ✅ DONE | PDFBox creates PDF | `ReportService.java`, `ReportController.java` | 16 |
| IMP-015 | Backend | Report download | ✅ DONE | `GET /api/reports/{id}/download` | `ReportController.java` | 16 |
| IMP-016 | Backend | Exception handling | ✅ DONE | Maps to HTTP codes | `ApiExceptionHandler.java` | 3 |
| IMP-017 | Backend | CORS config | ✅ DONE | Configurable origins, tested | `WebConfig.java` | 1 |
| IMP-018 | Backend | Dead MlService/MlController | ❌ BROKEN | Calls non-existent FastAPI | `MlService.java`, `MlController.java` | 3 |
| IMP-019 | Backend | Admin status inconsistency | ❌ BROKEN | "ACTIVE" vs "APPROVED" | `AdminService.java` vs `AdminController.java` | 3, 6 |
| IMP-020 | Backend | Flyway migrations | ✅ DONE | 2 migrations applied (V1, V2) | `pom.xml`, `V1__initial_schema.sql`, `V2__add_missing_fk_and_indexes.sql` | 2 |
| IMP-021 | Backend | Database indexes | ✅ DONE | 9 indexes created via Flyway | Migration V1, V2 | 2 |
| IMP-022 | Backend | SpringDoc OpenAPI | ❌ MISSING | No dependency | `pom.xml` | 3 |
| IMP-023 | Backend | Rate limiting | ❌ MISSING | No Bucket4j | `pom.xml` | 17 |
| IMP-024 | Backend | Admin seeding | ❌ MISSING | Manual SQL per README | `README.md` | 5 |
| IMP-025 | Frontend | React app builds | ✅ DONE | `npm run build` works (warnings on @theme) | `package.json`, `vite.config.ts` | 1 |
| IMP-026 | Frontend | Routing | ✅ DONE | Routes in `App.tsx` | `App.tsx` | 1 |
| IMP-027 | Frontend | Home page | ✅ DONE | `Home.tsx` renders | `Home.tsx` | 1 |
| IMP-028 | Frontend | Login page | ✅ DONE | User + admin toggle | `Login.tsx` | 4 |
| IMP-029 | Frontend | Registration page | ✅ DONE | Submits to API | `Register.tsx` | 4 |
| IMP-030 | Frontend | Dashboard | ⚠️ PARTIAL | Hardcoded zeros | `Dashboard.tsx` | 14 |
| IMP-031 | Frontend | AddPatient page | ✅ DONE | Form + upload + result | `AddPatient.tsx` | 8, 14 |
| IMP-032 | Frontend | AdminDashboard | ✅ DONE | Tabs + actions work | `AdminDashboard.tsx` | 6 |
| IMP-033 | Frontend | API service | ✅ DONE | Axios + Bearer interceptor | `services/api.ts` | 4 |
| IMP-034 | Frontend | Protected routes | ❌ MISSING | No PrivateRoute | `App.tsx` | 4 |
| IMP-035 | Frontend | Admin route | ❌ MISSING | `/admin` not in routes | `App.tsx` | 5 |
| IMP-036 | Frontend | Patient list page | ❌ MISSING | Not implemented | - | 7 |
| IMP-037 | Frontend | Patient detail page | ❌ MISSING | Not implemented | - | 7 |
| IMP-038 | Frontend | Prediction history | ❌ MISSING | Not implemented | - | 15 |
| IMP-039 | Frontend | Report view page | ❌ MISSING | Not implemented | - | 16 |
| IMP-040 | Frontend | Loading states | ❌ MISSING | No spinners | Various pages | 14 |
| IMP-041 | Frontend | Error boundaries | ❌ MISSING | Not implemented | - | 14 |
| IMP-042 | ML Service | FastAPI service | ✅ DONE | Starts on port 8000, `/` returns ok | `ML_API/app.py` | 1 |
| IMP-043 | ML Service | Segmentation model | ⚠️ PARTIAL | .pth exists (293 MB), not loaded in FastAPI | `ML_API/best_segmentation_model.pth` | 10 |
| IMP-044 | ML Service | Classification model | ⚠️ PARTIAL | .pth exists (48 MB), not loaded in FastAPI | `ML_API/best_classifier_model_v3.pth` | 11 |
| IMP-045 | ML Service | Model export | ❌ MISSING | No export script | - | 1 |
| IMP-046 | ML Service | Preprocessing parity | ❌ NEEDS VERIFICATION | Match training exactly | Training notebooks | 10, 11 |
| IMP-047 | ML Service | Class mapping | ❌ NEEDS VERIFICATION | Case mismatch possible | `ModelService.java`, notebooks | 11 |
| IMP-048 | ML Service | Combined /predict | ❌ MISSING | Not implemented | - | 12 |
| IMP-049 | Database | Schema created | ✅ DONE | Flyway migrations | `V1__initial_schema.sql`, `V2__add_missing_fk_and_indexes.sql` | 2 |
| IMP-050 | Database | Foreign keys | ✅ DONE | 5 FKs created via Flyway | Migration V1, V2 | 2 |
| IMP-051 | Database | Indexes | ✅ DONE | 9 indexes created via Flyway | Migration V1, V2 | 2 |
| IMP-052 | Security | JWT secret configurable | ⚠️ PARTIAL | Default insecure | `application.yml` | 17 |
| IMP-053 | Security | BCrypt hashing | ✅ DONE | `AuthService.encoder` | `AuthService.java` | 4 |
| IMP-054 | Security | File upload validation | ⚠️ PARTIAL | Content-Type only | `PredictionController.java` | 8, 17 |
| IMP-055 | Security | Path traversal | ✅ DONE | UUID filenames | `PredictionController.java` | 8 |
| IMP-056 | Security | Ownership checks | ✅ DONE | Patient/prediction verified | Controllers | 7, 13 |
| IMP-057 | Security | Admin separation | ✅ DONE | Separate table, ROLE_ADMIN | `Admin.java`, `AdminController.java` | 5 |
| IMP-058 | Security | Secure headers | ❌ MISSING | Not configured | - | 17 |
| IMP-059 | Testing | Unit tests | ❌ MISSING | No test deps | `pom.xml`, `package.json` | 18 |
| IMP-060 | Testing | Integration tests | ❌ MISSING | No test setup | - | 18 |
| IMP-061 | Testing | E2E tests | ❌ MISSING | No Playwright/Cypress | - | 18 |
| IMP-062 | Deployment | Docker Compose | ❌ MISSING | Not created | - | 19 |
| IMP-063 | Deployment | Dockerfiles | ❌ MISSING | Not created | - | 19 |
| IMP-064 | Documentation | All docs created | ✅ DONE | This documentation set | docs/ | 0 |