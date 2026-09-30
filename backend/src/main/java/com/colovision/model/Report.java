package com.colovision.model;
import jakarta.persistence.*; import java.time.Instant;
@Entity @Table(name="reports") public class Report { @Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id; @Column(name="patient_id") public Long patientId; @Column(name="prediction_id",unique=true) public Long predictionId; @Column(name="report_path") public String reportPath; @Column(name="created_at") public Instant createdAt=Instant.now(); }
