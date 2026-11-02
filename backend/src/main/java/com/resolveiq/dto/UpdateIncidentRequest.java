package com.resolveiq.dto;

import com.resolveiq.entity.Category;
import com.resolveiq.entity.IncidentStatus;
import com.resolveiq.entity.Priority;
import jakarta.validation.constraints.Size;

public class UpdateIncidentRequest {

    @Size(min = 5, max = 255, message = "Title must be between 5 and 255 characters")
    private String title;

    @Size(min = 10, message = "Description must contain at least 10 characters")
    private String description;

    private Category category;
    private Priority priority;
    private IncidentStatus status;
    private String serviceName;
    private String assigneeEmail;
    private String symptoms;
    private String logsSnippet;

    public UpdateIncidentRequest() {
    }

    public UpdateIncidentRequest(String title, String description, Category category,
                                 Priority priority, IncidentStatus status, String serviceName,
                                 String assigneeEmail, String symptoms, String logsSnippet) {
        this.title = title;
        this.description = description;
        this.category = category;
        this.priority = priority;
        this.status = status;
        this.serviceName = serviceName;
        this.assigneeEmail = assigneeEmail;
        this.symptoms = symptoms;
        this.logsSnippet = logsSnippet;
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
}
