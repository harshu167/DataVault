package com.example.datavault.user.controller;

import com.example.datavault.common.ApiResponse;
import com.example.datavault.common.BadRequestException;
import com.example.datavault.user.dto.RegisterRequest;
import com.example.datavault.user.dto.UserResponseDTO;
import com.example.datavault.user.entity.User;
import com.example.datavault.user.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(
            @RequestBody(required = false) RegisterRequest bodyRequest,
            @RequestParam(required = false) String fullName,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String password,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String organizationName) {

        String finalFullName = bodyRequest != null && bodyRequest.getFullName() != null ? bodyRequest.getFullName() : fullName;
        String finalEmail = bodyRequest != null && bodyRequest.getEmail() != null ? bodyRequest.getEmail() : email;
        String finalPassword = bodyRequest != null && bodyRequest.getPassword() != null ? bodyRequest.getPassword() : password;
        String finalRole = bodyRequest != null && bodyRequest.getRole() != null ? bodyRequest.getRole() : role;
        String finalOrgName = bodyRequest != null && bodyRequest.getOrganizationName() != null ? bodyRequest.getOrganizationName() : organizationName;

        if (finalFullName == null || finalEmail == null || finalPassword == null) {
            throw new BadRequestException("Full name, email, and password are required");
        }

        User user = userService.registerUser(finalFullName, finalEmail, finalPassword, finalRole, finalOrgName);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("id", user.getId());
        response.put("fullName", user.getFullName());
        response.put("email", user.getEmail());
        response.put("role", user.getRole());
        response.put("accountStatus", user.getAccountStatus());
        response.put("organizationName", user.getOrganizationName());
        response.put("emergencyLockActive", user.isEmergencyLockActive());
        response.put("createdAt", user.getCreatedAt());
        response.put("message", "User registered successfully");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserResponseDTO>> getProfile(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }
        User user = userService.getByEmail(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok("Profile retrieved successfully", new UserResponseDTO(user)));
    }

    @GetMapping("/sharing-targets")
    public ResponseEntity<ApiResponse<List<UserResponseDTO>>> getSharingTargets() {
        List<UserResponseDTO> targets = userService.listUsersForSharing();
        return ResponseEntity.ok(ApiResponse.ok("Available data owners retrieved", targets));
    }
}