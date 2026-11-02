package com.resolveiq.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "incident_id", length = 36, nullable = false)
    private String incidentId;

    @Column(name = "actor_email", length = 255, nullable = false)
    private String actorEmail;

    @Column(name = "action_type", length = 50, nullable = false)
    private String actionType;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "timestamp", nullable = false)
    private Instant timestamp;

    public AuditLog() {
    }

    public AuditLog(String id, String incidentId, String actorEmail, String actionType, String notes, Instant timestamp) {
        this.id = id;
        this.incidentId = incidentId;
        this.actorEmail = actorEmail;
        this.actionType = actionType;
        this.notes = notes;
        this.timestamp = timestamp != null ? timestamp : Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.timestamp == null) {
            this.timestamp = Instant.now();
        }
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getIncidentId() {
        return incidentId;
    }

    public void setIncidentId(String incidentId) {
        this.incidentId = incidentId;
    }

    public String getActorEmail() {
        return actorEmail;
    }

    public void setActorEmail(String actorEmail) {
        this.actorEmail = actorEmail;
    }

    public String getActionType() {
        return actionType;
    }

    public void setActionType(String actionType) {
        this.actionType = actionType;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
}
