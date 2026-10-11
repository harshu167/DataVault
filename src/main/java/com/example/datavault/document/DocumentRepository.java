package com.example.datavault.document;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findByOwnerEmailOrderByCreatedAtDesc(String email);

    Optional<Document> findByIdAndOwnerEmail(Long id, String email);

    List<Document> findByOwnerId(Long ownerId);

    List<Document> findByOwnerIdAndDataCategoryIn(Long ownerId, List<String> categories);

    long countByOwnerEmail(String email);
}
