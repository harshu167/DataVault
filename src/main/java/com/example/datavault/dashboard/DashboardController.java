package com.example.datavault.dashboard;

import com.example.datavault.audit.AuditLog;
import com.example.datavault.audit.AuditLogRepository;
import com.example.datavault.common.ApiResponse;
import com.example.datavault.document.DocumentRepository;
import com.example.datavault.sharing.AccessPermissionRepository;
import com.example.datavault.sharing.AccessRequestRepository;
import com.example.datavault.user.entity.User;
import com.example.datavault.user.repository.UserRepository;
import com.example.datavault.user.service.UserService;
import com.example.datavault.vault.VaultRecordRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final VaultRecordRepository vaultRecordRepository;
    private final DocumentRepository documentRepository;
    private final AccessRequestRepository accessRequestRepository;
    private final AccessPermissionRepository accessPermissionRepository;
    private final AuditLogRepository auditLogRepository;

    public DashboardController(
            UserService userService,
            UserRepository userRepository,
            VaultRecordRepository vaultRecordRepository,
            DocumentRepository documentRepository,
            AccessRequestRepository accessRequestRepository,
            AccessPermissionRepository accessPermissionRepository,
            AuditLogRepository auditLogRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.vaultRecordRepository = vaultRecordRepository;
        this.documentRepository = documentRepository;
        this.accessRequestRepository = accessRequestRepository;
        this.accessPermissionRepository = accessPermissionRepository;
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats(Authentication authentication) {
        String email = authentication.getName();
        User user = userService.getByEmail(email);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("role", user.getRole());
        stats.put("email", user.getEmail());
        stats.put("fullName", user.getFullName());
        stats.put("accountStatus", user.getAccountStatus());
        stats.put("emergencyLockActive", user.isEmergencyLockActive());

        if ("USER".equalsIgnoreCase(user.getRole())) {
            long vaultCount = vaultRecordRepository.countByOwnerEmail(email);
            long docCount = documentRepository.countByOwnerEmail(email);
            long pendingRequests = accessRequestRepository.countByOwnerEmailAndStatus(email, "PENDING");
            long activePermissions = accessPermissionRepository.countByOwnerEmailAndStatus(email, "ACTIVE");
            long revokedPermissions = accessPermissionRepository.countByOwnerEmailAndStatus(email, "REVOKED");
            long expiredPermissions = accessPermissionRepository.countByOwnerEmailAndStatus(email, "EXPIRED");

            List<AuditLog> recentLogs = auditLogRepository.findByUserEmailOrderByTimestampDesc(email);
            if (recentLogs.size() > 5) {
                recentLogs = recentLogs.subList(0, 5);
            }

            stats.put("vaultRecordsCount", vaultCount);
            stats.put("documentsCount", docCount);
            stats.put("pendingRequestsCount", pendingRequests);
            stats.put("activePermissionsCount", activePermissions);
            stats.put("revokedPermissionsCount", revokedPermissions);
            stats.put("expiredPermissionsCount", expiredPermissions);
            stats.put("recentAuditLogs", recentLogs);

        } else if ("ORGANIZATION".equalsIgnoreCase(user.getRole())) {
            stats.put("organizationName", user.getOrganizationName());
            long pendingRequests = accessRequestRepository.countByRequesterEmailAndStatus(email, "PENDING");
            long approvedRequests = accessRequestRepository.countByRequesterEmailAndStatus(email, "APPROVED");
            long activePermissions = accessPermissionRepository.countByRequesterEmailAndStatus(email, "ACTIVE");
            long expiredPermissions = accessPermissionRepository.countByRequesterEmailAndStatus(email, "EXPIRED");
            long revokedPermissions = accessPermissionRepository.countByRequesterEmailAndStatus(email, "REVOKED");

            List<AuditLog> recentLogs = auditLogRepository.findByActorEmailOrderByTimestampDesc(email);
            if (recentLogs.size() > 5) {
                recentLogs = recentLogs.subList(0, 5);
            }

            stats.put("pendingRequestsCount", pendingRequests);
            stats.put("approvedRequestsCount", approvedRequests);
            stats.put("activePermissionsCount", activePermissions);
            stats.put("expiredPermissionsCount", expiredPermissions);
            stats.put("revokedPermissionsCount", revokedPermissions);
            stats.put("recentAuditLogs", recentLogs);

        } else if ("ADMIN".equalsIgnoreCase(user.getRole())) {
            stats.put("totalUsers", userRepository.countByRole("USER"));
            stats.put("totalOrganizations", userRepository.countByRole("ORGANIZATION"));
            stats.put("totalVaultRecords", vaultRecordRepository.count());
            stats.put("totalDocuments", documentRepository.count());
            stats.put("totalRequests", accessRequestRepository.count());
            stats.put("totalPermissions", accessPermissionRepository.count());
            stats.put("totalAuditLogs", auditLogRepository.count());

            List<AuditLog> recentLogs = auditLogRepository.findAllByOrderByTimestampDesc();
            if (recentLogs.size() > 5) {
                recentLogs = recentLogs.subList(0, 5);
            }
            stats.put("recentAuditLogs", recentLogs);
        }

        return ResponseEntity.ok(ApiResponse.ok("Dashboard statistics retrieved", stats));
    }
}
