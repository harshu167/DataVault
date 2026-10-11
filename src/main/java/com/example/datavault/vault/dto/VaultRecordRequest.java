package com.example.datavault.vault.dto;

import jakarta.validation.constraints.NotBlank;

public class VaultRecordRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Data category is required")
    private String dataCategory; // IDENTITY, FINANCIAL, MEDICAL, CONTACT, EMPLOYMENT, OTHER

    @NotBlank(message = "Sensitive data value is required")
    private String value;

    private String description;

    public VaultRecordRequest() {
    }

    public VaultRecordRequest(String title, String dataCategory, String value, String description) {
        this.title = title;
        this.dataCategory = dataCategory;
        this.value = value;
        this.description = description;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDataCategory() {
        return dataCategory;
    }

    public void setDataCategory(String dataCategory) {
        this.dataCategory = dataCategory;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
