package com.example.datavault.audit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    @Query("SELECT a FROM AuditLog a WHERE a.ownerEmail = :email OR a.actorEmail = :email ORDER BY a.timestamp DESC")
    List<AuditLog> findByUserEmailOrderByTimestampDesc(@Param("email") String email);

    List<AuditLog> findByActorEmailOrderByTimestampDesc(String actorEmail);

    List<AuditLog> findAllByOrderByTimestampDesc();

    long countByOwnerEmailOrActorEmail(String ownerEmail, String actorEmail);
}
