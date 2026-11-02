package com.resolveiq.service;

import com.resolveiq.dto.AuthRequest;
import com.resolveiq.dto.AuthResponse;
import com.resolveiq.dto.RegisterRequest;
import com.resolveiq.entity.User;
import com.resolveiq.exception.ResourceNotFoundException;
import com.resolveiq.repository.UserRepository;
import com.resolveiq.security.JwtTokenProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("User with email already exists: " + email);
        }

        String userId = "USR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String hashedPassword = passwordEncoder.encode(request.getPassword());

        User user = new User(
                userId,
                request.getName().trim(),
                email,
                hashedPassword,
                request.getRole(),
                request.getDepartment().trim(),
                Instant.now()
        );

        User saved = userRepository.save(user);
        String token = tokenProvider.generateToken(saved.getEmail(), saved.getRole(), saved.getName());

        return new AuthResponse(token, saved.getId(), saved.getName(), saved.getEmail(), saved.getRole(), saved.getDepartment());
    }

    public AuthResponse login(AuthRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password.");
        }

        String token = tokenProvider.generateToken(user.getEmail(), user.getRole(), user.getName());
        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getDepartment());
    }

    @Transactional(readOnly = true)
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    public boolean hasAnyAdmin() {
        return userRepository.findAll().stream().anyMatch(u -> u.getRole() == Role.ADMIN);
    }

    public AuthResponse setupAdmin(String fullName, String email, String password) {
        String cleanEmail = email.trim().toLowerCase();
        if (userRepository.existsByEmail(cleanEmail)) {
            User existing = userRepository.findByEmail(cleanEmail).orElseThrow();
            existing.setRole(Role.ADMIN);
            existing.setPasswordHash(passwordEncoder.encode(password));
            User saved = userRepository.save(existing);
            String token = tokenProvider.generateToken(saved.getEmail(), saved.getRole(), saved.getName());
            return new AuthResponse(token, saved.getId(), saved.getName(), saved.getEmail(), saved.getRole(), saved.getDepartment());
        }

        String userId = "USR-ADMIN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String hashedPassword = passwordEncoder.encode(password);
        User user = new User(
                userId,
                fullName.trim(),
                cleanEmail,
                hashedPassword,
                Role.ADMIN,
                "IT Administration",
                Instant.now()
        );
        User saved = userRepository.save(user);
        String token = tokenProvider.generateToken(saved.getEmail(), saved.getRole(), saved.getName());
        return new AuthResponse(token, saved.getId(), saved.getName(), saved.getEmail(), saved.getRole(), saved.getDepartment());
    }
}
