package com.colovision.controller;

import com.colovision.model.User;
import com.colovision.repository.UserRepository;
import com.colovision.service.AdminService;
import com.colovision.service.AuthService;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository users;
    private final AuthService auth;
    private final AdminService adminService;

    public AdminController(UserRepository u, AuthService a, AdminService adminService) {
        users = u;
        auth = a;
        this.adminService = adminService;
    }

    @GetMapping("/users/pending")
    List<User> pending(Authentication x) {
        requireAdmin(x);
        return adminService.getPendingUsers();
    }

    @GetMapping("/users/approved")
    List<User> approved(Authentication x) {
        requireAdmin(x);
        return adminService.getApprovedUsers();
    }

    @PutMapping("/users/{id}/approve")
    Map<String, String> approve(
            @PathVariable Long id,
            Authentication x) {

        return update(id, "APPROVED", x);
    }

    @PutMapping("/users/{id}/reject")
    Map<String, String> reject(
            @PathVariable Long id,
            Authentication x) {

        return update(id, "REJECTED", x);
    }

    @PutMapping("/users/{id}/suspend")
    Map<String, String> suspend(
            @PathVariable Long id,
            Authentication x) {

        return update(id, "SUSPENDED", x);
    }

    private void requireAdmin(Authentication x) {
        if (x.getAuthorities()
                .stream()
                .noneMatch(a ->
                        a.getAuthority().equals("ROLE_ADMIN"))) {

            throw new org.springframework.security.access.AccessDeniedException(
                    "Administrator access required");
        }
    }

    private Map<String, String> update(
            Long id,
            String state,
            Authentication x) {

        requireAdmin(x);
        var admin = auth.currentAdmin(x.getName());

        User u = users.findById(id)
                .orElseThrow(() ->
                        new NoSuchElementException("User not found"));

        u.status = state;
        u.approvedBy = admin.id;
        u.approvedAt = Instant.now();

        users.save(u);

        return Map.of(
                "message",
                "User " + state.toLowerCase()
        );
    }
}