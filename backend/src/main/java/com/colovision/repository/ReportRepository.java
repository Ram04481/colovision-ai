package com.colovision.repository;

import com.colovision.model.Report;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, Long> {

    Optional<Report> findByPredictionId(Long predictionId);

    long count();

    List<Report> findAll();
}