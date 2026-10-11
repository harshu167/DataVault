package com.example.datavault.auth;

import com.example.datavault.audit.AuditService;
import com.example.datavault.common.ApiResponse;
import com.example.datavault.common.BadRequestException;
import com.example.datavault.security.JwtService;
import com.example.datavault.security.TokenRevocationService;
import com.example.datavault.user.dto.RegisterRequest;
import com.example.datavault.user.dto.UserResponseDTO;
import com.example.datavault.user.entity.User;
import com.example.datavault.user.repository.UserRepository;
import com.example.datavault.user.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final TokenRevocationService tokenRevocationService;
    private final AuditService auditService;

    public AuthController(
            UserRepository userRepository,
            UserService userService,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            TokenRevocationService tokenRevocationService,
            AuditService auditService) {
        this.userRepository = userRepository;
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.tokenRevocationService = tokenRevocationService;
        this.auditService = auditService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request == null || request.getEmail() == null || request.getPassword() == null) {
            throw new BadRequestException("Email and password are required");
        }

        String email = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null || !passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            auditService.log(email, "ANONYMOUS", email, "LOGIN_FAILED", "AUTH", null, "Login", "FAILURE", "Invalid email or password");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid email or password", "error", "Unauthorized"));
        }

        if (!"ACTIVE".equalsIgnoreCase(user.getAccountStatus())) {
            auditService.log(email, user.getRole(), email, "LOGIN_FAILED", "AUTH", user.getId().toString(), "Login", "DENIED", "Account is " + user.getAccountStatus());
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("message", "Account is not active", "error", "Forbidden"));
        }

        String token = jwtService.generateToken(user.getEmail(), user.getRole(), user.getId());

        auditService.log(user.getEmail(), user.getRole(), user.getEmail(), "LOGIN_SUCCESS", "AUTH", user.getId().toString(), "Login", "SUCCESS", "User logged in successfully");

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", "Login successful");
        response.put("token", token);
        response.put("id", user.getId());
        response.put("fullName", user.getFullName());
        response.put("email", user.getEmail());
        response.put("role", user.getRole());
        response.put("accountStatus", user.getAccountStatus());
        response.put("emergencyLockActive", user.isEmergencyLockActive());
        response.put("organizationName", user.getOrganizationName());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponseDTO>> getCurrentUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Unauthorized: No active session"));
        }

        User user = userService.getByEmail(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok("Profile retrieved", new UserResponseDTO(user)));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<String>> logout(HttpServletRequest request, Authentication authentication) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            String email = authentication != null ? authentication.getName() : "anonymous";
            String role = authentication != null && !authentication.getAuthorities().isEmpty()
                    ? authentication.getAuthorities().iterator().next().getAuthority()
                    : "USER";

            LocalDateTime expiresAt = null;
            try {
                Date exp = jwtService.extractExpiration(token);
                expiresAt = exp.toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime();
            } catch (Exception ignored) {
            }

            tokenRevocationService.revokeToken(token, email, expiresAt);
            auditService.log(email, role, email, "LOGOUT", "AUTH", null, "Logout", "SUCCESS", "Token invalidated");
        }

        return ResponseEntity.ok(ApiResponse.ok("Logout successful", "Token invalidated"));
    }

    @PostMapping("/register-organization")
    public ResponseEntity<ApiResponse<UserResponseDTO>> registerOrganization(@RequestBody RegisterRequest request) {
        if (request == null) {
            throw new BadRequestException("Request body cannot be null");
        }
        User user = userService.registerUser(
                request.getFullName(),
                request.getEmail(),
                request.getPassword(),
                "ORGANIZATION",
                request.getOrganizationName()
        );
        return ResponseEntity.ok(ApiResponse.ok("Organization registered successfully", new UserResponseDTO(user)));
    }
}