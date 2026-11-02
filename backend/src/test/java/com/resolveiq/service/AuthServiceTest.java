package com.resolveiq.service;

import com.resolveiq.dto.AuthRequest;
import com.resolveiq.dto.AuthResponse;
import com.resolveiq.dto.RegisterRequest;
import com.resolveiq.entity.Role;
import com.resolveiq.entity.User;
import com.resolveiq.exception.ResourceNotFoundException;
import com.resolveiq.repository.UserRepository;
import com.resolveiq.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider tokenProvider;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userRepository, passwordEncoder, tokenProvider);
    }

    @Test
    @DisplayName("Should register new user, encode password, and return JWT token")
    void testRegister_Success() {
        RegisterRequest request = new RegisterRequest(
                "Sophia Chen",
                "sophia@company.internal",
                "CloudSecure123!",
                Role.ENGINEER,
                "Cloud Operations"
        );

        when(userRepository.existsByEmail("sophia@company.internal")).thenReturn(false);
        when(passwordEncoder.encode("CloudSecure123!")).thenReturn("$2a$10$encodedHashString");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(tokenProvider.generateToken(eq("sophia@company.internal"), eq(Role.ENGINEER), eq("Sophia Chen")))
                .thenReturn("mocked.jwt.token");

        AuthResponse response = authService.register(request);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("mocked.jwt.token");
        assertThat(response.getEmail()).isEqualTo("sophia@company.internal");
        assertThat(response.getRole()).isEqualTo(Role.ENGINEER);
        assertThat(response.getDepartment()).isEqualTo("Cloud Operations");

        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw IllegalArgumentException when registering duplicate email")
    void testRegister_DuplicateEmail_ThrowsException() {
        RegisterRequest request = new RegisterRequest(
                "Sophia Chen",
                "sophia@company.internal",
                "CloudSecure123!",
                Role.ENGINEER,
                "Cloud Operations"
        );

        when(userRepository.existsByEmail("sophia@company.internal")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("User with email already exists");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should login successfully with matching password and return JWT")
    void testLogin_Success() {
        User user = new User(
                "USR-900",
                "Devon Clark",
                "devon@company.internal",
                "$2a$10$existingHash",
                Role.ENGINEER,
                "Infrastructure",
                Instant.now()
        );

        when(userRepository.findByEmail("devon@company.internal")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("CorrectPassword", "$2a$10$existingHash")).thenReturn(true);
        when(tokenProvider.generateToken(eq("devon@company.internal"), eq(Role.ENGINEER), eq("Devon Clark")))
                .thenReturn("valid.session.token");

        AuthResponse response = authService.login(new AuthRequest("devon@company.internal", "CorrectPassword"));

        assertThat(response.getToken()).isEqualTo("valid.session.token");
        assertThat(response.getEmail()).isEqualTo("devon@company.internal");
    }

    @Test
    @DisplayName("Should throw BadCredentialsException on password mismatch")
    void testLogin_WrongPassword_ThrowsException() {
        User user = new User(
                "USR-900",
                "Devon Clark",
                "devon@company.internal",
                "$2a$10$existingHash",
                Role.ENGINEER,
                "Infrastructure",
                Instant.now()
        );

        when(userRepository.findByEmail("devon@company.internal")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("WrongPassword", "$2a$10$existingHash")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(new AuthRequest("devon@company.internal", "WrongPassword")))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Invalid email or password");
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when querying non-existent email")
    void testGetUserByEmail_NotFound_ThrowsException() {
        when(userRepository.findByEmail("ghost@company.internal")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.getUserByEmail("ghost@company.internal"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found with email");
    }
}
