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

        var u = auth.currentUser(x.getName());

        Patient p = new Patient();

        p.patientId = i.patientId();
        p.name = i.name();
        p.address = i.address();
        p.age = i.age();
        p.gender = i.gender();
        p.contact = i.contact();
        p.createdBy = u.id;

        return ResponseEntity
                .status(201)
                .body(patients.save(p));
    }

    @GetMapping
    List<Patient> all(Authentication x) {

        return patients.findByCreatedBy(
                auth.currentUser(x.getName()).id
        );
    }

    @GetMapping("/{id}")
    Patient detail(
            @PathVariable Long id,
            Authentication x) {

        var u = auth.currentUser(x.getName());

        return patients.findById(id)
                .filter(p -> p.createdBy.equals(u.id))
                .orElseThrow(() ->
                        new NoSuchElementException(
                                "Patient not found"));
    }
}