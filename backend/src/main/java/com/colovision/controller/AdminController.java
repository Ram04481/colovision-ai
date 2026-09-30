package com.colovision.controller;

import com.colovision.model.User;
import com.colovision.repository.UserRepository;
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

    public AdminController(UserRepository u, AuthService a) {
        users = u;
        auth = a;
    }

    @GetMapping("/users/pending")
    List<User> pending(Authentication x) {
        admin(x);
        return users.findByStatus("PENDING");
    }
    // === ADDED METHOD START ===
    @GetMapping("/users/approved")
    List<User> approved(Authentication x) {
        admin(x);
        return users.findByStatus("APPROVED");
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

    private com.colovision.model.Admin admin(Authentication x) {

        if (x.getAuthorities()
                .stream()
                .noneMatch(a ->
                        a.getAuthority().equals("ROLE_ADMIN"))) {

            throw new org.springframework.security.access.AccessDeniedException(
                    "Administrator access required");
        }

        return auth.currentAdmin(x.getName());
    }

    private Map<String, String> update(
            Long id,
            String state,
            Authentication x) {

        var a = admin(x);

        User u = users.findById(id)
                .orElseThrow(() ->
                        new NoSuchElementException("User not found"));

        u.status = state;
        u.approvedBy = a.id;
        u.approvedAt = Instant.now();

        users.save(u);

        return Map.of(
                "message",
                "User " + state.toLowerCase()
        );
    }
}