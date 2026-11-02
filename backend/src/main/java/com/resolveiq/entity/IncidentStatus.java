package com.resolveiq.entity;

import java.util.Set;

public enum IncidentStatus {
    OPEN,
    IN_PROGRESS,
    RESOLVED,
    NEW,
    TRIAGED,
    CLOSED;

    public boolean canTransitionTo(IncidentStatus next) {
        if (this == next) {
            return true;
        }
        return switch (this) {
            case OPEN, NEW -> Set.of(IN_PROGRESS, TRIAGED, CLOSED, RESOLVED).contains(next);
            case TRIAGED -> Set.of(IN_PROGRESS, RESOLVED, CLOSED).contains(next);
            case IN_PROGRESS -> Set.of(RESOLVED, OPEN, CLOSED).contains(next);
            case RESOLVED -> Set.of(IN_PROGRESS, CLOSED).contains(next); // Reopen
            case CLOSED -> Set.of(OPEN, IN_PROGRESS).contains(next);
        };
    }
}
