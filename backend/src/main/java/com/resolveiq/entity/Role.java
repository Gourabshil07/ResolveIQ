package com.resolveiq.entity;

public enum Role {
    IT_USER,
    SUPPORT_ENGINEER,
    ADMIN,
    EMPLOYEE,
    ENGINEER;

    public String getAuthority() {
        return "ROLE_" + this.name();
    }
}
