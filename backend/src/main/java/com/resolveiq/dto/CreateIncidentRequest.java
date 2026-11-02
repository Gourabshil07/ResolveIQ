package com.resolveiq.dto;

import com.resolveiq.entity.Category;
import com.resolveiq.entity.Priority;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateIncidentRequest {

    @NotBlank(message = "Title must not be blank")
    @Size(min = 5, max = 255, message = "Title must be between 5 and 255 characters")
    private String title;

    @NotBlank(message = "Description must not be blank")
    @Size(min = 10, message = "Description must contain at least 10 characters")
    private String description;

    @NotNull(message = "Category is required")
    private Category category;

    @NotNull(message = "Priority is required")
    private Priority priority;

    @NotBlank(message = "Affected service name is required")
    private String serviceName;

    @NotBlank(message = "Reporter email is required")
    @Email(message = "Valid corporate reporter email is required")
    private String reporterEmail;

    private String assigneeEmail;
    private String symptoms;
    private String logsSnippet;

    public CreateIncidentRequest() {
    }

    public CreateIncidentRequest(String title, String description, Category category,
                                 Priority priority, String serviceName, String reporterEmail,
                                 String assigneeEmail, String symptoms, String logsSnippet) {
        this.title = title;
        this.description = description;
        this.category = category;
        this.priority = priority;
        this.serviceName = serviceName;
        this.reporterEmail = reporterEmail;
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
}
