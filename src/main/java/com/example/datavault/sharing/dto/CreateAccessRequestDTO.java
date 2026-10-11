package com.example.datavault.sharing.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreateAccessRequestDTO {

    @NotNull(message = "Data owner ID is required")
    private Long ownerId;

    @NotBlank(message = "Data categories are required (e.g., IDENTITY, FINANCIAL or ALL)")
    private String dataCategories;

    @NotBlank(message = "Purpose is mandatory for data access requests")
    private String purpose;

    @NotNull(message = "Duration in hours is required")
    @Min(value = 1, message = "Duration must be at least 1 hour")
    private Integer durationHours;

    public CreateAccessRequestDTO() {
    }

    public CreateAccessRequestDTO(Long ownerId, String dataCategories, String purpose, Integer durationHours) {
        this.ownerId = ownerId;
        this.dataCategories = dataCategories;
        this.purpose = purpose;
        this.durationHours = durationHours;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
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
}
