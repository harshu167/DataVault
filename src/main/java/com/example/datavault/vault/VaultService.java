package com.example.datavault.vault;

import com.example.datavault.audit.AuditService;
import com.example.datavault.common.BadRequestException;
import com.example.datavault.common.ResourceNotFoundException;
import com.example.datavault.encryption.EncryptionService;
import com.example.datavault.user.entity.User;
import com.example.datavault.user.service.UserService;
import com.example.datavault.vault.dto.VaultRecordRequest;
import com.example.datavault.vault.dto.VaultRecordResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class VaultService {

    private final VaultRecordRepository vaultRecordRepository;
    private final EncryptionService encryptionService;
    private final UserService userService;
    private final AuditService auditService;

    public VaultService(
            VaultRecordRepository vaultRecordRepository,
            EncryptionService encryptionService,
            UserService userService,
            AuditService auditService) {
        this.vaultRecordRepository = vaultRecordRepository;
        this.encryptionService = encryptionService;
        this.userService = userService;
        this.auditService = auditService;
    }

    @Transactional
    public VaultRecordResponse createRecord(String userEmail, VaultRecordRequest request) {
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new BadRequestException("Record title is required");
        }
        if (request.getDataCategory() == null || request.getDataCategory().trim().isEmpty()) {
            throw new BadRequestException("Data category is required");
        }
        if (request.getValue() == null || request.getValue().trim().isEmpty()) {
            throw new BadRequestException("Record value cannot be empty");
        }

        User owner = userService.getByEmail(userEmail);

        // Encrypt sensitive value using AES-GCM
        EncryptionService.EncryptedResult encryptedResult = encryptionService.encrypt(request.getValue());

        VaultRecord record = new VaultRecord();
        record.setOwner(owner);
        record.setTitle(request.getTitle().trim());
        record.setDataCategory(request.getDataCategory().trim().toUpperCase());
        record.setEncryptedData(encryptedResult.getCiphertext());
        record.setEncryptionIv(encryptedResult.getIv());
        record.setDescription(request.getDescription());

        VaultRecord saved = vaultRecordRepository.save(record);

        auditService.log(userEmail, owner.getRole(), userEmail, "VAULT_CREATE", "VAULT_RECORD",
                saved.getId().toString(), "Personal Data Storage", "SUCCESS",
                "Created vault record in category: " + saved.getDataCategory());

        return toResponse(saved, request.getValue());
    }

    public List<VaultRecordResponse> getUserRecords(String userEmail) {
        User owner = userService.getByEmail(userEmail);
        List<VaultRecord> records = vaultRecordRepository.findByOwnerEmailOrderByCreatedAtDesc(userEmail);

        return records.stream().map(record -> {
            String decryptedValue = encryptionService.decrypt(record.getEncryptedData(), record.getEncryptionIv());
            return toResponse(record, decryptedValue);
        }).collect(Collectors.toList());
    }

    public VaultRecordResponse getRecordById(String userEmail, Long id) {
        User user = userService.getByEmail(userEmail);
        VaultRecord record = vaultRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vault record not found with id: " + id));

        // Ownership enforcement
        if (!record.getOwner().getId().equals(user.getId())) {
            auditService.log(userEmail, user.getRole(), record.getOwner().getEmail(), "VAULT_VIEW",
                    "VAULT_RECORD", id.toString(), "Personal Data Access", "DENIED",
                    "Unauthorized attempt to access another user's vault record");
            throw new AccessDeniedException("You are not authorized to view this record");
        }

        String decryptedValue = encryptionService.decrypt(record.getEncryptedData(), record.getEncryptionIv());

        auditService.log(userEmail, user.getRole(), userEmail, "VAULT_VIEW",
                "VAULT_RECORD", id.toString(), "Personal Data Access", "SUCCESS",
                "Viewed vault record: " + record.getTitle());

        return toResponse(record, decryptedValue);
    }

    @Transactional
    public VaultRecordResponse updateRecord(String userEmail, Long id, VaultRecordRequest request) {
        User user = userService.getByEmail(userEmail);
        VaultRecord record = vaultRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vault record not found with id: " + id));

        if (!record.getOwner().getId().equals(user.getId())) {
            auditService.log(userEmail, user.getRole(), record.getOwner().getEmail(), "VAULT_UPDATE",
                    "VAULT_RECORD", id.toString(), "Personal Data Modification", "DENIED",
                    "Unauthorized attempt to update another user's vault record");
            throw new AccessDeniedException("You are not authorized to modify this record");
        }

        if (request.getTitle() != null && !request.getTitle().trim().isEmpty()) {
            record.setTitle(request.getTitle().trim());
        }
        if (request.getDataCategory() != null && !request.getDataCategory().trim().isEmpty()) {
            record.setDataCategory(request.getDataCategory().trim().toUpperCase());
        }
        if (request.getDescription() != null) {
            record.setDescription(request.getDescription());
        }

        String finalPlaintext;
        if (request.getValue() != null && !request.getValue().trim().isEmpty()) {
            EncryptionService.EncryptedResult encryptedResult = encryptionService.encrypt(request.getValue());
            record.setEncryptedData(encryptedResult.getCiphertext());
            record.setEncryptionIv(encryptedResult.getIv());
            finalPlaintext = request.getValue();
        } else {
            finalPlaintext = encryptionService.decrypt(record.getEncryptedData(), record.getEncryptionIv());
        }

        VaultRecord updated = vaultRecordRepository.save(record);

        auditService.log(userEmail, user.getRole(), userEmail, "VAULT_UPDATE",
                "VAULT_RECORD", id.toString(), "Personal Data Modification", "SUCCESS",
                "Updated vault record: " + updated.getTitle());

        return toResponse(updated, finalPlaintext);
    }

    @Transactional
    public void deleteRecord(String userEmail, Long id) {
        User user = userService.getByEmail(userEmail);
        VaultRecord record = vaultRecordRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vault record not found with id: " + id));

        if (!record.getOwner().getId().equals(user.getId())) {
            auditService.log(userEmail, user.getRole(), record.getOwner().getEmail(), "VAULT_DELETE",
                    "VAULT_RECORD", id.toString(), "Personal Data Deletion", "DENIED",
                    "Unauthorized attempt to delete another user's vault record");
            throw new AccessDeniedException("You are not authorized to delete this record");
        }

        vaultRecordRepository.delete(record);

        auditService.log(userEmail, user.getRole(), userEmail, "VAULT_DELETE",
                "VAULT_RECORD", id.toString(), "Personal Data Deletion", "SUCCESS",
                "Deleted vault record: " + record.getTitle());
    }

    public VaultRecordResponse toResponse(VaultRecord record, String decryptedValue) {
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
    }
}
