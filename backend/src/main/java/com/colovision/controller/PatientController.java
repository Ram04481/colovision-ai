package com.colovision.controller;

import com.colovision.model.Patient;
import com.colovision.repository.PatientRepository;
import com.colovision.service.AuthService;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import java.util.List;
import java.util.NoSuchElementException;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientRepository patients;
    private final AuthService auth;

    public PatientController(PatientRepository p, AuthService a) {
        patients = p;
        auth = a;
    }

    public record Input(
            @NotBlank String patientId,
            @NotBlank String name,
            @NotBlank String address,
            @Min(0) @Max(130) int age,
            @NotBlank String gender,
            @NotBlank String contact
    ) {}

    @PostMapping
    ResponseEntity<Patient> create(
            @RequestBody @jakarta.validation.Valid Input i,
            Authentication x) {

        if (patients.findByPatientId(i.patientId()).isPresent()) {
            throw new IllegalArgumentException(
                    "Patient ID already exists");
        }

        Long currentUserId;
        boolean isAdmin = x.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            currentUserId = Long.valueOf(x.getName());
        } else {
            var u = auth.currentUser(x.getName());
            currentUserId = u.id;
        }

        Patient p = new Patient();

        p.patientId = i.patientId();
        p.name = i.name();
        p.address = i.address();
        p.age = i.age();
        p.gender = i.gender();
        p.contact = i.contact();
        p.createdBy = currentUserId;

        return ResponseEntity
                .status(201)
                .body(patients.save(p));
    }

    @GetMapping
    List<Patient> all(Authentication x) {

        Long currentUserId;
        boolean isAdmin = x.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            currentUserId = Long.valueOf(x.getName());
        } else {
            currentUserId = auth.currentUser(x.getName()).id;
        }

        return patients.findByCreatedBy(currentUserId);
    }

    @GetMapping("/{id}")
    Patient detail(
            @PathVariable Long id,
            Authentication x) {

        Long currentUserId;
        boolean isAdmin = x.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            currentUserId = Long.valueOf(x.getName());
        } else {
            var u = auth.currentUser(x.getName());
            currentUserId = u.id;
        }

        return patients.findById(id)
                .filter(p -> p.createdBy.equals(currentUserId))
                .orElseThrow(() ->
                        new NoSuchElementException(
                                "Patient not found"));
    }
}