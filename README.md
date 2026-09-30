# ColoVision AI

**AI-Powered Colorectal Cancer Tissue Segmentation and Classification Platform**

A research/decision-support system for colorectal tissue image analysis using deep learning. Built with React, Spring Boot, FastAPI, and PyTorch.

---

## Features

| Feature | Status |
|---------|--------|
| User registration with admin approval | ✅ Complete |
| JWT authentication (user + admin) | ✅ Complete |
| Patient management (CRUD) | ✅ Complete |
| Colorectal image upload (JPG/PNG, 10MB) | ✅ Complete |
| AI tissue segmentation (U-Net ResNet34) | 🚧 In Progress |
| AI tissue classification (EfficientNet-B0, 6 classes) | 🚧 In Progress |
| Prediction storage with all probabilities | ✅ Complete |
| PDF report generation | ✅ Complete |
| Admin dashboard (approve/reject/suspend) | ✅ Complete |
| Frontend route protection | ❌ Planned |

---

## Architecture

```
┌─────────────┐      REST/JSON      ┌──────────────────┐
│   React     │ ◄─────────────────► │  Spring Boot     │
│  Frontend   │    (port 5173)      │   Backend        │
│  (Vite)     │                     │  (port 8080)     │
└─────────────┘                     └────────┬─────────┘
                                              │
                                              │ JDBC
                                              ▼
                                    ┌──────────────────┐
                                    │     MySQL        │
                                    │  (port 3306)     │
                                    └──────────────────┘
                                              │
                                              │ HTTP (internal)
                                              ▼
                                    ┌──────────────────┐
                                    │    FastAPI       │
                                    │  ML Service      │
                                    │  (port 8000)     │
                                    └────────┬─────────┘
                                             │
                                             │ Python/PyTorch
                                             ▼
                                    ┌──────────────────┐
                                    │  PyTorch Models  │
                                    │  (.pth files)    │
                                    └──────────────────┘
```

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Vite, TypeScript, React Router, Axios, Tailwind CSS v4, Framer Motion, Lucide React, Recharts |
| **Main Backend** | Spring Boot 3.4.3, Java 17, Spring Web, Spring Data JPA, Spring Security, JWT (jjwt), PDFBox |
| **ML Service** | FastAPI, Python 3.10+, PyTorch 2.x, timm, segmentation-models-pytorch, albumentations |
| **Database** | MySQL 8.x |
| **Models** | U-Net (ResNet34 encoder) for segmentation, EfficientNet-B0 for classification |

---

## Project Structure

```
colorectal-ai-ready/
├── backend/                 # Spring Boot 3.4.3
│   ├── src/main/java/com/colovision/
│   │   ├── controller/      # REST endpoints
│   │   ├── service/         # Business logic
│   │   ├── model/           # JPA entities
│   │   ├── repository/      # Spring Data JPA
│   │   ├── security/        # JWT, Spring Security
│   │   └── config/          # Configuration
│   ├── src/main/resources/
│   │   └── application.yml  # Configuration
│   ├── pom.xml              # Maven dependencies
│   └── models/              # ONNX models (if used)
├── frontend/                # React + Vite
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   └── services/        # API client
│   ├── package.json
│   └── vite.config.ts
├── ML_API/                  # FastAPI ML Service
│   ├── best_segmentation_model.pth    # 293 MB
│   ├── best_classifier_model_v3.pth   # 48 MB
│   ├── final_segmentation.ipynb       # Training notebook
│   └── final_mega_project__classification_model.ipynb
├── docs/                    # Project documentation
│   ├── architecture.md
│   ├── requirements.md
│   ├── development-plan.md
│   ├── implementation-status.md
│   ├── api-contract.md
│   ├── database-design.md
│   ├── authentication.md
│   ├── admin-security.md
│   ├── ml-models.md
│   ├── ml-inference.md
│   ├── frontend.md
│   ├── backend.md
│   ├── testing.md
│   ├── deployment.md
│   ├── troubleshooting.md
│   ├── changelog.md
│   └── decisions/
├── AGENTS.md                # Coding rules for AI agents
├── .gitignore
├── .env.example
└── README.md
```

---

## Prerequisites

- **Java 17+** (Temurin/OpenJDK)
- **Maven 3.9+**
- **Node.js 20+** (LTS)
- **MySQL 8.x**
- **Python 3.10+** (for ML service)
- **Git LFS** (for model files)

---

## Quick Start

### 1. Clone and Setup Environment

```bash
git clone <repo-url>
cd colorectal-ai-ready

# Copy environment template
cp .env.example .env
# Edit .env with your credentials
```

### 2. Start MySQL and Create Database

```sql
CREATE DATABASE colorectal_ai;
```

### 3. Start Backend (Spring Boot)

```bash
cd backend
mvn spring-boot:run
# Verify: curl http://localhost:8080/health
```

### 4. Start Frontend

```bash
cd frontend
npm install
npm run dev
# Open http://localhost:5173
```

### 5. Start ML Service (FastAPI) - When Implemented

```bash
cd ML_API
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
# Verify: curl http://localhost:8000/health
```

---

## Configuration

All configuration via environment variables (see `.env.example`):

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL JDBC URL | `jdbc:mysql://localhost:3306/colorectal_ai` |
| `DATABASE_USERNAME` | MySQL user | `root` |
| `DATABASE_PASSWORD` | MySQL password | **required** |
| `JWT_SECRET_KEY` | JWT signing secret (32+ chars) | **required** |
| `CORS_ORIGINS` | Frontend origin(s) | `http://localhost:5173` |
| `UPLOAD_DIR` | File upload directory | `uploads` |
| `MODELS_DIR` | Model files directory | `models` |
| `ADMIN_EMAIL` | First admin email | **required for bootstrap** |
| `ADMIN_PASSWORD` | First admin password | **required for bootstrap** |
| `VITE_API_URL` | Frontend → Backend API | `http://localhost:8080/api` |

---

## API Overview

### Authentication
- `POST /api/auth/register` - User registration (status=PENDING)
- `POST /api/auth/login` - User login → JWT
- `POST /api/auth/admin/login` - Admin login → JWT

### Admin (ROLE_ADMIN required)
- `GET /api/admin/users/pending` - List pending users
- `GET /api/admin/users/approved` - List approved users
- `PUT /api/admin/users/{id}/approve` - Approve user
- `PUT /api/admin/users/{id}/reject` - Reject user
- `PUT /api/admin/users/{id}/suspend` - Suspend user

### Patients (ROLE_USER required)
- `POST /api/patients` - Create patient
- `GET /api/patients` - List user's patients
- `GET /api/patients/{id}` - Get patient detail

### Predictions (ROLE_USER required)
- `POST /api/prediction` - Upload image + run AI inference
- `GET /api/predictions/{patientId}` - Patient's prediction history

### Reports (ROLE_USER required)
- `GET /api/reports/{id}` - Report metadata
- `GET /api/reports/{id}/download` - Download PDF

---

## AI Pipeline

```
Input Image (JPG/PNG)
    ↓
Validation (type, size, magic bytes)
    ↓
Spring Boot → FastAPI /predict
    ↓
Preprocessing (training-matched)
    ├─ Segmentation: 256×256, ImageNet normalize
    └─ Classification: 224×224, ImageNet normalize
    ↓
Segmentation Model (U-Net ResNet34)
    ↓
Binary Mask (sigmoid > 0.5)
    ↓
Classification Model (EfficientNet-B0)
    ↓
6-Class Probabilities (softmax)
    ↓
Return: class, confidence, all probs, mask (base64)
    ↓
Spring Boot: Save mask/overlay, persist prediction
```

### Classification Classes
1. Adenocarcinoma
2. High-grade IN
3. Low-grade IN
4. Normal
5. Polyp
6. Serrated Adenoma

---

## Model Setup

The repository includes trained `.pth` model files in `ML_API/`:
- `best_segmentation_model.pth` (293 MB) - U-Net ResNet34
- `best_classifier_model_v3.pth` (48 MB) - EfficientNet-B0

**For FastAPI ML Service**: Use `.pth` files directly (no export needed).

**For Spring Boot ONNX (legacy)**: Export to ONNX and place in `backend/models/`:
- `segmentation.onnx`
- `classifier.onnx`

---

## Development

### Backend
```bash
cd backend
mvn clean compile
mvn spring-boot:run
# or for tests
mvn test
```

### Frontend
```bash
cd frontend
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
```

### ML Service
```bash
cd ML_API
pip install -r requirements.txt
uvicorn main:app --reload
```

---

## Testing

*Test implementation in progress (Phase 18)*

```bash
# Backend
cd backend && mvn test

# Frontend
cd frontend && npm test

# ML Service
cd ML_API && pytest
```

---

## Deployment

See `docs/deployment.md` for:
- Docker Compose (local/dev)
- Production Dockerfiles
- Cloud deployment options (Render, Railway, Fly.io, AWS)
- Model file handling (Git LFS vs external storage)
- Environment variables for production

---

## Documentation

| Document | Description |
|----------|-------------|
| `docs/architecture.md` | System architecture & data flow |
| `docs/requirements.md` | Functional & non-functional requirements |
| `docs/development-plan.md` | 20-phase implementation roadmap |
| `docs/implementation-status.md` | Living status tracker |
| `docs/api-contract.md` | All API endpoints with schemas |
| `docs/database-design.md` | Schema, relationships, indexes |
| `docs/authentication.md` | Auth flows, JWT, roles |
| `docs/admin-security.md` | Admin bootstrap, authorization |
| `docs/ml-models.md` | Model architectures, preprocessing |
| `docs/ml-inference.md` | Inference pipeline details |
| `docs/frontend.md` | Frontend structure, pages, components |
| `docs/backend.md` | Backend structure, controllers, services |
| `docs/testing.md` | Test strategy & checklist |
| `docs/troubleshooting.md` | Common issues & solutions |
| `docs/decisions/` | Architecture Decision Records |

---

## Security

- JWT authentication with HS256
- BCrypt password hashing
- Role-based access control (USER, ADMIN)
- Resource ownership validation
- File upload validation (type, size, magic bytes)
- No public admin registration
- Admin bootstrap via controlled seed

---

## License

This is a final-year academic project. Not for clinical use without regulatory approval.

---

## Disclaimer

**This system is intended for research and decision-support purposes only and is not a substitute for professional medical diagnosis.**