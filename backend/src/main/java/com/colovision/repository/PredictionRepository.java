package com.colovision.repository;

import com.colovision.model.Prediction;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PredictionRepository extends JpaRepository<Prediction, Long> {

    List<Prediction> findByPatientIdOrderByCreatedAtDesc(Long patientId);
}