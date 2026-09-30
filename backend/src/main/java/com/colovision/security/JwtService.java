package com.colovision.security;

import com.colovision.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

@Service
public class JwtService {

    private final AppProperties p;
    private final SecretKey key;

    public JwtService(AppProperties p) {
        this.p = p;
        this.key = Keys.hmacShaKeyFor(
                p.jwtSecret().getBytes(StandardCharsets.UTF_8)
        );
    }

    public String create(Long id, String role) {
        return Jwts.builder()
                .subject(id.toString())
                .claim("role", role)
                .expiration(
                        java.util.Date.from(
                                Instant.now().plus(
                                        p.accessTokenExpireMinutes(),
                                        ChronoUnit.MINUTES
                                )
                        )
                )
                .signWith(key)
                .compact();
    }

    public Claims parse(String t) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(t)
                .getPayload();
    }
}