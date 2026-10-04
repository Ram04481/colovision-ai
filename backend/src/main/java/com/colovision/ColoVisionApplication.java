package com.colovision;

import com.colovision.model.Admin;
import com.colovision.repository.AdminRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication
public class ColoVisionApplication {

    public static void main(String[] args) {
        SpringApplication.run(ColoVisionApplication.class, args);
    }

    @Bean
    CommandLineRunner seedAdmin(AdminRepository adminRepository) {
        return args -> {
            String email = System.getenv("ADMIN_EMAIL");
            String password = System.getenv("ADMIN_PASSWORD");
            String name = System.getenv("ADMIN_NAME");

            if (email != null && password != null && !email.isBlank() && !password.isBlank()) {
                if (adminRepository.findByEmail(email).isEmpty()) {
                    Admin admin = new Admin();
                    admin.email = email;
                    admin.name = name != null && !name.isBlank() ? name : "Administrator";
                    admin.passwordHash = new BCryptPasswordEncoder().encode(password);
                    adminRepository.save(admin);
                    System.out.println("Admin user created: " + email);
                } else {
                    System.out.println("Admin user already exists: " + email);
                }
            } else {
                System.out.println("Admin seeding skipped: ADMIN_EMAIL and ADMIN_PASSWORD not set");
            }
        };
    }
}