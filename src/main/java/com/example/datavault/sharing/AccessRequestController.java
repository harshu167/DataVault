package com.example.datavault.sharing;

import com.example.datavault.common.ApiResponse;
import com.example.datavault.sharing.dto.AccessPermissionResponseDTO;
import com.example.datavault.sharing.dto.AccessRequestResponseDTO;
import com.example.datavault.sharing.dto.CreateAccessRequestDTO;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/access-requests")
public class AccessRequestController {

    private final AccessRequestService accessRequestService;

    public AccessRequestController(AccessRequestService accessRequestService) {
        this.accessRequestService = accessRequestService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AccessRequestResponseDTO>> createRequest(
            Authentication authentication,
            @Valid @RequestBody CreateAccessRequestDTO dto) {
        AccessRequestResponseDTO response = accessRequestService.createRequest(authentication.getName(), dto);
        return ResponseEntity.ok(ApiResponse.ok("Access request submitted successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AccessRequestResponseDTO>>> listRequests(Authentication authentication) {
        List<AccessRequestResponseDTO> list = accessRequestService.getRequests(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok("Access requests retrieved successfully", list));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<AccessPermissionResponseDTO>> approveRequest(
            Authentication authentication,
            @PathVariable Long id) {
        AccessPermissionResponseDTO response = accessRequestService.approveRequest(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.ok("Access request approved and active permission created", response));
    }

    @PutMapping("/{id}/deny")
    public ResponseEntity<ApiResponse<AccessRequestResponseDTO>> denyRequest(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.get("reason") : null;
        AccessRequestResponseDTO response = accessRequestService.denyRequest(authentication.getName(), id, reason);
        return ResponseEntity.ok(ApiResponse.ok("Access request denied", response));
    }
}
