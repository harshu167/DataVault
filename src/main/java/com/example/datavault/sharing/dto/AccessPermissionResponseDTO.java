package com.example.datavault.sharing.dto;

import com.example.datavault.sharing.AccessPermission;
import java.time.LocalDateTime;

public class AccessPermissionResponseDTO {

    private Long id;
    private Long requestId;
    private Long requesterId;
    private String requesterName;
    private String requesterEmail;
    private Long ownerId;
    private String ownerName;
    private String ownerEmail;
    private String approvedCategories;
    private String purpose;
    private String status;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
    private LocalDateTime revokedAt;
    private boolean expired;

    public AccessPermissionResponseDTO() {
    }

    public AccessPermissionResponseDTO(AccessPermission perm) {
        if (perm != null) {
            this.id = perm.getId();
            this.requestId = perm.getAccessRequest() != null ? perm.getAccessRequest().getId() : null;
            this.requesterId = perm.getRequester().getId();
            this.requesterName = perm.getRequester().getOrganizationName() != null ? perm.getRequester().getOrganizationName() : perm.getRequester().getFullName();
            this.requesterEmail = perm.getRequester().getEmail();
            this.ownerId = perm.getOwner().getId();
            this.ownerName = perm.getOwner().getFullName();
            this.ownerEmail = perm.getOwner().getEmail();
            this.approvedCategories = perm.getApprovedCategories();
            this.purpose = perm.getPurpose();
            this.status = perm.getStatus();
            this.expiresAt = perm.getExpiresAt();
            this.createdAt = perm.getCreatedAt();
            this.revokedAt = perm.getRevokedAt();
            this.expired = "EXPIRED".equalsIgnoreCase(perm.getStatus()) || (perm.getExpiresAt() != null && perm.getExpiresAt().isBefore(LocalDateTime.now()));
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getRequestId() {
        return requestId;
    }

    public void setRequestId(Long requestId) {
        this.requestId = requestId;
    }

    public Long getRequesterId() {
        return requesterId;
    }

    public void setRequesterId(Long requesterId) {
        this.requesterId = requesterId;
    }

    public String getRequesterName() {
        return requesterName;
    }

    public void setRequesterName(String requesterName) {
        this.requesterName = requesterName;
    }

    public String getRequesterEmail() {
        return requesterEmail;
    }

    public void setRequesterEmail(String requesterEmail) {
        this.requesterEmail = requesterEmail;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }

    public String getOwnerEmail() {
        return ownerEmail;
    }

    public void setOwnerEmail(String ownerEmail) {
        this.ownerEmail = ownerEmail;
    }

    public String getApprovedCategories() {
        return approvedCategories;
    }

    public void setApprovedCategories(String approvedCategories) {
        this.approvedCategories = approvedCategories;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getRevokedAt() {
        return revokedAt;
    }

    public void setRevokedAt(LocalDateTime revokedAt) {
        this.revokedAt = revokedAt;
    }

    public boolean isExpired() {
        return expired;
    }

    public void setExpired(boolean expired) {
        this.expired = expired;
    }
}
