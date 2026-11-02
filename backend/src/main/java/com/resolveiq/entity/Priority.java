package com.resolveiq.entity;

public enum Priority {
    Low(48),
    Medium(12),
    High(4),
    Critical(2),
    P1_CRITICAL(2),
    P2_HIGH(4),
    P3_MEDIUM(12),
    P4_LOW(48);

    private final int slaResolutionHours;

    Priority(int slaResolutionHours) {
        this.slaResolutionHours = slaResolutionHours;
    }

    public int getSlaResolutionHours() {
        return slaResolutionHours;
    }
}
