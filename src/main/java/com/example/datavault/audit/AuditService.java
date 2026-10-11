package com.example.datavault.audit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(String actorEmail, String actorRole, String ownerEmail, String action,
                    String resourceType, String resourceId, String purpose, String outcome, String details) {
        try {
            AuditLog entry = new AuditLog(
                    actorEmail != null ? actorEmail : "anonymous",
                    actorRole != null ? actorRole : "ANONYMOUS",
                    ownerEmail,
                    action,
                    resourceType,
                    resourceId,
                    purpose,
                    outcome,
                    details
            );
            auditLogRepository.save(entry);
        } catch (Exception e) {
            log.error("Failed to record audit log for action: {}", action, e);
        }
    }
}
