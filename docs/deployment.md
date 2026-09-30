# Deployment

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │     │  Spring Boot    │     │    MySQL        │
│   (Nginx/       │────►│  Backend        │────►│  (Database)     │
│   Static Files) │     │  (Port 8080)    │     │  (Port 3306)    │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │    FastAPI      │
                        │  ML Service     │
                        │  (Port 8000)    │
                        └────────┬────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │  PyTorch Models │
                        │  (.pth files)   │
                        └─────────────────┘
```

---

## Environment Variables

### Spring Boot Backend
```bash
# Required
DATABASE_URL=jdbc:mysql://mysql:3306/colorectal_ai?createDatabaseIfNotExist=true&serverTimezone=UTC
DATABASE_USERNAME=root
DATABASE_PASSWORD=secure_password
JWT_SECRET_KEY=your-very-long-random-secret-at-least-32-characters

# Optional
SERVER_PORT=8080
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ORIGINS=https://your-frontend-domain.com
UPLOAD_DIR=/app/uploads
MODELS_DIR=/app/models
MAX_UPLOAD_MB=10
```

### FastAPI ML Service
```bash
# Required
SEGMENTATION_MODEL_PATH=/app/models/best_segmentation_model.pth
CLASSIFICATION_MODEL_PATH=/app/models/best_classifier_model_v3.pth

# Optional
ML_SERVICE_PORT=8000
PYTORCH_DEVICE=cuda  # or cpu
LOG_LEVEL=INFO
```

### Frontend (Vite)
```bash
# Build time
VITE_API_URL=https://your-api-domain.com/api

# Runtime (nginx config)
# proxy_pass http://backend:8080;
```

### MySQL
```bash
MYSQL_ROOT_PASSWORD=secure_root_password
MYSQL_DATABASE=colorectal_ai
MYSQL_USER=colovision
MYSQL_PASSWORD=secure_user_password
```

---

## Docker Deployment

### Docker Compose (Local/Dev)
```yaml
# docker-compose.yml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    ports:
      - "3306:3306"
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    environment:
      - DATABASE_URL=jdbc:mysql://mysql:3306/${MYSQL_DATABASE}?createDatabaseIfNotExist=true&serverTimezone=UTC
      - DATABASE_USERNAME=${MYSQL_USER}
      - DATABASE_PASSWORD=${MYSQL_PASSWORD}
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
      - CORS_ORIGINS=http://localhost:5173
      - UPLOAD_DIR=/app/uploads
      - MODELS_DIR=/app/models
    volumes:
      - ./backend/models:/app/models:ro
      - uploads:/app/uploads
    ports:
      - "8080:8080"
    depends_on:
      mysql:
        condition: service_healthy
      ml-service:
        condition: service_healthy

  ml-service:
    build: ./ML_API
    environment:
      - SEGMENTATION_MODEL_PATH=/app/models/best_segmentation_model.pth
      - CLASSIFICATION_MODEL_PATH=/app/models/best_classifier_model_v3.pth
      - PYTORCH_DEVICE=cpu
    volumes:
      - ./ML_API/best_segmentation_model.pth:/app/models/best_segmentation_model.pth:ro
      - ./ML_API/best_classifier_model_v3.pth:/app/models/best_classifier_model_v3.pth:ro
    ports:
      - "8000:8000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  frontend:
    build: ./frontend
    ports:
      - "5173:80"
    depends_on:
      - backend

volumes:
  mysql_data:
  uploads:
```

### Backend Dockerfile
```dockerfile
# backend/Dockerfile
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

### ML Service Dockerfile
```dockerfile
# ML_API/Dockerfile
FROM pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY main.py .
COPY preprocessing.py .
COPY segmentation.py .
COPY classification.py .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Model File Handling

### Option 1: Git LFS (Recommended for < 2GB total)
```bash
git lfs install
git lfs track "*.pth"
git add .gitattributes
git add ML_API/*.pth
git commit -m "Add model files via Git LFS"
```

### Option 2: External Storage (Recommended for production)
- Store models in S3/GCS/Artifactory
- Download at container startup
- Use init container or entrypoint script

```bash
# Entry script for ML service
#!/bin/bash
if [ ! -f /app/models/best_segmentation_model.pth ]; then
  aws s3 cp s3://my-bucket/models/best_segmentation_model.pth /app/models/
fi
if [ ! -f /app/models/best_classifier_model_v3.pth ]; then
  aws s3 cp s3://my-bucket/models/best_classifier_model_v3.pth /app/models/
fi
exec uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## Production Checklist

### Security
- [ ] Strong JWT_SECRET_KEY (64+ chars)
- [ ] Database passwords rotated
- [ ] TLS/SSL certificates (Let's Encrypt or cloud)
- [ ] CORS restricted to frontend domain only
- [ ] Rate limiting enabled
- [ ] Secure headers (HSTS, CSP)
- [ ] File upload validation + virus scan

### Reliability
- [ ] Health checks on all services
- [ ] Restart policies (unless-stopped)
- [ ] Resource limits (CPU, memory)
- [ ] Database backups (daily)
- [ ] Upload directory persistence
- [ ] Log aggregation (ELK, Loki, CloudWatch)

### Performance
- [ ] GPU allocation for ML service
- [ ] Connection pooling (HikariCP)
- [ ] CDN for frontend static assets
- [ ] Caching headers
- [ ] Database indexes created

### Observability
- [ ] Prometheus metrics endpoint
- [ ] Structured logging (JSON)
- [ ] Distributed tracing (optional)
- [ ] Alerting on error rates, latency

---

## Cloud Deployment Options

### Render.com
- Web Service: Spring Boot (Docker)
- Web Service: FastAPI (Docker)
- Static Site: Frontend (auto-deploy from Git)
- Managed PostgreSQL (or MySQL addon)

### Railway
- All services in one project
- Shared network, easy service discovery
- MySQL plugin

### Fly.io
- Docker-native
- GPU support for ML service
- Global deployment

### AWS ECS/Fargate + RDS
- Production-grade
- More complex setup
- Full control

### Kubernetes (EKS/GKE/AKS)
- Helm charts for each service
- Ingress controller for routing
- Cert-manager for TLS
- GPU node pool for ML service

---

## Database Migration Strategy

1. **Development**: `ddl-auto: update` (current)
2. **Staging/Production**: Flyway migrations only
   ```bash
   # baseline existing schema
   mvn flyway:baseline
   
   # apply migrations
   mvn flyway:migrate
   ```

---

## Backup & Recovery

### Database
```bash
# Backup
mysqldump -h host -u user -p colorectal_ai > backup_$(date +%F).sql

# Restore
mysql -h host -u user -p colorectal_ai < backup_2024-01-15.sql
```

### Uploads
```bash
# Backup
tar -czf uploads_backup_$(date +%F).tar.gz uploads/

# Restore
tar -xzf uploads_backup_2024-01-15.tar.gz
```

---

## Rollback Procedure

1. Tag releases: `git tag v1.0.0`
2. Deploy previous tag
3. Run Flyway `undo` if migration applied (or restore DB backup)
4. Verify health checks