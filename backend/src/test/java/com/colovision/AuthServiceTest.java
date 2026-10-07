package com.colovision;

import com.colovision.model.User;
import com.colovision.repository.UserRepository;
import com.colovision.security.JwtService;
import com.colovision.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtService jwtService;

    private AuthService authService;
    private BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, null, jwtService);
    }

    @Test
    void register_validUser_createsUserWithPendingStatus() {
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(userRepository.existsByUsername("testuser")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        String result = authService.register("Test User", "test@example.com", "1234567890", "testuser", "password123");

        assertEquals("Registration submitted and waiting for administrator approval.", result);
        
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        
        User savedUser = userCaptor.getValue();
        assertEquals("Test User", savedUser.name);
        assertEquals("test@example.com", savedUser.email);
        assertEquals("testuser", savedUser.username);
        assertEquals("PENDING", savedUser.status);
        assertTrue(encoder.matches("password123", savedUser.passwordHash));
    }

    @Test
    void register_duplicateEmail_throwsIllegalArgumentException() {
        when(userRepository.existsByEmail("test@example.com")).thenReturn(true);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> authService.register("Test User", "test@example.com", "1234567890", "testuser", "password123"));

        assertEquals("Email address is already registered.", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void register_duplicateUsername_throwsIllegalArgumentException() {
        when(userRepository.existsByEmail("test@example.com")).thenReturn(false);
        when(userRepository.existsByUsername("testuser")).thenReturn(true);

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class,
                () -> authService.register("Test User", "test@example.com", "1234567890", "testuser", "password123"));

        assertEquals("Username is already registered.", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void login_approvedUser_returnsJwt() {
        User user = new User();
        user.id = 1L;
        user.email = "test@example.com";
        user.username = "testuser";
        user.passwordHash = encoder.encode("password123");
        user.status = "APPROVED";

        when(userRepository.findByEmailOrUsername("test@example.com", "test@example.com"))
                .thenReturn(Optional.of(user));
        when(jwtService.create(1L, "user")).thenReturn("user-jwt-token");

        String token = authService.login("test@example.com", "password123", false);

        assertEquals("user-jwt-token", token);
    }

    @Test
    void login_pendingUser_throwsAccessDeniedException() {
        User user = new User();
        user.id = 1L;
        user.email = "test@example.com";
        user.username = "testuser";
        user.passwordHash = encoder.encode("password123");
        user.status = "PENDING";

        when(userRepository.findByEmailOrUsername("test@example.com", "test@example.com"))
                .thenReturn(Optional.of(user));

        org.springframework.security.access.AccessDeniedException exception = assertThrows(
                org.springframework.security.access.AccessDeniedException.class,
                () -> authService.login("test@example.com", "password123", false)
        );

        assertEquals("Account status: PENDING", exception.getMessage());
    }

    @Test
    void login_rejectedUser_throwsAccessDeniedException() {
        User user = new User();
        user.id = 1L;
        user.email = "test@example.com";
        user.username = "testuser";
        user.passwordHash = encoder.encode("password123");
        user.status = "REJECTED";

        when(userRepository.findByEmailOrUsername("test@example.com", "test@example.com"))
                .thenReturn(Optional.of(user));

        org.springframework.security.access.AccessDeniedException exception = assertThrows(
                org.springframework.security.access.AccessDeniedException.class,
                () -> authService.login("test@example.com", "password123", false)
        );

        assertEquals("Account status: REJECTED", exception.getMessage());
    }

    @Test
    void login_suspendedUser_throwsAccessDeniedException() {
        User user = new User();
        user.id = 1L;
        user.email = "test@example.com";
        user.username = "testuser";
        user.passwordHash = encoder.encode("password123");
        user.status = "SUSPENDED";

        when(userRepository.findByEmailOrUsername("test@example.com", "test@example.com"))
                .thenReturn(Optional.of(user));

        org.springframework.security.access.AccessDeniedException exception = assertThrows(
                org.springframework.security.access.AccessDeniedException.class,
                () -> authService.login("test@example.com", "password123", false)
        );

        assertEquals("Account status: SUSPENDED", exception.getMessage());
    }

    @Test
    void login_wrongPassword_throwsBadCredentialsException() {
        User user = new User();
        user.id = 1L;
        user.email = "test@example.com";
        user.username = "testuser";
        user.passwordHash = encoder.encode("password123");
        user.status = "APPROVED";

        when(userRepository.findByEmailOrUsername("test@example.com", "test@example.com"))
                .thenReturn(Optional.of(user));

        org.springframework.security.authentication.BadCredentialsException exception = assertThrows(
                org.springframework.security.authentication.BadCredentialsException.class,
                () -> authService.login("test@example.com", "wrongpassword", false)
        );

        assertEquals("Invalid login credentials", exception.getMessage());
    }

    @Test
    void login_nonexistentUser_throwsBadCredentialsException() {
        when(userRepository.findByEmailOrUsername("nonexistent@example.com", "nonexistent@example.com"))
                .thenReturn(Optional.empty());

        org.springframework.security.authentication.BadCredentialsException exception = assertThrows(
                org.springframework.security.authentication.BadCredentialsException.class,
                () -> authService.login("nonexistent@example.com", "password123", false)
        );

        assertEquals("Invalid login credentials", exception.getMessage());
    }

    @Test
    void adminLogin_correctCredentials_returnsAdminJwt() {
        com.colovision.model.Admin admin = new com.colovision.model.Admin();
        admin.id = 1L;
        admin.email = "admin@example.com";
        admin.passwordHash = encoder.encode("adminpass");

        com.colovision.repository.AdminRepository adminRepository = mock(com.colovision.repository.AdminRepository.class);
        when(adminRepository.findByEmail("admin@example.com")).thenReturn(java.util.Optional.of(admin));
        when(jwtService.create(1L, "admin")).thenReturn("admin-jwt-token");

        // Create a new AuthService with the mocked admin repository
        AuthService authServiceWithAdmin = new AuthService(userRepository, adminRepository, jwtService);
        String token = authServiceWithAdmin.login("admin@example.com", "adminpass", true);

        assertEquals("admin-jwt-token", token);
    }

    @Test
    void adminLogin_wrongPassword_throwsBadCredentialsException() {
        com.colovision.model.Admin admin = new com.colovision.model.Admin();
        admin.id = 1L;
        admin.email = "admin@example.com";
        admin.passwordHash = encoder.encode("adminpass");

        com.colovision.repository.AdminRepository adminRepository = mock(com.colovision.repository.AdminRepository.class);
        when(adminRepository.findByEmail("admin@example.com")).thenReturn(java.util.Optional.of(admin));

        AuthService authServiceWithAdmin = new AuthService(userRepository, adminRepository, jwtService);

        org.springframework.security.authentication.BadCredentialsException exception = assertThrows(
                org.springframework.security.authentication.BadCredentialsException.class,
                () -> authServiceWithAdmin.login("admin@example.com", "wrongpass", true)
        );

        assertEquals("Invalid administrator credentials", exception.getMessage());
    }

    @Test
    void adminLogin_nonexistentAdmin_throwsBadCredentialsException() {
        com.colovision.repository.AdminRepository adminRepository = mock(com.colovision.repository.AdminRepository.class);
        when(adminRepository.findByEmail("nonexistent@example.com")).thenReturn(java.util.Optional.empty());

        AuthService authServiceWithAdmin = new AuthService(userRepository, adminRepository, jwtService);

        org.springframework.security.authentication.BadCredentialsException exception = assertThrows(
                org.springframework.security.authentication.BadCredentialsException.class,
                () -> authServiceWithAdmin.login("nonexistent@example.com", "password", true)
        );

        assertEquals("Invalid administrator credentials", exception.getMessage());
    }
}