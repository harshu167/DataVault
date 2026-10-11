package com.example.datavault.privacy;

import com.example.datavault.common.ApiResponse;
import com.example.datavault.user.entity.User;
import com.example.datavault.user.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/privacy-lock")
public class PrivacyLockController {

    private final UserService userService;

    public PrivacyLockController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStatus(Authentication authentication) {
        User user = userService.getByEmail(authentication.getName());
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("emergencyLockActive", user.isEmergencyLockActive());
        data.put("userEmail", user.getEmail());
        data.put("message", user.isEmergencyLockActive()
                ? "Emergency Privacy Lock is currently ACTIVE. All organization sharing is suspended."
                : "Emergency Privacy Lock is INACTIVE. Normal sharing permissions apply.");

        return ResponseEntity.ok(ApiResponse.ok("Privacy lock status retrieved", data));
    }

    @PostMapping("/toggle")
    public ResponseEntity<ApiResponse<Map<String, Object>>> toggleLock(
            Authentication authentication,
            @RequestBody(required = false) Map<String, Boolean> body) {
        User user = userService.getByEmail(authentication.getName());
        boolean targetStatus;
        if (body != null && body.containsKey("enabled")) {
            targetStatus = body.get("enabled");
        } else {
            targetStatus = !user.isEmergencyLockActive();
        }

        boolean updated = userService.setEmergencyLock(authentication.getName(), targetStatus);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("emergencyLockActive", updated);
        data.put("message", updated
                ? "Emergency Privacy Lock ACTIVATED. All external organization sharing is immediately blocked."
                : "Emergency Privacy Lock DEACTIVATED. Standard sharing permissions restored.");

        return ResponseEntity.ok(ApiResponse.ok("Privacy lock status updated", data));
    }
}
