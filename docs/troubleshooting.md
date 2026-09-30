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