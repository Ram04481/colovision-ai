# Project Overview

## Project Purpose
ColoVision AI is a research/decision-support platform for colorectal cancer tissue segmentation and classification using deep learning. It enables medical researchers to upload colorectal tissue images, obtain AI-powered segmentation masks and tissue classification predictions, and generate PDF reports for clinical review.

## Problem Being Solved
Colorectal cancer diagnosis requires expert histopathological analysis. This system provides AI-assisted segmentation of tissue regions and 6-class tissue classification to support (not replace) clinical decision-making.

## Users
- **Researchers/Clinicians** - Register, await admin approval, create patients, upload images, view predictions, download reports
- **Administrators** - Approve/reject/suspend users, view system activity

## Major Features

| Feature | Status |
|---------|--------|
| User Registration (PENDING → APPROVED) | ✅ IMPLEMENTED |
| Admin Approval Workflow | ✅ IMPLEMENTED |
| JWT Authentication (User + Admin) | ✅ IMPLEMENTED |
| Patient CRUD | ✅ IMPLEMENTED |
| Image Upload (JPG/PNG, 10MB) | ✅ IMPLEMENTED |
| AI Segmentation (U-Net ResNet34) | ❌ MISSING - ONNX models not present |
| AI Classification (EfficientNet-B0, 6 classes) | ❌ MISSING - ONNX models not present |
| Prediction Storage (all 6 class probabilities) | ✅ IMPLEMENTED |
| PDF Report Generation (PDFBox) | ✅ IMPLEMENTED |
| Report Download | ✅ IMPLEMENTED |
| Frontend Route Protection | ❌ MISSING |
| Admin Dashboard UI | ✅ IMPLEMENTED |
| Patient List / History UI | ❌ MISSING |

## System Workflow
```
1. User registers → status=PENDING
2. Admin reviews → APPROVES/REJECTS/SUSPENDS
3. User logs in → JWT (ROLE_USER)
4. User creates Patient record
5. User uploads colorectal image
6. Spring Boot validates → calls FastAPI ML service
7. FastAPI runs segmentation → mask
8. FastAPI runs classification → 6-class probabilities
9. Results saved to MySQL + mask/overlay images to filesystem
10. PDF report generated on-demand
11. User views/downloads report
```

## Current Status
- **Frontend**: React + Vite + Tailwind, functional but missing auth guards and several pages
- **Spring Boot Backend**: Complete REST API, JPA entities, JWT auth, admin workflow - but ML inference broken (missing ONNX models)
- **FastAPI ML Service**: Minimal stub only (`app.py` returns hardcoded message)
- **Database**: MySQL schema via Hibernate auto-update, no migrations
- **Models**: Two `.pth` files exist in `ML_API/` but not exported to ONNX
- **Security**: JWT implementation present, but default secret, no rate limiting, frontend unprotected