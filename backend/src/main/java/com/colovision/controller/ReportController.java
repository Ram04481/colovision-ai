package com.colovision.controller;

import com.colovision.config.AppProperties;
import com.colovision.model.Patient;
import com.colovision.model.Prediction;
import com.colovision.model.Report;
import com.colovision.repository.PatientRepository;
import com.colovision.repository.PredictionRepository;
import com.colovision.repository.ReportRepository;
import com.colovision.service.AuthService;
import com.colovision.service.ReportService;

import java.nio.file.Path;
import java.util.Map;
import java.util.NoSuchElementException;

import org.springframework.core.io.FileSystemResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final ReportRepository reports;
    private final PredictionRepository predictions;
    private final PatientRepository patients;
    private final AuthService auth;
    private final ReportService generator;
    private final AppProperties props;

    public ReportController(
            ReportRepository r,
            PredictionRepository x,
            PatientRepository p,
            AuthService a,
            ReportService g,
            AppProperties q) {

        reports = r;
        predictions = x;
        patients = p;
        auth = a;
        generator = g;
        props = q;
    }

    @GetMapping("/{id}")
    Map<String, Object> report(
            @PathVariable Long id,
            Authentication x) throws Exception {

        Long currentUserId;
        boolean isAdmin = x.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            currentUserId = Long.valueOf(x.getName());
        } else {
            var u = auth.currentUser(x.getName());
            currentUserId = u.id;
        }

        return data(id, currentUserId).map;
    }

    @GetMapping("/{id}/download")
    ResponseEntity<FileSystemResource> download(
            @PathVariable Long id,
            Authentication x) throws Exception {

        Long currentUserId;
        boolean isAdmin = x.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            currentUserId = Long.valueOf(x.getName());
        } else {
            var u = auth.currentUser(x.getName());
            currentUserId = u.id;
        }

        var d = data(id, currentUserId);

        Path path = Path.of(d.report.reportPath);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=analysis_report_" + id + ".pdf"
                )
                .body(new FileSystemResource(path));
    }

    private Data data(
            Long id,
            Long currentUserId) throws Exception {

        Prediction p = predictions.findById(id)
                .orElseThrow(() ->
                        new NoSuchElementException(
                                "Prediction not found"));

        Patient patient = patients.findById(p.patientId)
                .filter(v -> v.createdBy.equals(currentUserId))
                .orElseThrow(() ->
                        new NoSuchElementException(
                                "Prediction not found"));

        Report r = reports.findByPredictionId(id)
                .orElseGet(() -> {

                    try {
                        Path path = props.uploadDir()
                                .resolve("reports")
                                .resolve("prediction_" + id + ".pdf");

                        generator.write(path, patient, p);

                        Report n = new Report();

                        n.patientId = patient.id;
                        n.predictionId = p.id;
                        n.reportPath = path.toString();

                        return reports.save(n);

                    } catch (Exception e) {

                        throw new IllegalStateException(e);
                    }
                });

        return new Data(
                r,
                Map.of(
                        "id", r.id,
                        "prediction_id", p.id,
                        "report_path", r.reportPath
                )
        );
    }

    private record Data(
            Report report,
            Map<String, Object> map) {
    }
}