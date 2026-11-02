package com.resolveiq.controller;

import com.resolveiq.dto.DashboardStatsResponse;
import com.resolveiq.service.IncidentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value = {"/api/dashboard", "/api/v1/dashboard"})
public class DashboardController {

    private final IncidentService incidentService;

    public DashboardController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    @GetMapping(value = {"/summary", "/stats"})
    public ResponseEntity<DashboardStatsResponse> getSummary() {
        DashboardStatsResponse stats = incidentService.getDashboardStats();
        return ResponseEntity.ok(stats);
    }
}
