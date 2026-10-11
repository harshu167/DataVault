package com.example.datavault.document.dto;

import com.example.datavault.document.Document;
import java.time.LocalDateTime;

public class DocumentResponseDTO {

    private Long id;
    private Long ownerId;
    private String ownerName;
    private String ownerEmail;
    private String title;
    private String dataCategory;
    private String originalFileName;
    private String contentType;
    private Long fileSize;
    private LocalDateTime createdAt;

    public DocumentResponseDTO() {
    }

    public DocumentResponseDTO(Document doc) {
        if (doc != null) {
            this.id = doc.getId();
            this.ownerId = doc.getOwner().getId();
            this.ownerName = doc.getOwner().getFullName();
            this.ownerEmail = doc.getOwner().getEmail();
            this.title = doc.getTitle();
            this.dataCategory = doc.getDataCategory();
            this.originalFileName = doc.getOriginalFileName();
            this.contentType = doc.getContentType();
            this.fileSize = doc.getFileSize();
            this.createdAt = doc.getCreatedAt();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getOriginalFileName() {
        return originalFileName;
    }

    public void setOriginalFileName(String originalFileName) {
        this.originalFileName = originalFileName;
    }

    public String getContentType() {
        return contentType;
    }

    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
