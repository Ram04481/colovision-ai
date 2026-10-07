package com.colovision;

import com.colovision.config.AppProperties;
import com.colovision.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;
    private AppProperties appProperties;

    @BeforeEach
    void setUp() {
        appProperties = new AppProperties(
                "your-very-long-random-secret-at-least-32-characters",
                60,
                "http://localhost:5173",
                java.nio.file.Paths.get("uploads"),
                java.nio.file.Paths.get("models")
        );
        jwtService = new JwtService(appProperties);
    }

    @Test
    void create_validInput_returnsJwtToken() {
        String token = jwtService.create(1L, "user");
        
        assertNotNull(token);
        assertTrue(token.startsWith("eyJ"));
        assertEquals(3, token.split("\\.").length); // JWT has 3 parts
    }

    @Test
    void create_adminRole_containsAdminClaim() {
        String token = jwtService.create(1L, "admin");
        
        assertNotNull(token);
        // Parse the token to verify the role claim
        String[] parts = token.split("\\.");
        String payload = parts[1];
        // Add padding if needed
        while (payload.length() % 4 != 0) {
            payload += "=";
        }
        String decoded = new String(java.util.Base64.getUrlDecoder().decode(payload));
        assertTrue(decoded.contains("\"role\":\"admin\""));
    }

    @Test
    void create_userRole_containsUserClaim() {
        String token = jwtService.create(1L, "user");
        
        String[] parts = token.split("\\.");
        String payload = parts[1];
        while (payload.length() % 4 != 0) {
            payload += "=";
        }
        String decoded = new String(java.util.Base64.getUrlDecoder().decode(payload));
        assertTrue(decoded.contains("\"role\":\"user\""));
    }

    @Test
    void parse_validToken_returnsClaims() {
        String token = jwtService.create(42L, "user");
        
        io.jsonwebtoken.Claims claims = jwtService.parse(token);
        
        assertEquals("42", claims.getSubject());
        assertEquals("user", claims.get("role", String.class));
        assertNotNull(claims.getExpiration());
    }

    @Test
    void parse_adminToken_returnsAdminRole() {
        String token = jwtService.create(1L, "admin");
        
        io.jsonwebtoken.Claims claims = jwtService.parse(token);
        
        assertEquals("admin", claims.get("role", String.class));
    }

    @Test
    void parse_expiredToken_throwsException() {
        // Create a token with negative expiration (already expired)
        AppProperties expiredProps = new AppProperties(
                "your-very-long-random-secret-at-least-32-characters",
                -1, // negative minutes = expired
                "http://localhost:5173",
                java.nio.file.Paths.get("uploads"),
                java.nio.file.Paths.get("models")
        );
        JwtService expiredJwtService = new JwtService(expiredProps);
        
        String expiredToken = expiredJwtService.create(1L, "user");
        
        assertThrows(io.jsonwebtoken.ExpiredJwtException.class,
                () -> expiredJwtService.parse(expiredToken));
    }

    @Test
    void parse_invalidSignature_throwsException() {
        // Create token with one secret
        String token = jwtService.create(1L, "user");
        
        // Try to parse with different secret
        AppProperties differentProps = new AppProperties(
                "different-very-long-random-secret-at-least-32-chars",
                60,
                "http://localhost:5173",
                java.nio.file.Paths.get("uploads"),
                java.nio.file.Paths.get("models")
        );
        JwtService differentJwtService = new JwtService(differentProps);
        
        assertThrows(io.jsonwebtoken.security.SignatureException.class,
                () -> differentJwtService.parse(token));
    }

    @Test
    void parse_malformedToken_throwsException() {
        assertThrows(io.jsonwebtoken.MalformedJwtException.class,
                () -> jwtService.parse("invalid.token.here"));
    }

    @Test
    void parse_emptyString_throwsException() {
        // jjwt throws IllegalArgumentException for empty/blank strings
        assertThrows(IllegalArgumentException.class,
                () -> jwtService.parse(""));
    }
}