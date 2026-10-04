-- Flyway Initial Migration
-- This migration creates the initial schema based on the current JPA entities
-- Run on a fresh database to establish the baseline schema

-- Create admins table
CREATE TABLE IF NOT EXISTS `admins` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `created_at` DATETIME(6) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_admin_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create users table
CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `email` VARCHAR(255),
    `name` VARCHAR(255),
    `password_hash` VARCHAR(255),
    `phone` VARCHAR(255),
    `status` VARCHAR(255) NOT NULL DEFAULT 'PENDING',
    `username` VARCHAR(255),
    `approved_at` DATETIME(6),
    `approved_by` BIGINT,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_email` (`email`),
    UNIQUE KEY `uk_user_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create patients table
CREATE TABLE IF NOT EXISTS `patients` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `address` TEXT,
    `age` INT NOT NULL,
    `contact` VARCHAR(255),
    `created_by` BIGINT,
    `gender` VARCHAR(255),
    `name` VARCHAR(255),
    `patient_id` VARCHAR(255),
    `photo_path` VARCHAR(255),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_patient_patient_id` (`patient_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create predictions table
CREATE TABLE IF NOT EXISTS `predictions` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `adenocarcinoma_probability` DOUBLE,
    `confidence` DOUBLE NOT NULL,
    `high_grade_probability` DOUBLE,
    `image_path` VARCHAR(255),
    `low_grade_probability` DOUBLE,
    `normal_probability` DOUBLE,
    `overlay_path` VARCHAR(255),
    `patient_id` BIGINT NOT NULL,
    `polyp_probability` DOUBLE,
    `predicted_class` VARCHAR(255),
    `segmentation_path` VARCHAR(255),
    `serrated_probability` DOUBLE,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create reports table
CREATE TABLE IF NOT EXISTS `reports` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `patient_id` BIGINT,
    `prediction_id` BIGINT,
    `report_path` VARCHAR(255),
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_report_prediction_id` (`prediction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key constraints
-- Note: predictions.patient_id FK already exists from Hibernate auto-creation
-- Adding missing FKs for data integrity

-- users.approved_by -> admins.id
ALTER TABLE `users`
    ADD CONSTRAINT `fk_user_approved_by_admin`
    FOREIGN KEY (`approved_by`) REFERENCES `admins` (`id`)
    ON DELETE SET NULL;

-- patients.created_by -> users.id
ALTER TABLE `patients`
    ADD CONSTRAINT `fk_patient_created_by_user`
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
    ON DELETE SET NULL;

-- reports.patient_id -> patients.id
ALTER TABLE `reports`
    ADD CONSTRAINT `fk_report_patient`
    FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`)
    ON DELETE SET NULL;

-- reports.prediction_id -> predictions.id (unique FK)
ALTER TABLE `reports`
    ADD CONSTRAINT `fk_report_prediction`
    FOREIGN KEY (`prediction_id`) REFERENCES `predictions` (`id`)
    ON DELETE SET NULL;

-- Note: predictions.patient_id -> patients.id FK already exists from Hibernate
-- If not present, add it:
-- ALTER TABLE `predictions`
--     ADD CONSTRAINT `fk_prediction_patient`
--     FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`)
--     ON DELETE CASCADE;

-- Create indexes for query performance
-- users.status - for admin approval queries
CREATE INDEX `idx_user_status` ON `users` (`status`);

-- users.approved_by - for admin lookup
CREATE INDEX `idx_user_approved_by` ON `users` (`approved_by`);

-- patients.created_by - for user's patient list queries
CREATE INDEX `idx_patient_created_by` ON `patients` (`created_by`);

-- predictions.patient_id already has FK index from constraint

-- reports.prediction_id already has unique index from constraint