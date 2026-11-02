package com.resolveiq.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resolveiq.dto.AuthRequest;
import com.resolveiq.dto.AuthResponse;
import com.resolveiq.dto.RegisterRequest;
import com.resolveiq.entity.Role;
import com.resolveiq.entity.User;
import com.resolveiq.security.JwtAuthenticationFilter;
import com.resolveiq.security.JwtTokenProvider;
import com.resolveiq.security.SecurityConfig;
import com.resolveiq.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @Test
    @DisplayName("POST /api/v1/auth/register - Should return 201 Created on valid registration")
    void testRegister_ValidPayload_Returns201Created() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Marcus Vance",
                "marcus@company.internal",
                "SecretPass123!",
                Role.ENGINEER,
                "Site Reliability"
        );

        AuthResponse response = new AuthResponse(
                "mocked.jwt.token",
                "USR-101",
                request.getName(),
                request.getEmail(),
                request.getRole(),
                request.getDepartment()
        );

        when(authService.register(any(RegisterRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("mocked.jwt.token"))
                .andExpect(jsonPath("$.email").value("marcus@company.internal"))
                .andExpect(jsonPath("$.role").value("ENGINEER"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/register - Should return 400 Bad Request on duplicate email")
    void testRegister_DuplicateEmail_Returns400BadRequest() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "Marcus Vance",
                "marcus@company.internal",
                "SecretPass123!",
                Role.ENGINEER,
                "Site Reliability"
        );

        when(authService.register(any(RegisterRequest.class)))
                .thenThrow(new IllegalArgumentException("User with email already exists: marcus@company.internal"));

        mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("User with email already exists: marcus@company.internal"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - Should return 200 OK and JWT on valid credentials")
    void testLogin_ValidCredentials_Returns200OK() throws Exception {
        AuthRequest request = new AuthRequest("marcus@company.internal", "SecretPass123!");

        AuthResponse response = new AuthResponse(
                "jwt.token.here",
                "USR-101",
                "Marcus Vance",
                "marcus@company.internal",
                Role.ENGINEER,
                "Site Reliability"
        );

        when(authService.login(any(AuthRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("jwt.token.here"))
                .andExpect(jsonPath("$.role").value("ENGINEER"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - Should return 401 Unauthorized on invalid password")
    void testLogin_InvalidCredentials_Returns401Unauthorized() throws Exception {
        AuthRequest request = new AuthRequest("marcus@company.internal", "WrongPassword");

        when(authService.login(any(AuthRequest.class)))
                .thenThrow(new BadCredentialsException("Invalid email or password."));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Invalid email or password."));
    }

    @Test
    @WithMockUser(username = "marcus@company.internal", roles = {"ENGINEER"})
    @DisplayName("GET /api/v1/auth/me - Should return current user profile")
    void testGetCurrentUser_Authenticated_Returns200OK() throws Exception {
        User user = new User(
                "USR-101",
                "Marcus Vance",
                "marcus@company.internal",
                "hashedPass",
                Role.ENGINEER,
                "Site Reliability",
                Instant.now()
        );

        when(authService.getUserByEmail("marcus@company.internal")).thenReturn(user);

        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("USR-101"))
                .andExpect(jsonPath("$.email").value("marcus@company.internal"));
    }
}
