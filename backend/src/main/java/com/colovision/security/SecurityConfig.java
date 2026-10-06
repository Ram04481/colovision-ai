package com.colovision.security;

import com.colovision.model.User;
import com.colovision.service.AuthService;
import io.jsonwebtoken.Claims;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.util.*;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.*;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    SecurityFilterChain chain(HttpSecurity h, JwtService jwt) throws Exception {
        return h.csrf(c -> c.disable())
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(a -> a
                        .requestMatchers("/health", "/api/auth/**", "/error").permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(new JwtFilter(jwt), UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    UserDetailsService userDetailsService(AuthService authService) {
        return new UserDetailsService() {
            @Override
            public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
                // Try to find by email or username
                var user = authService.findByEmailOrUsername(username);
                if (user == null) {
                    throw new UsernameNotFoundException("User not found: " + username);
                }
                if (!"APPROVED".equals(user.status)) {
                    throw new UsernameNotFoundException("Account status: " + user.status);
                }
                return org.springframework.security.core.userdetails.User
                        .withUsername(user.username)
                        .password(user.passwordHash)
                        .authorities("ROLE_USER")
                        .build();
            }
        };
    }

    static class JwtFilter extends OncePerRequestFilter {
        final JwtService jwt;
        JwtFilter(JwtService jwt) { this.jwt = jwt; }
        protected void doFilterInternal(HttpServletRequest r, HttpServletResponse s, FilterChain c)
                throws ServletException, IOException {
            String h = r.getHeader(HttpHeaders.AUTHORIZATION);
            if (h != null && h.startsWith("Bearer ")) {
                try {
                    Claims x = jwt.parse(h.substring(7));
                    var a = new SimpleGrantedAuthority("ROLE_" + x.get("role", String.class).toUpperCase());
                    var auth = new UsernamePasswordAuthenticationToken(x.getSubject(), null, List.of(a));
                    org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);
                } catch (io.jsonwebtoken.ExpiredJwtException e) {
                    // Token expired - log and continue without authentication (will result in 401)
                    org.slf4j.LoggerFactory.getLogger(JwtFilter.class).warn("JWT token expired: {}", e.getMessage());
                } catch (io.jsonwebtoken.security.SignatureException e) {
                    // Invalid signature - log and continue without authentication (will result in 401)
                    org.slf4j.LoggerFactory.getLogger(JwtFilter.class).warn("JWT signature invalid: {}", e.getMessage());
                } catch (io.jsonwebtoken.MalformedJwtException e) {
                    // Malformed token - log and continue without authentication (will result in 401)
                    org.slf4j.LoggerFactory.getLogger(JwtFilter.class).warn("JWT malformed: {}", e.getMessage());
                } catch (Exception e) {
                    // Other JWT parsing errors - log and continue without authentication
                    org.slf4j.LoggerFactory.getLogger(JwtFilter.class).warn("JWT validation failed: {}", e.getMessage());
                }
            }
            c.doFilter(r, s);
        }
    }
}