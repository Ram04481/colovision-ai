-- Flyway Migration V2
-- Add missing foreign key constraint and index for predictions.patient_id
-- The FK was supposed to be created by Hibernate but wasn't in the initial migration

-- Add foreign key constraint for predictions.patient_id -> patients.id
ALTER TABLE `predictions`
    ADD CONSTRAINT `fk_prediction_patient`
    FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`)
    ON DELETE CASCADE;

-- Create index for predictions.patient_id (FK index)
CREATE INDEX `idx_prediction_patient_id` ON `predictions` (`patient_id`);