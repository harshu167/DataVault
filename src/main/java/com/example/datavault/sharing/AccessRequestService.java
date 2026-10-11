package com.example.datavault.sharing;

import com.example.datavault.audit.AuditService;
import com.example.datavault.common.BadRequestException;
import com.example.datavault.common.ResourceNotFoundException;
import com.example.datavault.sharing.dto.AccessPermissionResponseDTO;
import com.example.datavault.sharing.dto.AccessRequestResponseDTO;
import com.example.datavault.sharing.dto.CreateAccessRequestDTO;
import com.example.datavault.user.entity.User;
import com.example.datavault.user.service.UserService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AccessRequestService {

    private final AccessRequestRepository accessRequestRepository;
    private final AccessPermissionRepository accessPermissionRepository;
    private final UserService userService;
    private final AuditService auditService;

    public AccessRequestService(
            AccessRequestRepository accessRequestRepository,
            AccessPermissionRepository accessPermissionRepository,
            UserService userService,
            AuditService auditService) {
        this.accessRequestRepository = accessRequestRepository;
        this.accessPermissionRepository = accessPermissionRepository;
        this.userService = userService;
        this.auditService = auditService;
    }

    @Transactional
    public AccessRequestResponseDTO createRequest(String requesterEmail, CreateAccessRequestDTO dto) {
        User requester = userService.getByEmail(requesterEmail);

        if (!"ORGANIZATION".equalsIgnoreCase(requester.getRole())) {
            throw new AccessDeniedException("Only organizations are permitted to submit data access requests");
        }

        if (dto.getOwnerId() == null) {
            throw new BadRequestException("Data owner ID is required");
        }
        if (dto.getPurpose() == null || dto.getPurpose().trim().isEmpty()) {
            throw new BadRequestException("A clear, valid purpose is required for data access requests");
        }
        if (dto.getDurationHours() == null || dto.getDurationHours() <= 0) {
            throw new BadRequestException("Duration must be at least 1 hour");
        }

        User owner = userService.getById(dto.getOwnerId());
        if (!"USER".equalsIgnoreCase(owner.getRole())) {
            throw new BadRequestException("Data access requests can only be sent to personal data vault owners");
        }

        AccessRequest request = new AccessRequest();
        request.setRequester(requester);
        request.setOwner(owner);
        request.setDataCategories(dto.getDataCategories() != null && !dto.getDataCategories().trim().isEmpty() ? dto.getDataCategories().trim().toUpperCase() : "ALL");
        request.setPurpose(dto.getPurpose().trim());
        request.setDurationHours(dto.getDurationHours());
        request.setStatus("PENDING");

        AccessRequest saved = accessRequestRepository.save(request);

        auditService.log(requesterEmail, requester.getRole(), owner.getEmail(), "ACCESS_REQUEST_CREATED",
                "ACCESS_REQUEST", saved.getId().toString(), saved.getPurpose(), "SUCCESS",
                "Organization requested access to categories: " + saved.getDataCategories() + " for " + saved.getDurationHours() + "h");

        return new AccessRequestResponseDTO(saved);
    }

    public List<AccessRequestResponseDTO> getRequests(String userEmail) {
        User user = userService.getByEmail(userEmail);
        List<AccessRequest> list;

        if ("ORGANIZATION".equalsIgnoreCase(user.getRole())) {
            list = accessRequestRepository.findByRequesterEmailOrderByCreatedAtDesc(userEmail);
        } else {
            list = accessRequestRepository.findByOwnerEmailOrderByCreatedAtDesc(userEmail);
        }

        return list.stream().map(AccessRequestResponseDTO::new).collect(Collectors.toList());
    }

    @Transactional
    public AccessPermissionResponseDTO approveRequest(String userEmail, Long requestId) {
        User owner = userService.getByEmail(userEmail);
        AccessRequest request = accessRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Access request not found with id: " + requestId));

        if (!request.getOwner().getId().equals(owner.getId())) {
            auditService.log(userEmail, owner.getRole(), request.getOwner().getEmail(), "ACCESS_REQUEST_APPROVED",
                    "ACCESS_REQUEST", requestId.toString(), request.getPurpose(), "DENIED",
                    "Unauthorized attempt to approve access request");
            throw new AccessDeniedException("You are not authorized to approve this request");
        }

        if (!"PENDING".equalsIgnoreCase(request.getStatus())) {
            throw new BadRequestException("Request cannot be approved because current status is: " + request.getStatus());
        }

        LocalDateTime now = LocalDateTime.now();
        request.setStatus("APPROVED");
        request.setDecidedAt(now);
        accessRequestRepository.save(request);

        // Create bound access permission with automatic expiry timestamp
        AccessPermission permission = new AccessPermission();
        permission.setAccessRequest(request);
        permission.setRequester(request.getRequester());
        permission.setOwner(owner);
        permission.setApprovedCategories(request.getDataCategories());
        permission.setPurpose(request.getPurpose());
        permission.setStatus("ACTIVE");
        permission.setExpiresAt(now.plusHours(request.getDurationHours()));

        AccessPermission savedPerm = accessPermissionRepository.save(permission);

        auditService.log(userEmail, owner.getRole(), userEmail, "ACCESS_REQUEST_APPROVED",
                "ACCESS_PERMISSION", savedPerm.getId().toString(), request.getPurpose(), "SUCCESS",
                "Approved access request. Permission valid until " + savedPerm.getExpiresAt());

        return new AccessPermissionResponseDTO(savedPerm);
    }

    @Transactional
    public AccessRequestResponseDTO denyRequest(String userEmail, Long requestId, String reason) {
        User owner = userService.getByEmail(userEmail);
        AccessRequest request = accessRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Access request not found with id: " + requestId));

        if (!request.getOwner().getId().equals(owner.getId())) {
            auditService.log(userEmail, owner.getRole(), request.getOwner().getEmail(), "ACCESS_REQUEST_DENIED",
                    "ACCESS_REQUEST", requestId.toString(), request.getPurpose(), "DENIED",
                    "Unauthorized attempt to deny access request");
            throw new AccessDeniedException("You are not authorized to deny this request");
        }

        if (!"PENDING".equalsIgnoreCase(request.getStatus())) {
            throw new BadRequestException("Request cannot be denied because current status is: " + request.getStatus());
        }

        request.setStatus("DENIED");
        request.setDecisionNotes(reason != null && !reason.trim().isEmpty() ? reason.trim() : "Request denied by owner");
        request.setDecidedAt(LocalDateTime.now());
        AccessRequest saved = accessRequestRepository.save(request);

        auditService.log(userEmail, owner.getRole(), userEmail, "ACCESS_REQUEST_DENIED",
                "ACCESS_REQUEST", requestId.toString(), request.getPurpose(), "SUCCESS",
                "Denied access request. Reason: " + saved.getDecisionNotes());

        return new AccessRequestResponseDTO(saved);
    }
}
