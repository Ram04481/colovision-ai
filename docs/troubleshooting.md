# Troubleshooting

## Backend Issues

### Application Won't Start

**Problem**: `mvn spring-boot:run` fails

| Cause | Evidence | Solution |
|-------|----------|----------|
| MySQL not running | `Communications link failure` | Start MySQL service |
| Wrong DB credentials | `Access denied for user` | Check `DATABASE_USERNAME`, `DATABASE_PASSWORD` |
| DB doesn't exist | `Unknown database` | Create `colorectal_ai` or enable `createDatabaseIfNotExist=true` |
| Port 8080 in use | `Port already in use` | `export SERVER_PORT=8081` |
| Java version | `Unsupported class file major version` | Use Java 17 |

---

### Prediction Returns 503

**Problem**: `POST /api/prediction` → 503 Service Unavailable

| Cause | Evidence | Solution |
|-------|----------|----------|
| ONNX models missing | Log: `Missing ONNX models in the models folder` | Export `.pth` → ONNX, place in `backend/models/` |
| Model file corrupted | `ONNX load failed` | Re-export models |
| ONNX Runtime version mismatch | `Incompatible opset` | Use ONNX Runtime 1.20.0, export with opset 17 |

---

### Admin Approval Doesn't Work

**Problem**: User approved but cannot login

| Cause | Evidence | Solution |
|-------|----------|----------|
| Status inconsistency | AdminService sets "ACTIVE", AuthService checks "APPROVED" | Fix AdminService to use "APPROVED" (Phase 3) |
| Wrong endpoint used | Called AdminService instead of AdminController | Use `PUT /api/admin/users/{id}/approve` |

---

### JWT Errors

**Problem**: 401 Unauthorized on valid requests

| Cause | Evidence | Solution |
|-------|----------|----------|
| Token expired | `JWT expired` | Login again (60 min expiry) |
| Wrong secret | `JWT signature validation failed` | Ensure `JWT_SECRET_KEY` matches |
| Malformed token | `Invalid JWT` | Check `Authorization: Bearer <token>` format |
| Role mismatch | 403 on admin endpoint | User token used for admin API |

---

### File Upload Fails

**Problem**: 415 Unsupported Media Type or 400 Bad Request

| Cause | Evidence | Solution |
|-------|----------|----------|
| Wrong Content-Type | `Only JPG, JPEG, and PNG files are allowed` | Send `image/jpeg` or `image/png` |
| File too large | `Max upload size exceeded` | Check `MAX_UPLOAD_MB` (default 10MB) |
| Missing patient_id | `Required request part 'patient_id' not present` | Include `patient_id` in multipart form |

---

## Frontend Issues

### Page Shows Blank / White Screen

| Cause | Evidence | Solution |
|-------|----------|----------|
| JS error | Console: `Uncaught TypeError` | Check console, fix component |
| Route not matched | URL doesn't match any route | Check `App.tsx` routes |
| Auth redirect loop | Rapid redirects | Fix `PrivateRoute` logic |

---

### Login Doesn't Work

| Cause | Evidence | Solution |
|-------|----------|----------|
| API URL wrong | Network: 404 on `/api/auth/login` | Check `VITE_API_URL` |
| CORS error | Console: `CORS policy` | Backend `CORS_ORIGINS` must include frontend origin |
| Token not stored | localStorage empty after login | Check `Login.tsx` token save logic |

---

### Dashboard Shows Zeros

| Cause | Evidence | Solution |
|-------|----------|----------|
| No data fetching | `Dashboard.tsx` has hardcoded values | Implement API calls to `/api/patients` and `/api/predictions` |

---

## ML Service Issues

### FastAPI Won't Start

| Cause | Evidence | Solution |
|-------|----------|----------|
| Port 8000 in use | `Address already in use` | Change port or kill process |
| Model file not found | `FileNotFoundError` | Check model paths in env vars |
| PyTorch version mismatch | `RuntimeError: CUDA version` | Match PyTorch/CUDA versions |
| Import error | `ModuleNotFoundError` | `pip install -r requirements.txt` |

---

### Model Loading Fails

| Cause | Evidence | Solution |
|-------|----------|----------|
| Checkpoint format | `KeyError: 'model_state_dict'` | Handle both full checkpoint and state_dict |
| Class names missing | `KeyError: 'class_names'` | Load from checkpoint or use fallback |
| Device mismatch | `CUDA out of memory` | Use CPU or smaller batch |

---

### Prediction Returns Wrong Results

| Cause | Evidence | Solution |
|-------|----------|----------|
| Preprocessing mismatch | Results differ from training | Verify resize, normalize, tensor format match notebook exactly |
| Class order wrong | Predictions consistently wrong class | Load `class_names` from checkpoint, verify order |
| Threshold wrong | Segmentation mask too aggressive/conservative | Tune sigmoid threshold |

---

## Database Issues

### Migration Fails

| Cause | Evidence | Solution |
|-------|----------|----------|
| Checksum mismatch | `Validate failed: Migration checksum` | `mvn flyway:repair` |
| Locked | `Unable to acquire lock` | Kill other Flyway processes |
| Out of order | `Applied migration not resolved locally` | Add missing migration files |

---

### Query Slow

| Cause | Evidence | Solution |
|-------|----------|----------|
| Missing index | `EXPLAIN` shows full table scan | Add indexes on `users.status`, `patients.created_by`, `predictions.patient_id` |

---

## Docker Issues

### Container Exits Immediately

| Cause | Evidence | Solution |
|-------|----------|----------|
| Entry script fails | `docker logs` shows error | Fix entrypoint script |
| Health check fails | Container unhealthy | Fix health endpoint or increase timeout |

---

### Models Not Found in Container

| Cause | Evidence | Solution |
|-------|----------|----------|
| Volume not mounted | `FileNotFoundError` | Check `docker-compose.yml` volumes |
| Path mismatch | Model at `/models/` but code expects `/app/models/` | Align paths |

---

## Common Error Codes

| Code | Meaning | Typical Fix |
|------|---------|-------------|
| 400 | Bad Request | Check request body/params |
| 401 | Unauthorized | Login again, check token |
| 403 | Forbidden | Check role, ownership |
| 404 | Not Found | Check ID exists and owned |
| 415 | Unsupported Media Type | Check file type |
| 500 | Internal Server Error | Check server logs |
| 503 | Service Unavailable | ML models not loaded, FastAPI down |
| 504 | Gateway Timeout | Increase timeout, check ML service |

---

## Phase 2 Database Issues

### Flyway Migration Fails Validation

**Problem**: Flyway fails with "Validate failed: Migrations have failed validation"

| Cause | Evidence | Solution |
|-------|----------|----------|
| Migration file checksum mismatch | `Validate failed: Migrations have failed validation` | Run `mvn flyway:repair` or delete `flyway_schema_history` table and re-run |
| Migration file modified after applied | Checksum in `flyway_schema_history` doesn't match file | Do not modify applied migration files; create new migration instead |
| Failed migration recorded | `success=0` in `flyway_schema_history` | Delete failed entry from `flyway_schema_history`, fix migration, re-run |

### Flyway Migration Fails with SQL Syntax Error

**Problem**: Migration fails with SQL syntax error

| Cause | Evidence | Solution |
|-------|----------|----------|
| MySQL version incompatibility | `CREATE INDEX IF NOT EXISTS` fails on MySQL < 8.0.19 | Use `CREATE INDEX` without `IF NOT EXISTS` for compatibility |
| Reserved keyword used as identifier | `ERROR 1064` near table/column name | Wrap identifiers in backticks (\`table\`, \`column\`) |
| Foreign key references non-existent table | `ERROR 1215` Cannot add foreign key constraint | Ensure referenced table exists and has matching column type |

### Foreign Key Constraint Fails

**Problem**: `ERROR 1215: Cannot add foreign key constraint`

| Cause | Evidence | Solution |
|-------|----------|----------|
| Referenced column not indexed | Referenced column must be primary key or have unique index | Ensure referenced column is PK or has unique index |
| Column type mismatch | Referencing and referenced columns have different types | Ensure both columns have identical type (e.g., both BIGINT) |
| Referenced table doesn't exist | Table name typo or not created yet | Ensure referenced table is created in same or earlier migration |
| Data violates constraint | Existing data has orphaned references | Clean up orphaned data before adding constraint |

### Missing Index on Query Column

**Problem**: Slow queries on large tables

| Cause | Evidence | Solution |
|-------|----------|----------|
| No index on frequently filtered column | Slow `SELECT * FROM users WHERE status = 'PENDING'` | Add index: `CREATE INDEX idx_user_status ON users(status)` |
| No index on foreign key column | Slow JOIN on `predictions.patient_id` | FK columns should be indexed; add index if missing |
| No index on ownership column | Slow `SELECT * FROM patients WHERE created_by = ?` | Add index: `CREATE INDEX idx_patient_created_by ON patients(created_by)` |

### Flyway Baseline Fails on Existing Database

**Problem**: `FlywayException: Schema is not empty but baseline failed`

| Cause | Evidence | Solution |
|-------|----------|----------|
| Tables exist without Flyway history | Existing tables but no `flyway_schema_history` | Set `baseline-on-migrate: true` and `baseline-version: 0` |
| Tables partially created | Some tables exist from `ddl-auto: update` | Drop all tables or run `flyway:baseline` manually |

---

## Common Error Codes

---

## Phase 1 Specific Issues

### Spring Boot Application Exits After Startup

**Problem**: Application starts successfully but process exits after ~12 seconds

| Cause | Evidence | Solution |
|-------|----------|----------|
| Maven plugin runs in background | `mvn spring-boot:run` starts then exits | Use `java -jar target/colorectal-ai-backend-1.0.0.jar` or run in foreground |
| No custom UserDetailsService | Log: `Using generated security password` | Implement custom UserDetailsService or disable auto-configuration |

### Spring Boot Uses Generated Security Password

**Problem**: Log shows `Using generated security password: <uuid>` instead of JWT auth

| Cause | Evidence | Solution |
|-------|----------|----------|
| Spring Security auto-configuration | `UserDetailsServiceAutoConfiguration` activates | Provide custom `UserDetailsService` bean or exclude auto-configuration |

### FastAPI /health Returns 404

**Problem**: `GET http://localhost:8000/health` returns 404

| Cause | Evidence | Solution |
|-------|----------|----------|
| Endpoint not implemented | `app.py` only has `/` and `/predict` | Add `@app.get("/health")` endpoint to `app.py` |

### FastAPI Returns 413 on Large File Upload

**Problem**: `POST /api/ml/predict` returns 413 Payload Too Large

| Cause | Evidence | Solution |
|-------|----------|----------|
| Spring Boot multipart limit | Default 10MB, model files are 293MB/48MB | Increase `spring.servlet.multipart.max-file-size` or test with smaller files |

### Frontend Build Warnings: @theme

**Problem**: `[lightningcss minify] Unknown at rule: @theme` during `npm run build`

| Cause | Evidence | Solution |
|-------|----------|----------|
| Tailwind CSS v4 uses @theme directive | Warning: `[lightningcss minify] Unknown at rule: @theme` | This is a warning only, build succeeds. Update Tailwind/lightningcss or ignore. |

### MlController Returns 503

**Problem**: `POST /api/ml/predict` returns 503

| Cause | Evidence | Solution |
|-------|----------|----------|
| MlService calls non-existent FastAPI | `MlService` points to `http://127.0.0.1:8000` | Remove dead `MlService`/`MlController` or fix FastAPI URL |

### Spring Boot Process Exits When Run via Maven

**Problem**: `mvn spring-boot:run` starts app but process exits

| Cause | Evidence | Solution |
|-------|----------|----------|
| Background process management | Maven plugin manages lifecycle differently | Use `java -jar target/colorectal-ai-backend-1.0.0.jar` for persistent process |

---

## Common Error Codes