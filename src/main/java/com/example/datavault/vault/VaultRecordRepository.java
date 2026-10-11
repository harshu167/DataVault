package com.example.datavault.vault;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface VaultRecordRepository extends JpaRepository<VaultRecord, Long> {

    List<VaultRecord> findByOwnerEmailOrderByCreatedAtDesc(String email);

    Optional<VaultRecord> findByIdAndOwnerEmail(Long id, String email);

    List<VaultRecord> findByOwnerId(Long ownerId);

    List<VaultRecord> findByOwnerIdAndDataCategoryIn(Long ownerId, List<String> categories);

    long countByOwnerEmail(String email);
}
