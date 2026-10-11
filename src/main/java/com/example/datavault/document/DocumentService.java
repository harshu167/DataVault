package com.example.datavault.document;

import com.example.datavault.audit.AuditService;
import com.example.datavault.common.BadRequestException;
import com.example.datavault.common.ResourceNotFoundException;
import com.example.datavault.document.dto.DocumentResponseDTO;
import com.example.datavault.user.entity.User;
import com.example.datavault.user.service.UserService;
import org.springframework.core.io.Resource;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final DocumentStorageService documentStorageService;
    private final UserService userService;
    private final AuditService auditService;

    public DocumentService(
            DocumentRepository documentRepository,
            DocumentStorageService documentStorageService,
            UserService userService,
            AuditService auditService) {
        this.documentRepository = documentRepository;
        this.documentStorageService = documentStorageService;
        this.userService = userService;
        this.auditService = auditService;
    }

    @Transactional
    public DocumentResponseDTO uploadDocument(String userEmail, MultipartFile file, String title, String dataCategory) {
        if (title == null || title.trim().isEmpty()) {
            throw new BadRequestException("Document title is required");
        }
        if (dataCategory == null || dataCategory.trim().isEmpty()) {
            throw new BadRequestException("Data category is required");
        }

        User owner = userService.getByEmail(userEmail);
        DocumentStorageService.StoredFileInfo stored = documentStorageService.storeFile(file);

        Document doc = new Document();
        doc.setOwner(owner);
        doc.setTitle(title.trim());
        doc.setDataCategory(dataCategory.trim().toUpperCase());
        doc.setOriginalFileName(stored.getOriginalFileName());
        doc.setStorageFileName(stored.getStorageFileName());
        doc.setContentType(stored.getContentType());
        doc.setFileSize(stored.getFileSize());
        doc.setFilePath(stored.getAbsolutePath());

        Document saved = documentRepository.save(doc);

        auditService.log(userEmail, owner.getRole(), userEmail, "DOCUMENT_UPLOAD", "DOCUMENT",
                saved.getId().toString(), "Document Storage", "SUCCESS",
                "Uploaded document: " + saved.getTitle() + " (" + saved.getOriginalFileName() + ")");

        return new DocumentResponseDTO(saved);
    }

    public List<DocumentResponseDTO> getUserDocuments(String userEmail) {
        User owner = userService.getByEmail(userEmail);
        return documentRepository.findByOwnerEmailOrderByCreatedAtDesc(userEmail).stream()
                .map(DocumentResponseDTO::new)
                .collect(Collectors.toList());
    }

    public DocumentResponseDTO getDocumentMetadata(String userEmail, Long id) {
        User user = userService.getByEmail(userEmail);
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + id));

        if (!doc.getOwner().getId().equals(user.getId())) {
            auditService.log(userEmail, user.getRole(), doc.getOwner().getEmail(), "DOCUMENT_VIEW", "DOCUMENT",
                    id.toString(), "Document Inspection", "DENIED",
                    "Unauthorized attempt to view metadata of document id: " + id);
            throw new AccessDeniedException("You are not authorized to view this document");
        }

        auditService.log(userEmail, user.getRole(), userEmail, "DOCUMENT_VIEW", "DOCUMENT",
                id.toString(), "Document Inspection", "SUCCESS",
                "Viewed metadata for document: " + doc.getTitle());

        return new DocumentResponseDTO(doc);
    }

    public DownloadResult downloadDocument(String userEmail, Long id) {
        User user = userService.getByEmail(userEmail);
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + id));

        if (!doc.getOwner().getId().equals(user.getId())) {
            auditService.log(userEmail, user.getRole(), doc.getOwner().getEmail(), "DOCUMENT_DOWNLOAD", "DOCUMENT",
                    id.toString(), "Document Access", "DENIED",
                    "Unauthorized attempt to download document id: " + id);
            throw new AccessDeniedException("You are not authorized to download this document");
        }

        Resource resource = documentStorageService.loadAsResource(doc.getStorageFileName());

        auditService.log(userEmail, user.getRole(), userEmail, "DOCUMENT_DOWNLOAD", "DOCUMENT",
                id.toString(), "Document Access", "SUCCESS",
                "Downloaded document: " + doc.getTitle());

        return new DownloadResult(resource, doc.getOriginalFileName(), doc.getContentType());
    }

    @Transactional
    public void deleteDocument(String userEmail, Long id) {
        User user = userService.getByEmail(userEmail);
        Document doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + id));

        if (!doc.getOwner().getId().equals(user.getId())) {
            auditService.log(userEmail, user.getRole(), doc.getOwner().getEmail(), "DOCUMENT_DELETE", "DOCUMENT",
                    id.toString(), "Document Deletion", "DENIED",
                    "Unauthorized attempt to delete document id: " + id);
            throw new AccessDeniedException("You are not authorized to delete this document");
        }

        documentStorageService.deleteFile(doc.getStorageFileName());
        documentRepository.delete(doc);

        auditService.log(userEmail, user.getRole(), userEmail, "DOCUMENT_DELETE", "DOCUMENT",
                id.toString(), "Document Deletion", "SUCCESS",
                "Deleted document: " + doc.getTitle());
    }

    public static class DownloadResult {
        private final Resource resource;
        private final String fileName;
        private final String contentType;

        public DownloadResult(Resource resource, String fileName, String contentType) {
            this.resource = resource;
            this.fileName = fileName;
            this.contentType = contentType;
        }

        public Resource getResource() {
            return resource;
        }

        public String getFileName() {
            return fileName;
        }

        public String getContentType() {
            return contentType;
        }
    }
}
