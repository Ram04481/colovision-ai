package com.colovision.controller;

import com.colovision.repository.AdminRepository;
import com.colovision.repository.PatientRepository;
import com.colovision.repository.PredictionRepository;
import com.colovision.repository.ReportRepository;
import com.colovision.repository.UserRepository;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminStatsController {

    private final UserRepository users;
    private final PatientRepository patients;
    private final PredictionRepository predictions;
    private final ReportRepository reports;
    private final AdminRepository admins;

    public AdminStatsController(
            UserRepository u,
            PatientRepository p,
            PredictionRepository pr,
            ReportRepository r,
            AdminRepository a) {
        users = u;
        patients = p;
        predictions = pr;
        reports = r;
        admins = a;
    }

    @GetMapping("/stats")
    Map<String, Long> stats() {
        return Map.of(
                "totalUsers", users.count(),
                "pendingUsers", (long) users.findByStatus("PENDING").size(),
                "approvedUsers", (long) users.findByStatus("APPROVED").size(),
                "rejectedUsers", (long) users.findByStatus("REJECTED").size(),
                "suspendedUsers", (long) users.findByStatus("SUSPENDED").size(),
                "totalPatients", patients.count(),
                "totalPredictions", predictions.count(),
                "totalReports", reports.count(),
                "totalAdmins", admins.count()
        );
    }
}