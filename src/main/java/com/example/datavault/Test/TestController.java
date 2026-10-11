package com.example.datavault.Test;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

@RestController
public class TestController {

    @GetMapping({"/health", "/api/health"})
    public ResponseEntity<Map<String, Object>> health() {
        return ResponseEntity.ok(Map.of(
            "status", "UP",
            "service", "DataVault Backend",
            "timestamp", Instant.now().toString()
        ));
    }

    @GetMapping("/api/test")
    public String test() {
        return "JWT authentication is working!";
    }
}