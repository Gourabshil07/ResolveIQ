package com.resolveiq.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resolveiq.dto.CommentRequest;
import com.resolveiq.dto.CreateIncidentRequest;
import com.resolveiq.dto.IncidentResponse;
import com.resolveiq.dto.UpdateIncidentRequest;
import com.resolveiq.entity.Category;
import com.resolveiq.entity.IncidentComment;
import com.resolveiq.entity.IncidentStatus;
import com.resolveiq.entity.Priority;
import com.resolveiq.entity.Role;
import com.resolveiq.exception.InvalidStatusTransitionException;
import com.resolveiq.exception.ResourceNotFoundException;
import com.resolveiq.security.JwtAuthenticationFilter;
import com.resolveiq.security.JwtTokenProvider;
import com.resolveiq.security.SecurityConfig;
import com.resolveiq.service.IncidentService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(IncidentController.class)
@Import({SecurityConfig.class, JwtAuthenticationFilter.class})
class IncidentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private IncidentService incidentService;

    @MockBean
    private JwtTokenProvider jwtTokenProvider;

    @Test
    @WithMockUser(username = "sre@company.internal", roles = {"ENGINEER"})
    @DisplayName("POST /api/v1/incidents - Should return 201 Created on valid payload")
    void testCreateIncident_ValidPayload_Returns201Created() throws Exception {
        CreateIncidentRequest request = new CreateIncidentRequest(
                "Kubernetes Ingress OOMKilled",
                "Pod terminated with exit code 137 due to memory limit spike.",
                Category.CLOUD_INFRA,
                Priority.P2_HIGH,
                "Kubernetes Ingress Cluster",
                "sre@company.internal",
                null,
                "HTTP 502 Bad Gateway",
                "Kernel OOM killer invoked"
        );

        IncidentResponse mockResponse = new IncidentResponse(
                "INC-2026-ABCD",
                request.getTitle(),
                request.getDescription(),
                request.getCategory(),
                request.getPriority(),
                IncidentStatus.NEW,
                request.getServiceName(),
                "sre@company.internal",
                null,
                request.getSymptoms(),
                request.getLogsSnippet(),
                Instant.now(),
                Instant.now(),
                Instant.now().plusSeconds(14400),
                null,
                false
        );

        when(incidentService.createIncident(any(CreateIncidentRequest.class), eq("sre@company.internal")))
                .thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/incidents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value("INC-2026-ABCD"))
                .andExpect(jsonPath("$.title").value("Kubernetes Ingress OOMKilled"))
                .andExpect(jsonPath("$.status").value("NEW"))
                .andExpect(jsonPath("$.priority").value("P2_HIGH"));
    }

    @Test
    @WithMockUser(username = "reporter@company.internal", roles = {"EMPLOYEE"})
    @DisplayName("POST /api/v1/incidents - Should return 400 Bad Request when title is blank")
    void testCreateIncident_BlankTitle_Returns400BadRequest() throws Exception {
        CreateIncidentRequest invalidRequest = new CreateIncidentRequest(
                "", // Blank title
                "Detailed description of the issue occurring on server.",
                Category.SOFTWARE,
                Priority.P3_MEDIUM,
                "Stripe Gateway",
                "reporter@company.internal",
                null, null, null
        );

        mockMvc.perform(post("/api/v1/incidents")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.error").value("Validation Failed"))
                .andExpect(jsonPath("$.validationErrors").isArray());
    }

    @Test
    @WithMockUser(username = "elena@company.internal", roles = {"ENGINEER"})
    @DisplayName("GET /api/v1/incidents/{id} - Should return 200 OK when incident exists")
    void testGetIncident_ExistingId_Returns200OK() throws Exception {
        IncidentResponse mockResponse = new IncidentResponse(
                "INC-2026-1042",
                "Aurora PostgreSQL pool starvation",
                "Connection timeout in payment service pool.",
                Category.DATABASE,
                Priority.P1_CRITICAL,
                IncidentStatus.IN_PROGRESS,
                "AWS Aurora PostgreSQL",
                "elena@company.internal",
                "devon@company.internal",
                null, null,
                Instant.now(), Instant.now(), Instant.now().plusSeconds(7200), null, false
        );

        when(incidentService.getIncidentById(eq("INC-2026-1042"), eq("elena@company.internal"), eq(Role.ENGINEER)))
                .thenReturn(mockResponse);

        mockMvc.perform(get("/api/v1/incidents/INC-2026-1042"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("INC-2026-1042"))
                .andExpect(jsonPath("$.serviceName").value("AWS Aurora PostgreSQL"));
    }

    @Test
    @WithMockUser(username = "elena@company.internal", roles = {"ENGINEER"})
    @DisplayName("GET /api/v1/incidents/{id} - Should return 404 Not Found when missing")
    void testGetIncident_NonExistingId_Returns404NotFound() throws Exception {
        when(incidentService.getIncidentById(eq("INC-NOT-FOUND"), eq("elena@company.internal"), eq(Role.ENGINEER)))
                .thenThrow(new ResourceNotFoundException("Incident not found with ID: INC-NOT-FOUND"));

        mockMvc.perform(get("/api/v1/incidents/INC-NOT-FOUND"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Incident not found with ID: INC-NOT-FOUND"));
    }

    @Test
    @WithMockUser(username = "devon@company.internal", roles = {"ENGINEER"})
    @DisplayName("PUT /api/v1/incidents/{id} - Should return 400 Bad Request on illegal status transition")
    void testUpdateIncident_InvalidStatusTransition_Returns400BadRequest() throws Exception {
        UpdateIncidentRequest updateRequest = new UpdateIncidentRequest();
        updateRequest.setStatus(IncidentStatus.NEW);

        when(incidentService.updateIncident(eq("INC-2026-9999"), any(UpdateIncidentRequest.class), eq("devon@company.internal"), eq(Role.ENGINEER)))
                .thenThrow(new InvalidStatusTransitionException("Invalid status transition from 'CLOSED' to 'NEW'."));

        mockMvc.perform(put("/api/v1/incidents/INC-2026-9999")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Invalid status transition from 'CLOSED' to 'NEW'."));
    }

    @Test
    @WithMockUser(username = "employee@company.internal", roles = {"EMPLOYEE"})
    @DisplayName("PUT /api/v1/incidents/{id} - Should return 403 Forbidden when employee attempts update")
    void testUpdateIncident_EmployeeForbidden_Returns403() throws Exception {
        UpdateIncidentRequest updateRequest = new UpdateIncidentRequest();
        updateRequest.setStatus(IncidentStatus.IN_PROGRESS);

        mockMvc.perform(put("/api/v1/incidents/INC-2026-1042")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin@company.internal", roles = {"ADMIN"})
    @DisplayName("DELETE /api/v1/incidents/{id} - Should return 204 No Content for ADMIN")
    void testDeleteIncident_AdminAllowed_Returns204NoContent() throws Exception {
        mockMvc.perform(delete("/api/v1/incidents/INC-2026-1042"))
                .andExpect(status().isNoContent());

        verify(incidentService).deleteIncident("INC-2026-1042");
    }

    @Test
    @WithMockUser(username = "engineer@company.internal", roles = {"ENGINEER"})
    @DisplayName("DELETE /api/v1/incidents/{id} - Should return 403 Forbidden for non-admin")
    void testDeleteIncident_EngineerForbidden_Returns403() throws Exception {
        mockMvc.perform(delete("/api/v1/incidents/INC-2026-1042"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "sre@company.internal", roles = {"ENGINEER"})
    @DisplayName("POST /api/v1/incidents/{id}/comments - Should return 201 Created")
    void testAddComment_ValidPayload_Returns201Created() throws Exception {
        CommentRequest commentRequest = new CommentRequest("Restarting ingress pod replicas.");

        IncidentComment comment = new IncidentComment(
                "CMT-1001",
                "INC-2026-1042",
                "sre@company.internal",
                "Restarting ingress pod replicas.",
                Instant.now()
        );

    @Test
    @WithMockUser(username = "admin@resolveiq.internal", roles = {"ADMIN"})
    @DisplayName("PATCH /api/v1/incidents/{id}/assign - Should return 409 Conflict when reassigning RESOLVED incident")
    void testAssignIncident_ResolvedIncident_Returns409Conflict() throws Exception {
        when(incidentService.updateIncident(eq("INC-2026-RESOLVED"), any(UpdateIncidentRequest.class), any(), any()))
                .thenThrow(new IllegalStateException("Resolved incidents cannot be reassigned."));

        mockMvc.perform(patch("/api/v1/incidents/INC-2026-RESOLVED/assign")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"assigneeEmail\":\"eng2@resolveiq.internal\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Resolved incidents cannot be reassigned."));
    }

    @Test
    @WithMockUser(username = "admin@resolveiq.internal", roles = {"ADMIN"})
    @DisplayName("PATCH /api/v1/incidents/{id}/assign - Should return 200 OK when reassigning eligible unresolved incident")
    void testAssignIncident_UnresolvedIncident_Returns200Ok() throws Exception {
        IncidentResponse mockResponse = new IncidentResponse(
                "INC-2026-OPEN",
                "Database Connection Timeout",
                "Database pool exhausted",
                Category.DATABASE,
                Priority.P2_HIGH,
                IncidentStatus.INVESTIGATING,
                "User DB",
                "reporter@resolveiq.internal",
                "eng2@resolveiq.internal",
                "Connection timeout",
                null,
                Instant.now(),
                Instant.now(),
                Instant.now().plusSeconds(14400),
                null,
                false
        );

        when(incidentService.updateIncident(eq("INC-2026-OPEN"), any(UpdateIncidentRequest.class), any(), any()))
                .thenReturn(mockResponse);

        mockMvc.perform(patch("/api/v1/incidents/INC-2026-OPEN/assign")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"assigneeEmail\":\"eng2@resolveiq.internal\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("INC-2026-OPEN"))
                .andExpect(jsonPath("$.assigneeEmail").value("eng2@resolveiq.internal"));
    }
}
