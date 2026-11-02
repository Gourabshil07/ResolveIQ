package com.resolveiq.service;

import com.resolveiq.dto.CreateIncidentRequest;
import com.resolveiq.dto.DashboardStatsResponse;
import com.resolveiq.dto.IncidentResponse;
import com.resolveiq.dto.UpdateIncidentRequest;
import com.resolveiq.entity.*;
import com.resolveiq.exception.InvalidStatusTransitionException;
import com.resolveiq.exception.ResourceNotFoundException;
import com.resolveiq.repository.AuditLogRepository;
import com.resolveiq.repository.IncidentCommentRepository;
import com.resolveiq.repository.IncidentRepository;
import com.resolveiq.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class IncidentServiceTest {

    @Mock
    private IncidentRepository incidentRepository;

    @Mock
    private IncidentCommentRepository commentRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private UserRepository userRepository;

    private IncidentService incidentService;

    @BeforeEach
    void setUp() {
        incidentService = new IncidentService(incidentRepository, commentRepository, auditLogRepository, userRepository);
    }

    @Test
    @DisplayName("Should create P1 incident with 2-hour SLA deadline and audit trail")
    void testCreateIncident_CalculatesSlaCorrectlyForP1() {
        CreateIncidentRequest request = new CreateIncidentRequest(
                "PostgreSQL Connection Starvation",
                "Connection timeout in payment service pool.",
                Category.DATABASE,
                Priority.P1_CRITICAL,
                "AWS Aurora PostgreSQL",
                "reporter@company.internal",
                null,
                "504 Gateway Timeout",
                "HikariPool-1 empty"
        );

        when(incidentRepository.save(any(Incident.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Instant before = Instant.now();
        IncidentResponse response = incidentService.createIncident(request, "reporter@company.internal");

        assertThat(response).isNotNull();
        assertThat(response.getId()).startsWith("INC-2026-");
        assertThat(response.getStatus()).isEqualTo(IncidentStatus.NEW);
        assertThat(response.getPriority()).isEqualTo(Priority.P1_CRITICAL);

        Duration slaDiff = Duration.between(before, response.getSlaExpiresAt());
        assertThat(slaDiff.toMinutes()).isBetween(118L, 122L);

        verify(incidentRepository, times(1)).save(any(Incident.class));
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("Should deny EMPLOYEE access to an incident reported by another employee")
    void testGetIncident_EmployeeAccessDeniedToOthersTickets() {
        Incident incident = new Incident();
        incident.setId("INC-2026-0002");
        incident.setReporterEmail("alice@company.internal");
        incident.setAssigneeEmail(null);

        when(incidentRepository.findById("INC-2026-0002")).thenReturn(Optional.of(incident));

        assertThatThrownBy(() -> incidentService.getIncidentById("INC-2026-0002", "bob@company.internal", Role.EMPLOYEE))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Access denied: You do not have permission to view incident");
    }

    @Test
    @DisplayName("Should allow ENGINEER access to any incident")
    void testGetIncident_EngineerAccessAllowed() {
        Incident incident = new Incident();
        incident.setId("INC-2026-0002");
        incident.setReporterEmail("alice@company.internal");
        incident.setServiceName("AWS SQS");
        incident.setStatus(IncidentStatus.NEW);

        when(incidentRepository.findById("INC-2026-0002")).thenReturn(Optional.of(incident));

        IncidentResponse response = incidentService.getIncidentById("INC-2026-0002", "engineer@company.internal", Role.ENGINEER);
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo("INC-2026-0002");
    }

    @Test
    @DisplayName("Should deny EMPLOYEE from changing incident status")
    void testUpdateIncident_EmployeeCannotChangeStatus() {
        Incident existing = new Incident();
        existing.setId("INC-2026-0003");
        existing.setReporterEmail("employee@company.internal");
        existing.setStatus(IncidentStatus.NEW);

        when(incidentRepository.findById("INC-2026-0003")).thenReturn(Optional.of(existing));

        UpdateIncidentRequest updateReq = new UpdateIncidentRequest();
        updateReq.setStatus(IncidentStatus.RESOLVED);

        assertThatThrownBy(() -> incidentService.updateIncident("INC-2026-0003", updateReq, "employee@company.internal", Role.EMPLOYEE))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("Employees are not authorized to update incident status or assignment");
    }

    @Test
    @DisplayName("Should reject illegal status transition from CLOSED to NEW")
    void testUpdateStatus_InvalidTransition_ThrowsException() {
        Incident closedIncident = new Incident();
        closedIncident.setId("INC-2026-9999");
        closedIncident.setStatus(IncidentStatus.CLOSED);

        when(incidentRepository.findById("INC-2026-9999")).thenReturn(Optional.of(closedIncident));

        UpdateIncidentRequest updateReq = new UpdateIncidentRequest();
        updateReq.setStatus(IncidentStatus.NEW);

        assertThatThrownBy(() -> incidentService.updateIncident("INC-2026-9999", updateReq, "engineer@company.internal", Role.ENGINEER))
                .isInstanceOf(InvalidStatusTransitionException.class)
                .hasMessageContaining("Invalid status transition from 'CLOSED' to 'NEW'");

        verify(incidentRepository, never()).save(any(Incident.class));
    }

    @Test
    @DisplayName("Should add comment and write audit entry")
    void testAddComment_Success() {
        when(incidentRepository.existsById("INC-2026-0010")).thenReturn(true);
        when(commentRepository.save(any(IncidentComment.class))).thenAnswer(invocation -> invocation.getArgument(0));

        IncidentComment comment = incidentService.addComment("INC-2026-0010", "Scaling pool size to 350 connections.", "engineer@company.internal");

        assertThat(comment).isNotNull();
        assertThat(comment.getCommentText()).isEqualTo("Scaling pool size to 350 connections.");
        assertThat(comment.getAuthorEmail()).isEqualTo("engineer@company.internal");

        verify(commentRepository).save(any(IncidentComment.class));
        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("Should aggregate dashboard stats from incident repository")
    void testGetDashboardStats_Success() {
        Incident i1 = new Incident();
        i1.setStatus(IncidentStatus.IN_PROGRESS);
        i1.setPriority(Priority.P1_CRITICAL);
        i1.setCreatedAt(Instant.now());
        i1.setSlaExpiresAt(Instant.now().plus(Duration.ofHours(2)));

        Incident i2 = new Incident();
        i2.setStatus(IncidentStatus.RESOLVED);
        i2.setPriority(Priority.P2_HIGH);
        i2.setCreatedAt(Instant.now().minus(Duration.ofHours(1)));
        i2.setResolvedAt(Instant.now());
        i2.setSlaExpiresAt(Instant.now().plus(Duration.ofHours(3)));

        when(incidentRepository.findAll()).thenReturn(List.of(i1, i2));

        DashboardStatsResponse stats = incidentService.getDashboardStats();

        assertThat(stats.getTotalIncidents()).isEqualTo(2);
        assertThat(stats.getActiveIncidents()).isEqualTo(1);
        assertThat(stats.getCriticalP1Incidents()).isEqualTo(1);
        assertThat(stats.getResolvedIncidents()).isEqualTo(1);
        assertThat(stats.getSlaComplianceRate()).isEqualTo(100);
    }
}
