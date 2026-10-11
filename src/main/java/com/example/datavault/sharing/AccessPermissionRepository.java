package com.example.datavault.sharing;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AccessPermissionRepository extends JpaRepository<AccessPermission, Long> {

    List<AccessPermission> findByOwnerEmailOrderByCreatedAtDesc(String ownerEmail);

    List<AccessPermission> findByRequesterEmailOrderByCreatedAtDesc(String requesterEmail);

    Optional<AccessPermission> findByIdAndOwnerEmail(Long id, String ownerEmail);

    Optional<AccessPermission> findByIdAndRequesterEmail(Long id, String requesterEmail);

    long countByOwnerEmailAndStatus(String ownerEmail, String status);

    long countByRequesterEmailAndStatus(String requesterEmail, String status);
}
