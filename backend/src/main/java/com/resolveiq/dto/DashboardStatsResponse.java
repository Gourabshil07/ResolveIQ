package com.resolveiq.dto;

public class DashboardStatsResponse {

    private long totalIncidents;
    private long activeIncidents;
    private long criticalP1Incidents;
    private long resolvedIncidents;
    private int slaComplianceRate;
    private long averageMttrMinutes;

    public DashboardStatsResponse() {
    }

    public DashboardStatsResponse(long totalIncidents, long activeIncidents, long criticalP1Incidents,
                                  long resolvedIncidents, int slaComplianceRate, long averageMttrMinutes) {
        this.totalIncidents = totalIncidents;
        this.activeIncidents = activeIncidents;
        this.criticalP1Incidents = criticalP1Incidents;
        this.resolvedIncidents = resolvedIncidents;
        this.slaComplianceRate = slaComplianceRate;
        this.averageMttrMinutes = averageMttrMinutes;
    }

    public long getTotalIncidents() {
        return totalIncidents;
    }

    public void setTotalIncidents(long totalIncidents) {
        this.totalIncidents = totalIncidents;
    }

    public long getActiveIncidents() {
        return activeIncidents;
    }

    public void setActiveIncidents(long activeIncidents) {
        this.activeIncidents = activeIncidents;
    }

    public long getCriticalP1Incidents() {
        return criticalP1Incidents;
    }

    public void setCriticalP1Incidents(long criticalP1Incidents) {
        this.criticalP1Incidents = criticalP1Incidents;
    }

    public long getResolvedIncidents() {
        return resolvedIncidents;
    }

    public void setResolvedIncidents(long resolvedIncidents) {
        this.resolvedIncidents = resolvedIncidents;
    }

    public int getSlaComplianceRate() {
        return slaComplianceRate;
    }

    public void setSlaComplianceRate(int slaComplianceRate) {
        this.slaComplianceRate = slaComplianceRate;
    }

    public long getAverageMttrMinutes() {
        return averageMttrMinutes;
    }

    public void setAverageMttrMinutes(long averageMttrMinutes) {
        this.averageMttrMinutes = averageMttrMinutes;
    }
}
