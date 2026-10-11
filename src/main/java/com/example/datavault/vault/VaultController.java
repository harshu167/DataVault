package com.example.datavault.vault;

import com.example.datavault.common.ApiResponse;
import com.example.datavault.vault.dto.VaultRecordRequest;
import com.example.datavault.vault.dto.VaultRecordResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vault")
public class VaultController {

    private final VaultService vaultService;

    public VaultController(VaultService vaultService) {
        this.vaultService = vaultService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<VaultRecordResponse>> createRecord(
            Authentication authentication,
            @Valid @RequestBody VaultRecordRequest request) {
        VaultRecordResponse response = vaultService.createRecord(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.ok("Vault record created and encrypted successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<VaultRecordResponse>>> listRecords(Authentication authentication) {
        List<VaultRecordResponse> records = vaultService.getUserRecords(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok("Vault records retrieved successfully", records));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VaultRecordResponse>> getRecord(
            Authentication authentication,
            @PathVariable Long id) {
        VaultRecordResponse response = vaultService.getRecordById(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.ok("Vault record retrieved successfully", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<VaultRecordResponse>> updateRecord(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody VaultRecordRequest request) {
        VaultRecordResponse response = vaultService.updateRecord(authentication.getName(), id, request);
        return ResponseEntity.ok(ApiResponse.ok("Vault record updated successfully", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteRecord(
            Authentication authentication,
            @PathVariable Long id) {
        vaultService.deleteRecord(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.ok("Vault record deleted successfully", "Record " + id + " deleted"));
    }
}
