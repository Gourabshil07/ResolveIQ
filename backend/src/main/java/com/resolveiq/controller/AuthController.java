package com.resolveiq.controller;

import com.resolveiq.dto.AuthRequest;
import com.resolveiq.dto.AuthResponse;
import com.resolveiq.dto.RegisterRequest;
import com.resolveiq.entity.User;
import com.resolveiq.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping(value = {"/api/auth", "/api/v1/auth"})
public class AuthController {

    private final AuthService authService;

    @Value("${admin.setup.secret:${ADMIN_SETUP_SECRET:admin-setup-secret-2026}}")
    private String setupSecret;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        // Enforce: Admin accounts cannot be self-registered
        if ("ADMIN".equalsIgnoreCase(String.valueOf(request.getRole()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Administrator accounts cannot be self-registered."));
        }
        AuthResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/setup-admin")
    public ResponseEntity<?> setupAdmin(
            @RequestBody Map<String, String> payload,
            @RequestHeader(value = "X-Admin-Setup-Secret", required = false) String secretHeader) {

        String secret = secretHeader != null ? secretHeader : payload.get("secret");
        boolean hasAdmin = authService.hasAnyAdmin();

        if (hasAdmin && (secret == null || !secret.equals(setupSecret))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Admin setup is locked. An administrator already exists, and a valid setup secret is required."));
        }

        String fullName = payload.get("fullName");
        String email = payload.get("email");
        String password = payload.get("password");

        if (fullName == null || fullName.isBlank() || email == null || email.isBlank() || password == null || password.length() < 6) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Full name, valid email, and password (at least 6 characters) are required."));
        }

        AuthResponse response = authService.setupAdmin(fullName, email, password);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<User> getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        User user = authService.getUserByEmail(authentication.getName());
        return ResponseEntity.ok(user);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
}
