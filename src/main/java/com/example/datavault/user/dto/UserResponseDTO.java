package com.example.datavault.user.dto;

import com.example.datavault.user.entity.User;
import java.time.LocalDateTime;

public class UserResponseDTO {

    private Long id;
    private String fullName;
    private String email;
    private String role;
    private String accountStatus;
    private boolean emergencyLockActive;
    private String organizationName;
    private LocalDateTime createdAt;

    public UserResponseDTO() {
    }

    public UserResponseDTO(User user) {
        if (user != null) {
            this.id = user.getId();
            this.fullName = user.getFullName();
            this.email = user.getEmail();
            this.role = user.getRole();
            this.accountStatus = user.getAccountStatus();
            this.emergencyLockActive = user.isEmergencyLockActive();
            this.organizationName = user.getOrganizationName();
            this.createdAt = user.getCreatedAt();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getAccountStatus() {
        return accountStatus;
    }

    public void setAccountStatus(String accountStatus) {
        this.accountStatus = accountStatus;
    }

    public boolean isEmergencyLockActive() {
        return emergencyLockActive;
    }

    public void setEmergencyLockActive(boolean emergencyLockActive) {
        this.emergencyLockActive = emergencyLockActive;
    }

    public String getOrganizationName() {
        return organizationName;
    }

    public void setOrganizationName(String organizationName) {
        this.organizationName = organizationName;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
