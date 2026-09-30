# Database Design

## Tables

### admins
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | Primary key |
| name | VARCHAR(120) | NOT NULL | Admin display name |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Login identifier |
| password_hash | VARCHAR(255) | NOT NULL | BCrypt hash |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Creation time |

**Indexes**: Primary key on `id`, Unique on `email`

---

### users
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | Primary key |
| name | VARCHAR(255) | NOT NULL | User display name |
| email | VARCHAR(255) | UNIQUE | Login identifier |
| phone | VARCHAR(255) | | Contact phone |
| username | VARCHAR(255) | UNIQUE | Login identifier |
| password_hash | VARCHAR(255) | NOT NULL | BCrypt hash |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'PENDING' | PENDING/APPROVED/REJECTED/SUSPENDED |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Creation time |
| approved_by | BIGINT | FK → admins.id | Approving admin |
| approved_at | TIMESTAMP | | Approval time |

**Indexes**: Primary key on `id`, Unique on `email`, Unique on `username`
**Missing Index**: `status` (critical for admin queries)

---

### patients
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | Primary key |
| patient_id | VARCHAR(255) | UNIQUE | Business identifier |
| name | VARCHAR(255) | NOT NULL | Patient name |
| address | TEXT | | Patient address |
| age | INT | NOT NULL | Patient age |
| gender | VARCHAR(50) | NOT NULL | Gender |
| contact | VARCHAR(255) | NOT NULL | Contact number |
| photo_path | VARCHAR(500) | | Path to patient photo |
| created_by | BIGINT | NOT NULL, FK → users.id | Owning user |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Creation time |

**Indexes**: Primary key on `id`, Unique on `patient_id`
**Missing Index**: `created_by` (for user's patient list)

---

### predictions
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | Primary key |
| patient_id | BIGINT | NOT NULL | Owning patient |
| image_path | VARCHAR(500) | NOT NULL | Original image path |
| segmentation_path | VARCHAR(500) | NOT NULL | Mask image path |
| overlay_path | VARCHAR(500) | NOT NULL | Overlay image path |
| predicted_class | VARCHAR(100) | NOT NULL | Classification result |
| confidence | DOUBLE | NOT NULL | Max probability |
| adenocarcinoma_probability | DOUBLE | NOT NULL | Class 0 probability |
| high_grade_probability | DOUBLE | NOT NULL | Class 1 probability |
| low_grade_probability | DOUBLE | NOT NULL | Class 2 probability |
| normal_probability | DOUBLE | NOT NULL | Class 3 probability |
| polyp_probability | DOUBLE | NOT NULL | Class 4 probability |
| serrated_probability | DOUBLE | NOT NULL | Class 5 probability |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Creation time |

**Indexes**: Primary key on `id`
**Missing Index**: `patient_id` (for patient history)
**Missing FK**: `patient_id` → `patients.id` (currently insertable=false, updatable=false)

---

### reports
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | Primary key |
| patient_id | BIGINT | NOT NULL | Patient (redundant) |
| prediction_id | BIGINT | UNIQUE, NOT NULL | Linked prediction |
| report_path | VARCHAR(500) | NOT NULL | PDF file path |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Generation time |

**Indexes**: Primary key on `id`, Unique on `prediction_id`
**Redundant Column**: `patient_id` (derivable via prediction → patient)

---

## Relationships

```
admins (1) ──< (N) users (approved_by)
users (1) ──< (N) patients (created_by)
patients (1) ──< (N) predictions (patient_id)
predictions (1) ── (1) reports (prediction_id)
```

---

## Current Issues

1. **Missing FK on predictions.patient_id**: JPA uses `@JoinColumn(insertable=false,updatable=false)` but no actual FK constraint in DB
2. **No indexes on query columns**: `users.status`, `patients.created_by`, `predictions.patient_id`
3. **Redundant reports.patient_id**: Can be derived, wastes space
4. **No cascade rules**: Deleting user doesn't cascade to patients/predictions
5. **Hibernate auto-update only**: No versioned migrations (Flyway needed)

---

## Recommended Fixes (Phase 2)

1. Add Flyway migration scripts
2. Add FK: `predictions.patient_id` → `patients.id` ON DELETE CASCADE
3. Add indexes:
   - `CREATE INDEX idx_users_status ON users(status)`
   - `CREATE INDEX idx_patients_created_by ON patients(created_by)`
   - `CREATE INDEX idx_predictions_patient_id ON predictions(patient_id)`
4. Remove `reports.patient_id` column
5. Add cascade: `patients` ON DELETE CASCADE → `predictions`