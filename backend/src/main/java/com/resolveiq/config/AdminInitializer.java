package com.resolveiq.config;

import com.resolveiq.entity.Role;
import com.resolveiq.entity.User;
import com.resolveiq.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.UUID;

/**
 * Initializes the primary administrator account securely from backend-only environment variables.
 * If an admin already exists, this step safely skips without altering existing accounts.
 */
@Component
public class AdminInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.initial.email:${ADMIN_INITIAL_EMAIL:admin@resolveiq.internal}}")
    private String adminEmail;

    @Value("${admin.initial.password:${ADMIN_INITIAL_PASSWORD:Admin@ResolveIQ2026!}}")
    private String adminPassword;

    @Value("${admin.initial.fullname:${ADMIN_INITIAL_FULL_NAME:System Administrator}}")
    private String adminFullName;

    public AdminInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        try {
            boolean hasAdmin = userRepository.findAll().stream()
                    .anyMatch(u -> u.getRole() == Role.ADMIN);

            if (!hasAdmin) {
                log.info("No administrator account found. Initializing primary admin from environment configuration...");

                String cleanEmail = adminEmail.trim().toLowerCase();
                if (userRepository.existsByEmail(cleanEmail)) {
                    log.info("User with email {} already exists. Upgrading to ADMIN role...", cleanEmail);
                    User existing = userRepository.findByEmail(cleanEmail).orElseThrow();
                    existing.setRole(Role.ADMIN);
                    userRepository.save(existing);
                } else {
                    String adminId = "USR-ADMIN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                    String encodedPassword = passwordEncoder.encode(adminPassword);

                    User admin = new User(
                            adminId,
                            adminFullName.trim(),
                            cleanEmail,
                            encodedPassword,
                            Role.ADMIN,
                            "IT Administration",
                            Instant.now()
                    );

                    userRepository.save(admin);
                    log.info("Primary administrator account successfully initialized for: {}", cleanEmail);
                }
            } else {
                log.info("Administrator account verified in database. Skipping automated initialization.");
            }
        } catch (Exception e) {
            log.warn("AdminInitializer encountered an error during bootstrap: {}", e.getMessage());
        }
    }
}
