package com.example.datavault.sharing;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AccessRequestRepository extends JpaRepository<AccessRequest, Long> {

    List<AccessRequest> findByOwnerEmailOrderByCreatedAtDesc(String ownerEmail);

    List<AccessRequest> findByRequesterEmailOrderByCreatedAtDesc(String requesterEmail);

    long countByOwnerEmailAndStatus(String ownerEmail, String status);

    long countByRequesterEmailAndStatus(String requesterEmail, String status);
}
