package com.example.datavault.sharing;

import com.example.datavault.audit.AuditService;
import com.example.datavault.common.BadRequestException;
import com.example.datavault.common.ResourceNotFoundException;
import com.example.datavault.sharing.dto.AccessPermissionResponseDTO;
import com.example.datavault.user.entity.User;
import com.example.datavault.user.service.UserService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AccessPermissionService {

    private final AccessPermissionRepository accessPermissionRepository;
    private final UserService userService;
    private final AuditService auditService;

    public AccessPermissionService(
            AccessPermissionRepository accessPermissionRepository,
            UserService userService,
            AuditService auditService) {
        this.accessPermissionRepository = accessPermissionRepository;
        this.userService = userService;
        this.auditService = auditService;
    }

    @Transactional
    public List<AccessPermissionResponseDTO> getPermissions(String userEmail) {
        User user = userService.getByEmail(userEmail);
        List<AccessPermission> list;

        if ("ORGANIZATION".equalsIgnoreCase(user.getRole())) {
            list = accessPermissionRepository.findByRequesterEmailOrderByCreatedAtDesc(userEmail);
        } else {
            list = accessPermissionRepository.findByOwnerEmailOrderByCreatedAtDesc(userEmail);
        }

        LocalDateTime now = LocalDateTime.now();
        // Check and transition expired permissions
        for (AccessPermission perm : list) {
            if ("ACTIVE".equalsIgnoreCase(perm.getStatus()) && perm.getExpiresAt().isBefore(now)) {
                perm.setStatus("EXPIRED");
                accessPermissionRepository.save(perm);
                auditService.log("system", "SYSTEM", perm.getOwner().getEmail(), "PERMISSION_EXPIRED",
                        "ACCESS_PERMISSION", perm.getId().toString(), perm.getPurpose(), "SUCCESS",
                        "Permission expired automatically at " + perm.getExpiresAt());
            }
        }

        return list.stream().map(AccessPermissionResponseDTO::new).collect(Collectors.toList());
    }

    @Transactional
    public AccessPermissionResponseDTO revokePermission(String userEmail, Long permissionId) {
        User owner = userService.getByEmail(userEmail);
        AccessPermission permission = accessPermissionRepository.findById(permissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Permission not found with id: " + permissionId));

        if (!permission.getOwner().getId().equals(owner.getId())) {
            auditService.log(userEmail, owner.getRole(), permission.getOwner().getEmail(), "PERMISSION_REVOKED",
                    "ACCESS_PERMISSION", permissionId.toString(), permission.getPurpose(), "DENIED",
                    "Unauthorized attempt to revoke permission");
            throw new AccessDeniedException("You are not authorized to revoke this permission");
        }

        if ("REVOKED".equalsIgnoreCase(permission.getStatus())) {
            throw new BadRequestException("Permission has already been revoked");
        }

        permission.setStatus("REVOKED");
        permission.setRevokedAt(LocalDateTime.now());
        AccessPermission saved = accessPermissionRepository.save(permission);

        auditService.log(userEmail, owner.getRole(), userEmail, "PERMISSION_REVOKED",
                "ACCESS_PERMISSION", saved.getId().toString(), permission.getPurpose(), "SUCCESS",
                "Owner revoked access permission for " + permission.getRequester().getEmail());

        return new AccessPermissionResponseDTO(saved);
    }

    @Transactional
    public AccessPermission validateAndGetAuthorizedPermission(String orgEmail, Long permissionId) {
        User orgUser = userService.getByEmail(orgEmail);
        AccessPermission permission = accessPermissionRepository.findById(permissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Permission not found with id: " + permissionId));

        if (!permission.getRequester().getId().equals(orgUser.getId())) {
            auditService.log(orgEmail, orgUser.getRole(), permission.getOwner().getEmail(), "ORG_DATA_ACCESS_ATTEMPT",
                    "ACCESS_PERMISSION", permissionId.toString(), permission.getPurpose(), "DENIED",
                    "Organization attempted to use permission granted to a different organization");
            throw new AccessDeniedException("You are not the designated recipient organization for this permission");
        }

        // Check if permission was revoked
        if ("REVOKED".equalsIgnoreCase(permission.getStatus())) {
            auditService.log(orgEmail, orgUser.getRole(), permission.getOwner().getEmail(), "ORG_DATA_ACCESS_ATTEMPT",
                    "ACCESS_PERMISSION", permissionId.toString(), permission.getPurpose(), "BLOCKED",
                    "Access blocked: Permission was revoked by the owner on " + permission.getRevokedAt());
            throw new AccessDeniedException("Access denied: Permission has been revoked by the data owner");
        }

        // Check expiry against current time
        LocalDateTime now = LocalDateTime.now();
        if (permission.getExpiresAt().isBefore(now) || "EXPIRED".equalsIgnoreCase(permission.getStatus())) {
            if ("ACTIVE".equalsIgnoreCase(permission.getStatus())) {
                permission.setStatus("EXPIRED");
                accessPermissionRepository.save(permission);
            }
            auditService.log(orgEmail, orgUser.getRole(), permission.getOwner().getEmail(), "ORG_DATA_ACCESS_ATTEMPT",
                    "ACCESS_PERMISSION", permissionId.toString(), permission.getPurpose(), "BLOCKED",
                    "Access blocked: Permission expired at " + permission.getExpiresAt());
            throw new AccessDeniedException("Access denied: Permission has expired on " + permission.getExpiresAt());
        }

        // Check Emergency Privacy Lock on the owner!
        User freshOwner = userService.getById(permission.getOwner().getId());
        if (freshOwner.isEmergencyLockActive()) {
            auditService.log(orgEmail, orgUser.getRole(), freshOwner.getEmail(), "ORG_DATA_ACCESS_ATTEMPT",
                    "ACCESS_PERMISSION", permissionId.toString(), permission.getPurpose(), "BLOCKED",
                    "Access blocked: Data owner has activated Emergency Privacy Lock");
            throw new AccessDeniedException("Access denied: Data owner has activated an Emergency Privacy Lock. All active sharing is suspended.");
        }

        return permission;
    }
}
