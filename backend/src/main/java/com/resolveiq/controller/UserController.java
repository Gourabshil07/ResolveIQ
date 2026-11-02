package com.resolveiq.controller;

import com.resolveiq.entity.Role;
import com.resolveiq.entity.User;
import com.resolveiq.exception.ResourceNotFoundException;
import com.resolveiq.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping(value = {"/api/users", "/api/v1/users"})
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Admin-only endpoint: List all registered users
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(users);
    }

    /**
     * Authenticated endpoint: List support engineers and administrators eligible for ticket assignment
     */
    @GetMapping("/engineers")
    public ResponseEntity<List<Map<String, Object>>> getEngineers() {
        List<Map<String, Object>> engineers = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.SUPPORT_ENGINEER)
                .map(u -> Map.<String, Object>of(
                        "id", u.getId(),
                        "fullName", u.getFullName(),
                        "email", u.getEmail(),
                        "role", u.getRole().name()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(engineers);
    }

    /**
     * Admin-only endpoint: Update a user's role (promote/demote)
     */
    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUserRole(
            @PathVariable("id") String id,
            @RequestBody Map<String, String> payload,
            Authentication authentication) {

        String newRoleStr = payload.get("role");
        if (newRoleStr == null || newRoleStr.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Role is required"));
        }

        Role newRole;
        try {
            newRole = Role.valueOf(newRoleStr.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role: " + newRoleStr));
        }

        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        user.setRole(newRole);
        User saved = userRepository.save(user);

        return ResponseEntity.ok(saved);
    }
}
