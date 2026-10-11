package com.example.datavault.user.service;

import com.example.datavault.audit.AuditService;
import com.example.datavault.common.BadRequestException;
import com.example.datavault.common.ResourceNotFoundException;
import com.example.datavault.user.dto.UserResponseDTO;
import com.example.datavault.user.entity.User;
import com.example.datavault.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder, AuditService auditService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
    }

    public User registerUser(String fullName, String email, String password) {
        return registerUser(fullName, email, password, "USER", null);
    }

    @Transactional
    public User registerUser(String fullName, String email, String password, String requestedRole, String organizationName) {
        if (email == null || email.trim().isEmpty()) {
            throw new BadRequestException("Email is required");
        }
        if (password == null || password.length() < 6) {
            throw new BadRequestException("Password must be at least 6 characters");
        }
        if (fullName == null || fullName.trim().isEmpty()) {
            throw new BadRequestException("Full name is required");
        }

        String normalizedEmail = email.trim().toLowerCase();
        if (userRepository.existsByEmail(normalizedEmail)) {
            auditService.log(normalizedEmail, "ANONYMOUS", normalizedEmail, "USER_REGISTRATION", "USER", null, "Registration", "FAILURE", "Email already exists");
            throw new BadRequestException("Email already registered: " + normalizedEmail);
        }

        // Prevent unauthorized escalation to ADMIN role through public registration
        String assignedRole = "USER";
        if ("ORGANIZATION".equalsIgnoreCase(requestedRole)) {
            assignedRole = "ORGANIZATION";
        } else if ("ADMIN".equalsIgnoreCase(requestedRole)) {
            // Reject attempts to self-assign ADMIN
            throw new BadRequestException("Self-registration as ADMIN is prohibited");
        }

        User user = new User();
        user.setFullName(fullName.trim());
        user.setEmail(normalizedEmail);
        user.setPassword(passwordEncoder.encode(password));
        user.setRole(assignedRole);
        user.setAccountStatus("ACTIVE");
        user.setEmergencyLockActive(false);

        if ("ORGANIZATION".equals(assignedRole)) {
            user.setOrganizationName(organizationName != null && !organizationName.trim().isEmpty() ? organizationName.trim() : fullName.trim());
        }

        User saved = userRepository.save(user);

        auditService.log(saved.getEmail(), saved.getRole(), saved.getEmail(), "USER_REGISTRATION", "USER", saved.getId().toString(), "Account Creation", "SUCCESS", "Registered as " + assignedRole);
        return saved;
    }

    public User getByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    public List<UserResponseDTO> listUsersForSharing() {
        return userRepository.findByRole("USER").stream()
                .map(UserResponseDTO::new)
                .collect(Collectors.toList());
    }

    @Transactional
    public boolean setEmergencyLock(String email, boolean enabled) {
        User user = getByEmail(email);
        boolean previous = user.isEmergencyLockActive();
        user.setEmergencyLockActive(enabled);
        userRepository.save(user);

        String action = enabled ? "EMERGENCY_LOCK_ACTIVATED" : "EMERGENCY_LOCK_DEACTIVATED";
        String details = enabled ? "Emergency privacy lock activated. All organization sharing blocked." : "Emergency privacy lock deactivated.";
        auditService.log(email, user.getRole(), email, action, "EMERGENCY_LOCK", user.getId().toString(), "Privacy Control", "SUCCESS", details);

        return enabled;
    }
}