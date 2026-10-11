package com.example.datavault.sharing.dto;

import com.example.datavault.sharing.AccessRequest;
import java.time.LocalDateTime;

public class AccessRequestResponseDTO {

    private Long id;
    private Long requesterId;
    private String requesterName;
    private String requesterEmail;
    private Long ownerId;
    private String ownerName;
    private String ownerEmail;
    private String dataCategories;
    private String purpose;
    private Integer durationHours;
    private String status;
    private String decisionNotes;
    private LocalDateTime createdAt;
    private LocalDateTime decidedAt;

    public AccessRequestResponseDTO() {
    }

    public AccessRequestResponseDTO(AccessRequest req) {
        if (req != null) {
            this.id = req.getId();
            this.requesterId = req.getRequester().getId();
            this.requesterName = req.getRequester().getOrganizationName() != null ? req.getRequester().getOrganizationName() : req.getRequester().getFullName();
            this.requesterEmail = req.getRequester().getEmail();
            this.ownerId = req.getOwner().getId();
            this.ownerName = req.getOwner().getFullName();
            this.ownerEmail = req.getOwner().getEmail();
            this.dataCategories = req.getDataCategories();
            this.purpose = req.getPurpose();
            this.durationHours = req.getDurationHours();
            this.status = req.getStatus();
            this.decisionNotes = req.getDecisionNotes();
            this.createdAt = req.getCreatedAt();
            this.decidedAt = req.getDecidedAt();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getDataCategories() {
        return dataCategories;
    }

    public void setDataCategories(String dataCategories) {
        this.dataCategories = dataCategories;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public Integer getDurationHours() {
        return durationHours;
    }

    public void setDurationHours(Integer durationHours) {
        this.durationHours = durationHours;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDecisionNotes() {
        return decisionNotes;
    }

    public void setDecisionNotes(String decisionNotes) {
        this.decisionNotes = decisionNotes;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getDecidedAt() {
        return decidedAt;
    }

    public void setDecidedAt(LocalDateTime decidedAt) {
        this.decidedAt = decidedAt;
    }
}
