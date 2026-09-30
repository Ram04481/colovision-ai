package com.colovision.repository;

import com.colovision.model.Patient;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientRepository extends JpaRepository<Patient, Long> {

    Optional<Patient> findByPatientId(String patientId);

    List<Patient> findByCreatedBy(Long createdBy);
}