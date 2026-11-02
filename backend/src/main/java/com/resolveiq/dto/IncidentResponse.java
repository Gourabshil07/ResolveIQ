package com.resolveiq.dto;

import com.resolveiq.entity.Category;
import com.resolveiq.entity.Incident;
import com.resolveiq.entity.IncidentStatus;
import com.resolveiq.entity.Priority;

import java.time.Instant;

public class IncidentResponse {

    private String id;
    private String title;
    private String description;
    private Category category;
    private Priority priority;
    private IncidentStatus status;
    private String serviceName;
    private String reporterEmail;
    private String assigneeEmail;
    private String symptoms;
    private String logsSnippet;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant slaExpiresAt;
    private Instant resolvedAt;
    private boolean slaBreached;

    public IncidentResponse() {
    }

    public IncidentResponse(String id, String title, String description, Category category,
                            Priority priority, IncidentStatus status, String serviceName,
                            String reporterEmail, String assigneeEmail, String symptoms,
                            String logsSnippet, Instant createdAt, Instant updatedAt,
                            Instant slaExpiresAt, Instant resolvedAt, boolean slaBreached) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.category = category;
        this.priority = priority;
        this.status = status;
        this.serviceName = serviceName;
        this.reporterEmail = reporterEmail;
        this.assigneeEmail = assigneeEmail;
        this.symptoms = symptoms;
        this.logsSnippet = logsSnippet;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.slaExpiresAt = slaExpiresAt;
        this.resolvedAt = resolvedAt;
        this.slaBreached = slaBreached;
    }

    public static IncidentResponse fromEntity(Incident incident) {
        boolean breached = false;
        if (incident.getStatus() != IncidentStatus.RESOLVED && incident.getStatus() != IncidentStatus.CLOSED) {
            breached = incident.getSlaExpiresAt() != null && incident.getSlaExpiresAt().isBefore(Instant.now());
        } else if (incident.getResolvedAt() != null && incident.getSlaExpiresAt() != null) {
            breached = incident.getResolvedAt().isAfter(incident.getSlaExpiresAt());
        }

        return new IncidentResponse(
                incident.getId(),
                incident.getTitle(),
                incident.getDescription(),
                incident.getCategory(),
                incident.getPriority(),
                incident.getStatus(),
                incident.getServiceName(),
                incident.getReporterEmail(),
                incident.getAssigneeEmail(),
                incident.getSymptoms(),
                incident.getLogsSnippet(),
                incident.getCreatedAt(),
                incident.getUpdatedAt(),
                incident.getSlaExpiresAt(),
                incident.getResolvedAt(),
                breached
        );
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Category getCategory() {
        return category;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public Priority getPriority() {
        return priority;
    }

    public void setPriority(Priority priority) {
        this.priority = priority;
    }

    public IncidentStatus getStatus() {
        return status;
    }

    public void setStatus(IncidentStatus status) {
        this.status = status;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(String serviceName) {
        this.serviceName = serviceName;
    }

    public String getReporterEmail() {
        return reporterEmail;
    }

    public void setReporterEmail(String reporterEmail) {
        this.reporterEmail = reporterEmail;
    }

    public String getAssigneeEmail() {
        return assigneeEmail;
    }

    public void setAssigneeEmail(String assigneeEmail) {
        this.assigneeEmail = assigneeEmail;
    }

    public String getSymptoms() {
        return symptoms;
    }

    public void setSymptoms(String symptoms) {
        this.symptoms = symptoms;
    }

    public String getLogsSnippet() {
        return logsSnippet;
    }

    public void setLogsSnippet(String logsSnippet) {
        this.logsSnippet = logsSnippet;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Instant getSlaExpiresAt() {
        return slaExpiresAt;
    }

    public void setSlaExpiresAt(Instant slaExpiresAt) {
        this.slaExpiresAt = slaExpiresAt;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }

    public void setResolvedAt(Instant resolvedAt) {
        this.resolvedAt = resolvedAt;
    }

    public boolean isSlaBreached() {
        return slaBreached;
    }

    public void setSlaBreached(boolean slaBreached) {
        this.slaBreached = slaBreached;
    }
}
