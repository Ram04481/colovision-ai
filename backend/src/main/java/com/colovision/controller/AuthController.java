package com.colovision.controller;

import com.colovision.service.AuthService;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService auth;

    public AuthController(AuthService a) {
        auth = a;
    }

    public record Register(
            @NotBlank String name,
            @Email String email,
            @NotBlank String phone,
            @NotBlank String username,
            @Size(min = 8) String password
    ) {
    }

    public record Login(
            @NotBlank String identifier,
            @NotBlank String password
    ) {
    }

    @PostMapping("/register")
    ResponseEntity<?> register(
            @RequestBody @jakarta.validation.Valid Register r) {

        return ResponseEntity
                .status(201)
                .body(
                        Map.of(
                                "message",
                                auth.register(
                                        r.name(),
                                        r.email(),
                                        r.phone(),
                                        r.username(),
                                        r.password()
                                )
                        )
                );
    }

    @PostMapping("/login")
    Map<String, String> login(
            @RequestBody @jakarta.validation.Valid Login r) {

        return Map.of(
                "access_token",
                auth.login(
                        r.identifier(),
                        r.password(),
                        false
                ),
                "token_type",
                "bearer"
        );
    }

    @PostMapping("/admin/login")
    Map<String, String> adminLogin(
            @RequestBody @jakarta.validation.Valid Login r) {

        return Map.of(
                "access_token",
                auth.login(
                        r.identifier(),
                        r.password(),
                        true
                ),
                "token_type",
                "bearer"
        );
    }
}