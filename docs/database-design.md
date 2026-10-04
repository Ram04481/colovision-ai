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

**Indexes**: Primary key on `id`, Unique on `email`, Unique on `username`, Index on `status`, Index on `approved_by`

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

**Indexes**: Primary key on `id`, Unique on `patient_id`, Index on `created_by`

---

### predictions
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | Primary key |
| patient_id | BIGINT | NOT NULL, FK → patients.id | Owning patient |
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

**Indexes**: Primary key on `id`, Index on `patient_id` (FK)

---

### reports
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PK, AUTO_INCREMENT | Primary key |
| patient_id | BIGINT | NOT NULL | Patient (redundant) |
| prediction_id | BIGINT | UNIQUE, NOT NULL, FK → predictions.id | Linked prediction |
| report_path | VARCHAR(500) | NOT NULL | PDF file path |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Generation time |

**Indexes**: Primary key on `id`, Unique on `prediction_id`, FK index on `patient_id`

**Redundant Column**: `patient_id` (derivable via prediction → patient)

---

## Relationships

```
admins (1) ──< (N) users (approved_by)
users (1) ──< (N) patients (created_by)
patients (1) ──< (N) predictions (patient_id) ON DELETE CASCADE
predictions (1) ── (1) reports (prediction_id) ON DELETE SET NULL
```

---

## Flyway Migration Strategy

### Migration Files
- `V1__initial_schema.sql` - Creates all tables, foreign keys, and indexes
- `V2__add_missing_fk_and_indexes.sql` - Adds missing FK for predictions.patient_id and index

### Migration Status
| Version | Description | Status |
|---------|-------------|--------|
| 1 | initial schema | ✅ Applied |
| 2 | add missing fk and indexes | ✅ Applied |

### Current Schema Status (Post-Migration)
- **All tables created**: ✅ admins, users, patients, predictions, reports
- **All FKs created**: ✅ 5 foreign keys
- **All indexes created**: ✅ 9 indexes (5 PK, 4 unique, 4 regular)

---

## Current Schema Verification (Post-Migration)

### Foreign Keys (5 total)
| Table | Column | References | On Delete |
|-------|--------|------------|-----------|
| users | approved_by | admins.id | SET NULL |
| patients | created_by | users.id | SET NULL |
| predictions | patient_id | patients.id | CASCADE |
| reports | patient_id | patients.id | SET NULL |
| reports | prediction_id | predictions.id | SET NULL |

### Indexes (13 total)
| Table | Index Name | Columns | Type |
|-------|------------|---------|------|
| admins | PRIMARY | id | PK |
| admins | uk_admin_email | email | UNIQUE |
| users | PRIMARY | id | PK |
| users | uk_user_email | email | UNIQUE |
| users | uk_user_username | username | UNIQUE |
| users | idx_user_status | status | INDEX |
| users | idx_user_approved_by | approved_by | INDEX |
| patients | PRIMARY | id | PK |
| patients | uk_patient_patient_id | patient_id | UNIQUE |
| patients | idx_patient_created_by | created_by | INDEX |
| predictions | PRIMARY | id | PK |
| predictions | idx_prediction_patient_id | patient_id | INDEX (FK) |
| reports | PRIMARY | id | PK |
| reports | uk_report_prediction_id | prediction_id | UNIQUE |
| reports | fk_report_patient | patient_id | INDEX (FK) |

---

## Remaining Issues

1. **Redundant reports.patient_id**: Can be derived via prediction → patient
2. **No cascade rules on users → patients**: Deleting user doesn't cascade to patients
3. **Reports FK to predictions**: ON DELETE SET NULL (should this be CASCADE?)
4. **Reports redundant patient_id**: Can be derived via prediction → patient

---

## Schema Validation
- `spring.jpa.hibernate.ddl-auto: validate` (configured)
- Flyway migrations control schema evolution
- No automatic DDL updates in production