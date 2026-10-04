package com.colovision.controller;

import com.colovision.model.Patient;
import com.colovision.model.Prediction;
import com.colovision.model.User;
import com.colovision.repository.PatientRepository;
import com.colovision.repository.PredictionRepository;
import com.colovision.repository.UserRepository;
import com.colovision.service.AuthService;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/patients")
public class AdminPatientController {

    private final PatientRepository patients;
    private final PredictionRepository predictions;
    private final UserRepository users;
    private final AuthService auth;

    public AdminPatientController(
            PatientRepository p,
            PredictionRepository pr,
            UserRepository u,
            AuthService a) {
        patients = p;
        predictions = pr;
        users = u;
        auth = a;
    }

    @GetMapping
    List<Patient> listAll() {
        return patients.findAll();
    }

    @GetMapping("/{id}")
    ResponseEntity<Patient> getPatient(
            @PathVariable Long id,
            Authentication x) {

        return patients.findById(id)
                .map(ResponseEntity::ok)
                .orElseThrow(() ->
                        new NoSuchElementException("Patient not found"));
    }

    @GetMapping("/{id}/predictions")
    List<com.colovision.model.Prediction> getPatientPredictions(
            @PathVariable Long id,
            Authentication x) {

        return patients.findById(id)
                .map(p -> predictions.findByPatientIdOrderByCreatedAtDesc(p.id))
                .orElseThrow(() ->
                        new NoSuchElementException("Patient not found"));
    }

    private boolean isAdmin(Authentication x) {
        return x.getAuthorities()
                .stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }
}