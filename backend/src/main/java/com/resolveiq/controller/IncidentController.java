package com.resolveiq.controller;

import com.resolveiq.dto.CommentRequest;
import com.resolveiq.dto.CreateIncidentRequest;
import com.resolveiq.dto.IncidentResponse;
import com.resolveiq.dto.UpdateIncidentRequest;
import com.resolveiq.entity.*;
import com.resolveiq.service.IncidentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping(value = {"/api/incidents", "/api/v1/incidents"})
public class IncidentController {

    private final IncidentService incidentService;
    private final com.resolveiq.repository.UserRepository userRepository;

    public IncidentController(IncidentService incidentService, com.resolveiq.repository.UserRepository userRepository) {
        this.incidentService = incidentService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<IncidentResponse> createIncident(
            @Valid @RequestBody CreateIncidentRequest request,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : request.getReporterEmail();
        IncidentResponse response = incidentService.createIncident(request, email);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<IncidentResponse>> listIncidents(
            @RequestParam(required = false) IncidentStatus status,
            @RequestParam(required = false) Priority priority,
            @RequestParam(required = false) Category category,
            @RequestParam(required = false) String service,
            @RequestParam(required = false) String search,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : "";
        Role role = resolveRole(authentication);
        List<IncidentResponse> incidents = incidentService.listIncidents(status, priority, category, service, search, email, role);
        return ResponseEntity.ok(incidents);
    }

    @GetMapping("/{id}")
    public ResponseEntity<IncidentResponse> getIncident(
            @PathVariable String id,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : "";
        Role role = resolveRole(authentication);
        IncidentResponse response = incidentService.getIncidentById(id, email, role);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPPORT_ENGINEER', 'ENGINEER', 'ADMIN')")
    public ResponseEntity<IncidentResponse> updateStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> payload,
            Authentication authentication
    ) {
        String statusStr = payload.get("status");
        String resolutionNotes = payload.get("resolutionNotes");
        IncidentStatus status = IncidentStatus.valueOf(statusStr);
        String actorEmail = authentication != null ? authentication.getName() : "system@resolveiq.internal";
        Role role = resolveRole(authentication);

        UpdateIncidentRequest updateReq = new UpdateIncidentRequest();
        updateReq.setStatus(status);
        IncidentResponse response = incidentService.updateIncident(id, updateReq, actorEmail, role);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('SUPPORT_ENGINEER', 'ENGINEER', 'ADMIN')")
    public ResponseEntity<?> assignIncident(
            @PathVariable String id,
            @RequestBody Map<String, String> payload,
            Authentication authentication
    ) {
        String assigneeId = payload.get("assigneeId");
        String assigneeEmail = payload.get("assigneeEmail");
        String actorEmail = authentication != null ? authentication.getName() : "system@resolveiq.internal";
        Role role = resolveRole(authentication);

        UpdateIncidentRequest updateReq = new UpdateIncidentRequest();

        if (assigneeId != null) {
            if ("UNASSIGNED".equalsIgnoreCase(assigneeId) || assigneeId.isBlank()) {
                updateReq.setAssigneeEmail(null);
            } else {
                User engineer = userRepository.findById(assigneeId)
                        .orElse(null);
                if (engineer == null || engineer.getRole() != Role.SUPPORT_ENGINEER) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("error", "Assignee must be a registered Support Engineer"));
                }
                updateReq.setAssigneeEmail(engineer.getEmail());
            }
        } else if (assigneeEmail != null && !assigneeEmail.isBlank()) {
            if ("UNASSIGNED".equalsIgnoreCase(assigneeEmail)) {
                updateReq.setAssigneeEmail(null);
            } else {
                User engineer = userRepository.findByEmail(assigneeEmail.trim().toLowerCase())
                        .orElse(null);
                if (engineer == null || engineer.getRole() != Role.SUPPORT_ENGINEER) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("error", "Assignee must be a registered Support Engineer"));
                }
                updateReq.setAssigneeEmail(engineer.getEmail());
            }
        } else {
            updateReq.setAssigneeEmail(null);
        }

        IncidentResponse response = incidentService.updateIncident(id, updateReq, actorEmail, role);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPPORT_ENGINEER', 'ENGINEER', 'ADMIN')")
    public ResponseEntity<IncidentResponse> updateIncident(
            @PathVariable String id,
            @Valid @RequestBody UpdateIncidentRequest request,
            Authentication authentication
    ) {
        String email = authentication != null ? authentication.getName() : "engineer@company.internal";
        Role role = resolveRole(authentication);
        IncidentResponse response = incidentService.updateIncident(id, request, email, role);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteIncident(@PathVariable String id) {
        incidentService.deleteIncident(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<IncidentComment> addComment(
            @PathVariable String id,
            @Valid @RequestBody CommentRequest request,
            Authentication authentication
    ) {
        String authorEmail = authentication != null ? authentication.getName() : "user@company.internal";
        IncidentComment comment = incidentService.addComment(id, request.getCommentText(), authorEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    @GetMapping("/{id}/comments")
    public ResponseEntity<List<IncidentComment>> getComments(@PathVariable String id) {
        List<IncidentComment> comments = incidentService.getComments(id);
        return ResponseEntity.ok(comments);
    }

    @GetMapping("/{id}/audit")
    @PreAuthorize("hasAnyRole('SUPPORT_ENGINEER', 'ENGINEER', 'ADMIN')")
    public ResponseEntity<List<AuditLog>> getAuditLogs(@PathVariable String id) {
        List<AuditLog> logs = incidentService.getAuditLogs(id);
        return ResponseEntity.ok(logs);
    }

    private Role resolveRole(Authentication authentication) {
        if (authentication == null) return Role.ADMIN;
        return authentication.getAuthorities().stream()
                .findFirst()
                .map(a -> {
                    String auth = a.getAuthority();
                    if (auth.startsWith("ROLE_")) {
                        return Role.valueOf(auth.substring(5));
                    }
                    return Role.valueOf(auth);
                })
                .orElse(Role.IT_USER);
    }
}
