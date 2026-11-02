package com.resolveiq.service;

import com.resolveiq.dto.*;
import com.resolveiq.entity.*;
import com.resolveiq.exception.InvalidStatusTransitionException;
import com.resolveiq.exception.ResourceNotFoundException;
import com.resolveiq.repository.AuditLogRepository;
import com.resolveiq.repository.IncidentCommentRepository;
import com.resolveiq.repository.IncidentRepository;
import com.resolveiq.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final IncidentCommentRepository commentRepository;
    private final AuditLogRepository auditLogRepository;
    private final UserRepository userRepository;

    public IncidentService(IncidentRepository incidentRepository,
                           IncidentCommentRepository commentRepository,
                           AuditLogRepository auditLogRepository,
                           UserRepository userRepository) {
        this.incidentRepository = incidentRepository;
        this.commentRepository = commentRepository;
        this.auditLogRepository = auditLogRepository;
        this.userRepository = userRepository;
    }

    public IncidentResponse createIncident(CreateIncidentRequest request, String authenticatedUserEmail) {
        Instant now = Instant.now();
        Instant slaDeadline = now.plus(request.getPriority().getSlaResolutionHours(), ChronoUnit.HOURS);
        String uniqueId = "INC-2026-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();

        Incident incident = new Incident();
        incident.setId(uniqueId);
        incident.setTitle(request.getTitle().trim());
        incident.setDescription(request.getDescription().trim());
        incident.setCategory(request.getCategory());
        incident.setPriority(request.getPriority());
        incident.setStatus(IncidentStatus.NEW);
        incident.setServiceName(request.getServiceName().trim());
        incident.setReporterEmail(authenticatedUserEmail != null ? authenticatedUserEmail.toLowerCase() : request.getReporterEmail().trim().toLowerCase());
        incident.setAssigneeEmail(request.getAssigneeEmail() != null ? request.getAssigneeEmail().trim().toLowerCase() : null);
        incident.setSymptoms(request.getSymptoms());
        incident.setLogsSnippet(request.getLogsSnippet());
        incident.setCreatedAt(now);
        incident.setUpdatedAt(now);
        incident.setSlaExpiresAt(slaDeadline);

        Incident saved = incidentRepository.save(incident);

        // Record creation audit trail
        recordAudit(saved.getId(), incident.getReporterEmail(), "CREATED", "Incident logged: " + saved.getTitle());

        return IncidentResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public IncidentResponse getIncidentById(String id, String userEmail, Role userRole) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found with ID: " + id));

        // Enforce authorization: Employees can only view their own reported or assigned incidents
        if (userRole == Role.EMPLOYEE && !incident.getReporterEmail().equalsIgnoreCase(userEmail)
                && (incident.getAssigneeEmail() == null || !incident.getAssigneeEmail().equalsIgnoreCase(userEmail))) {
            throw new AccessDeniedException("Access denied: You do not have permission to view incident " + id);
        }

        return IncidentResponse.fromEntity(incident);
    }

    @Transactional(readOnly = true)
    public List<IncidentResponse> listIncidents(IncidentStatus status, Priority priority,
                                                Category category, String service, String search,
                                                String userEmail, Role userRole) {
        List<Incident> incidents = incidentRepository.searchIncidents(status, priority, category, service, search);

        // If employee, filter to only tickets they reported or are assigned to
        if (userRole == Role.EMPLOYEE) {
            incidents = incidents.stream()
                    .filter(i -> i.getReporterEmail().equalsIgnoreCase(userEmail)
                            || (i.getAssigneeEmail() != null && i.getAssigneeEmail().equalsIgnoreCase(userEmail)))
                    .toList();
        }

        return incidents.stream().map(IncidentResponse::fromEntity).toList();
    }

    public IncidentResponse updateIncident(String id, UpdateIncidentRequest request, String actorEmail, Role actorRole) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident not found with ID: " + id));

        // Employees cannot reassign or change status on incidents
        if (actorRole == Role.EMPLOYEE && (request.getStatus() != null || request.getAssigneeEmail() != null)) {
            throw new AccessDeniedException("Employees are not authorized to update incident status or assignment.");
        }

        if (request.getTitle() != null && !request.getTitle().isBlank()) {
            incident.setTitle(request.getTitle().trim());
        }

        if (request.getDescription() != null && !request.getDescription().isBlank()) {
            incident.setDescription(request.getDescription().trim());
        }

        if (request.getCategory() != null) {
            incident.setCategory(request.getCategory());
        }

        if (request.getPriority() != null && request.getPriority() != incident.getPriority()) {
            recordAudit(id, actorEmail, "PRIORITY_CHANGED", "Severity adjusted from " + incident.getPriority() + " to " + request.getPriority());
            incident.setPriority(request.getPriority());
            if (incident.getStatus() != IncidentStatus.RESOLVED && incident.getStatus() != IncidentStatus.CLOSED) {
                incident.setSlaExpiresAt(incident.getCreatedAt().plus(request.getPriority().getSlaResolutionHours(), ChronoUnit.HOURS));
            }
        }

        if (request.getStatus() != null && request.getStatus() != incident.getStatus()) {
            IncidentStatus currentStatus = incident.getStatus();
            IncidentStatus targetStatus = request.getStatus();

            if (!currentStatus.canTransitionTo(targetStatus)) {
                throw new InvalidStatusTransitionException(
                        String.format("Invalid status transition from '%s' to '%s'.", currentStatus, targetStatus)
                );
            }

            incident.setStatus(targetStatus);
            recordAudit(id, actorEmail, "STATUS_CHANGED", "Status shifted to " + targetStatus);

            if (targetStatus == IncidentStatus.RESOLVED && incident.getResolvedAt() == null) {
                incident.setResolvedAt(Instant.now());
            } else if (targetStatus != IncidentStatus.RESOLVED && targetStatus != IncidentStatus.CLOSED) {
                incident.setResolvedAt(null);
            }
        }

        boolean isAssigneeChanged = (request.getAssigneeEmail() != null && !request.getAssigneeEmail().equalsIgnoreCase(incident.getAssigneeEmail()))
                || (request.getAssigneeEmail() == null && incident.getAssigneeEmail() != null && request.getTitle() == null && request.getDescription() == null && request.getStatus() == null);

        if (isAssigneeChanged) {
            if (incident.getStatus() == IncidentStatus.RESOLVED) {
                throw new IllegalStateException("Resolved incidents cannot be reassigned.");
            }
            incident.setAssigneeEmail(request.getAssigneeEmail() != null ? request.getAssigneeEmail().trim().toLowerCase() : null);
            recordAudit(id, actorEmail, "ASSIGNED", incident.getAssigneeEmail() != null ? ("Assigned to " + incident.getAssigneeEmail()) : "Unassigned");
        }

        if (request.getServiceName() != null && !request.getServiceName().isBlank()) {
            incident.setServiceName(request.getServiceName().trim());
        }

        if (request.getSymptoms() != null) {
            incident.setSymptoms(request.getSymptoms());
        }

        if (request.getLogsSnippet() != null) {
            incident.setLogsSnippet(request.getLogsSnippet());
        }

        incident.setUpdatedAt(Instant.now());
        Incident updated = incidentRepository.save(incident);
        return IncidentResponse.fromEntity(updated);
    }

    public IncidentComment addComment(String incidentId, String commentText, String authorEmail) {
        if (!incidentRepository.existsById(incidentId)) {
            throw new ResourceNotFoundException("Cannot comment: incident not found with ID: " + incidentId);
        }

        String commentId = "CMT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        IncidentComment comment = new IncidentComment(commentId, incidentId, authorEmail, commentText.trim(), Instant.now());
        IncidentComment saved = commentRepository.save(comment);

        recordAudit(incidentId, authorEmail, "COMMENT_ADDED", "Activity note posted by " + authorEmail);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<IncidentComment> getComments(String incidentId) {
        return commentRepository.findByIncidentIdOrderByCreatedAtAsc(incidentId);
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getAuditLogs(String incidentId) {
        return auditLogRepository.findByIncidentIdOrderByTimestampDesc(incidentId);
    }

    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats() {
        List<Incident> all = incidentRepository.findAll();
        long total = all.size();
        long open = all.stream().filter(i -> i.getStatus() != IncidentStatus.RESOLVED && i.getStatus() != IncidentStatus.CLOSED).count();
        long p1s = all.stream().filter(i -> i.getPriority() == Priority.P1_CRITICAL && i.getStatus() != IncidentStatus.RESOLVED && i.getStatus() != IncidentStatus.CLOSED).count();
        long resolved = all.stream().filter(i -> i.getStatus() == IncidentStatus.RESOLVED || i.getStatus() == IncidentStatus.CLOSED).count();

        Instant now = Instant.now();
        long breached = all.stream()
                .filter(i -> i.getStatus() != IncidentStatus.RESOLVED && i.getStatus() != IncidentStatus.CLOSED)
                .filter(i -> i.getSlaExpiresAt() != null && i.getSlaExpiresAt().isBefore(now))
                .count();

        int compliance = total > 0 ? (int) Math.round(((double) (total - breached) / total) * 100) : 100;

        long totalResolvedMins = 0;
        long resolvedCount = 0;
        for (Incident i : all) {
            if (i.getResolvedAt() != null && i.getCreatedAt() != null) {
                long mins = Duration.between(i.getCreatedAt(), i.getResolvedAt()).toMinutes();
                if (mins > 0) {
                    totalResolvedMins += mins;
                    resolvedCount++;
                }
            }
        }
        long avgMttr = resolvedCount > 0 ? Math.round((double) totalResolvedMins / resolvedCount) : 0;

        return new DashboardStatsResponse(total, open, p1s, resolved, compliance, avgMttr);
    }

    public void deleteIncident(String id) {
        if (!incidentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Cannot delete: incident not found with ID: " + id);
        }
        incidentRepository.deleteById(id);
    }

    private void recordAudit(String incidentId, String actorEmail, String actionType, String notes) {
        String logId = "AUD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        AuditLog log = new AuditLog(logId, incidentId, actorEmail, actionType, notes, Instant.now());
        auditLogRepository.save(log);
    }
}
