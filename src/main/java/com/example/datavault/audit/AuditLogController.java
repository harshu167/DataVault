package com.example.datavault.audit;

import com.example.datavault.common.ApiResponse;
import com.example.datavault.user.entity.User;
import com.example.datavault.user.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;
    private final UserService userService;

    public AuditLogController(AuditLogRepository auditLogRepository, UserService userService) {
        this.auditLogRepository = auditLogRepository;
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AuditLog>>> getAuditLogs(Authentication authentication) {
        String email = authentication.getName();
        User user = userService.getByEmail(email);

        List<AuditLog> logs;
        if ("ADMIN".equalsIgnoreCase(user.getRole())) {
            logs = auditLogRepository.findAllByOrderByTimestampDesc();
        } else if ("ORGANIZATION".equalsIgnoreCase(user.getRole())) {
            logs = auditLogRepository.findByActorEmailOrderByTimestampDesc(email);
        } else {
            logs = auditLogRepository.findByUserEmailOrderByTimestampDesc(email);
        }

        return ResponseEntity.ok(ApiResponse.ok("Audit history retrieved", logs));
    }
}
