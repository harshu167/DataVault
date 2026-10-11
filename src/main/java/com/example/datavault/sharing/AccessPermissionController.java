package com.example.datavault.sharing;

import com.example.datavault.common.ApiResponse;
import com.example.datavault.sharing.dto.AccessPermissionResponseDTO;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/access-permissions")
public class AccessPermissionController {

    private final AccessPermissionService accessPermissionService;

    public AccessPermissionController(AccessPermissionService accessPermissionService) {
        this.accessPermissionService = accessPermissionService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AccessPermissionResponseDTO>>> listPermissions(Authentication authentication) {
        List<AccessPermissionResponseDTO> list = accessPermissionService.getPermissions(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok("Access permissions retrieved successfully", list));
    }

    @PutMapping("/{id}/revoke")
    public ResponseEntity<ApiResponse<AccessPermissionResponseDTO>> revokePermission(
            Authentication authentication,
            @PathVariable Long id) {
        AccessPermissionResponseDTO response = accessPermissionService.revokePermission(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.ok("Permission revoked successfully. Future access is blocked.", response));
    }
}
