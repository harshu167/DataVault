package com.example.datavault.organization;

import com.example.datavault.audit.AuditService;
import com.example.datavault.common.ApiResponse;
import com.example.datavault.common.BadRequestException;
import com.example.datavault.common.ResourceNotFoundException;
import com.example.datavault.document.Document;
import com.example.datavault.document.DocumentRepository;
import com.example.datavault.document.DocumentStorageService;
import com.example.datavault.document.dto.DocumentResponseDTO;
import com.example.datavault.encryption.EncryptionService;
import com.example.datavault.sharing.AccessPermission;
import com.example.datavault.sharing.AccessPermissionService;
import com.example.datavault.user.dto.UserResponseDTO;
import com.example.datavault.user.entity.User;
import com.example.datavault.user.repository.UserRepository;
import com.example.datavault.user.service.UserService;
import com.example.datavault.vault.VaultRecord;
import com.example.datavault.vault.VaultRecordRepository;
import com.example.datavault.vault.dto.VaultRecordResponse;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/organizations")
public class OrganizationController {

    private final AccessPermissionService accessPermissionService;
    private final VaultRecordRepository vaultRecordRepository;
    private final DocumentRepository documentRepository;
    private final DocumentStorageService documentStorageService;
    private final EncryptionService encryptionService;
    private final UserService userService;
    private final UserRepository userRepository;
    private final AuditService auditService;

    public OrganizationController(
            AccessPermissionService accessPermissionService,
            VaultRecordRepository vaultRecordRepository,
            DocumentRepository documentRepository,
            DocumentStorageService documentStorageService,
            EncryptionService encryptionService,
            UserService userService,
            UserRepository userRepository,
            AuditService auditService) {
        this.accessPermissionService = accessPermissionService;
        this.vaultRecordRepository = vaultRecordRepository;
        this.documentRepository = documentRepository;
        this.documentStorageService = documentStorageService;
        this.encryptionService = encryptionService;
        this.userService = userService;
        this.userRepository = userRepository;
        this.auditService = auditService;
    }

    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserResponseDTO>>> getTargetUsers() {
        List<UserResponseDTO> users = userService.listUsersForSharing();
        return ResponseEntity.ok(ApiResponse.ok("Users eligible for data requests", users));
    }

    @GetMapping("/authorized-data/{permissionId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAuthorizedData(
            Authentication authentication,
            @PathVariable Long permissionId) {
        
        AccessPermission permission = accessPermissionService.validateAndGetAuthorizedPermission(authentication.getName(), permissionId);

        String approvedCategories = permission.getApprovedCategories();
        List<String> categories = Arrays.stream(approvedCategories.split(","))
                .map(String::trim)
                .map(String::toUpperCase)
                .collect(Collectors.toList());

        Long ownerId = permission.getOwner().getId();

        // Retrieve authorized vault records
        List<VaultRecord> rawVaultRecords;
        if (categories.contains("ALL")) {
            rawVaultRecords = vaultRecordRepository.findByOwnerId(ownerId);
        } else {
            rawVaultRecords = vaultRecordRepository.findByOwnerIdAndDataCategoryIn(ownerId, categories);
        }

        List<VaultRecordResponse> decryptedRecords = rawVaultRecords.stream().map(record -> {
            String decryptedValue = encryptionService.decrypt(record.getEncryptedData(), record.getEncryptionIv());
            return new VaultRecordResponse(
                    record.getId(),
                    record.getOwner().getId(),
                    record.getOwner().getFullName(),
                    record.getOwner().getEmail(),
                    record.getTitle(),
                    record.getDataCategory(),
                    decryptedValue,
                    record.getDescription(),
                    record.getCreatedAt(),
                    record.getUpdatedAt()
            );
        }).collect(Collectors.toList());

        // Retrieve authorized documents metadata
        List<Document> rawDocs;
        if (categories.contains("ALL")) {
            rawDocs = documentRepository.findByOwnerId(ownerId);
        } else {
            rawDocs = documentRepository.findByOwnerIdAndDataCategoryIn(ownerId, categories);
        }

        List<DocumentResponseDTO> authorizedDocs = rawDocs.stream()
                .map(DocumentResponseDTO::new)
                .collect(Collectors.toList());

        auditService.log(authentication.getName(), "ORGANIZATION", permission.getOwner().getEmail(),
                "ORG_DATA_ACCESS_SUCCESS", "DATA_ACCESS", permissionId.toString(),
                permission.getPurpose(), "SUCCESS",
                "Accessed " + decryptedRecords.size() + " vault records and " + authorizedDocs.size() + " documents");

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("permissionId", permission.getId());
        result.put("purpose", permission.getPurpose());
        result.put("expiresAt", permission.getExpiresAt());
        result.put("ownerName", permission.getOwner().getFullName());
        result.put("ownerEmail", permission.getOwner().getEmail());
        result.put("vaultRecords", decryptedRecords);
        result.put("documents", authorizedDocs);

        return ResponseEntity.ok(ApiResponse.ok("Authorized data retrieved", result));
    }

    @GetMapping("/authorized-documents/{permissionId}/{documentId}/download")
    public ResponseEntity<Resource> downloadAuthorizedDocument(
            Authentication authentication,
            @PathVariable Long permissionId,
            @PathVariable Long documentId) {

        AccessPermission permission = accessPermissionService.validateAndGetAuthorizedPermission(authentication.getName(), permissionId);

        Document doc = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found with id: " + documentId));

        if (!doc.getOwner().getId().equals(permission.getOwner().getId())) {
            auditService.log(authentication.getName(), "ORGANIZATION", permission.getOwner().getEmail(),
                    "ORG_DOCUMENT_DOWNLOAD", "DOCUMENT", documentId.toString(),
                    permission.getPurpose(), "DENIED",
                    "Document does not belong to authorized owner");
            throw new AccessDeniedException("Document does not belong to authorized owner");
        }

        String approvedCategories = permission.getApprovedCategories();
        List<String> categories = Arrays.stream(approvedCategories.split(","))
                .map(String::trim)
                .map(String::toUpperCase)
                .collect(Collectors.toList());

        if (!categories.contains("ALL") && !categories.contains(doc.getDataCategory().toUpperCase())) {
            auditService.log(authentication.getName(), "ORGANIZATION", permission.getOwner().getEmail(),
                    "ORG_DOCUMENT_DOWNLOAD", "DOCUMENT", documentId.toString(),
                    permission.getPurpose(), "DENIED",
                    "Document category " + doc.getDataCategory() + " is outside authorized categories: " + approvedCategories);
            throw new AccessDeniedException("This document is outside the authorized categories for this permission");
        }

        Resource resource = documentStorageService.loadAsResource(doc.getStorageFileName());

        auditService.log(authentication.getName(), "ORGANIZATION", permission.getOwner().getEmail(),
                "ORG_DOCUMENT_DOWNLOAD", "DOCUMENT", documentId.toString(),
                permission.getPurpose(), "SUCCESS",
                "Downloaded authorized document: " + doc.getTitle());

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(doc.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + doc.getOriginalFileName() + "\"")
                .body(resource);
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponseDTO>> getOrgProfile(Authentication authentication) {
        User user = userService.getByEmail(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok("Organization profile retrieved", new UserResponseDTO(user)));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponseDTO>> updateOrgProfile(
            Authentication authentication,
            @RequestBody Map<String, String> body) {
        User user = userService.getByEmail(authentication.getName());
        if (body.containsKey("organizationName")) {
            user.setOrganizationName(body.get("organizationName"));
        }
        if (body.containsKey("fullName")) {
            user.setFullName(body.get("fullName"));
        }
        User updated = userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.ok("Organization profile updated", new UserResponseDTO(updated)));
    }
}
