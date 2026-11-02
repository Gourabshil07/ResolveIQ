package com.resolveiq.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "incident_comments")
public class IncidentComment {

    @Id
    @Column(name = "id", length = 36, nullable = false)
    private String id;

    @Column(name = "incident_id", length = 36, nullable = false)
    private String incidentId;

    @Column(name = "author_email", length = 255, nullable = false)
    private String authorEmail;

    @Column(name = "comment_text", columnDefinition = "TEXT", nullable = false)
    private String commentText;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    public IncidentComment() {
    }

    public IncidentComment(String id, String incidentId, String authorEmail, String commentText, Instant createdAt) {
        this.id = id;
        this.incidentId = incidentId;
        this.authorEmail = authorEmail;
        this.commentText = commentText;
        this.createdAt = createdAt != null ? createdAt : Instant.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
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

    public String getAuthorEmail() {
        return authorEmail;
    }

    public void setAuthorEmail(String authorEmail) {
        this.authorEmail = authorEmail;
    }

    public String getCommentText() {
        return commentText;
    }

    public void setCommentText(String commentText) {
        this.commentText = commentText;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
