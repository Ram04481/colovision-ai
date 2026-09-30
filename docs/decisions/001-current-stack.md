# ADR 001: Current Technology Stack

## Status
Accepted

## Date
2024-09-30

## Context
The project was originally specified with a Python/FastAPI backend using PyTorch directly. The existing repository shows a migration to Spring Boot 3 (Java 17) with ONNX Runtime for model inference.

## Decision
We will **keep the current technology stack** as implemented:

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | React + Vite + TypeScript | 18 / 5 / 5.x |
| Frontend Styling | Tailwind CSS | 4.x |
| Frontend Routing | React Router | 6.x |
| Frontend HTTP | Axios | 1.x |
| Main Backend | Spring Boot | 3.4.3 |
| Main Backend Language | Java | 17 |
| Main Backend ORM | Spring Data JPA / Hibernate | - |
| Main Backend Security | Spring Security + JWT | - |
| Database | MySQL | 8.x |
| ML Service | FastAPI + Python | 3.10+ |
| ML Framework | PyTorch | 2.x |
| ML Models | Native .pth (not ONNX) | - |
| Report Generation | PDFBox (Java) | 3.0.3 |

## Rationale
1. **Spring Boot backend already implemented** - Complete REST API, authentication, admin workflow, patient management, prediction persistence, report generation
2. **ONNX Runtime integration exists** - `ModelService` loads ONNX models, runs inference
3. **React frontend complete** - All UI pages implemented, API contracts match
4. **Rewriting to original spec would waste months** - Spring Boot backend is production-quality
5. **ONNX is standard for Java ML inference** - Better than JNI/PyTorch Java bindings
6. **FastAPI ML service can use native PyTorch** - No export step needed, exact training parity

## Architecture Pattern
```
React (5173) → Spring Boot (8080) → MySQL (3306)
                    ↓
              FastAPI (8000) → PyTorch Models
```

## Consequences
- **Positive**: Faster delivery, working backend, native PyTorch in ML service
- **Negative**: Two backend services to deploy, Java/Python polyglot
- **Risk**: Model export step if ONNX kept; we chose native PyTorch in FastAPI

## Related
- ADR 002: ML Service Boundary