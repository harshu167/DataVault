package com.example.datavault.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;

    public JwtService(
            @Value("${datavault.jwt.secret:DataVaultSecretKeyForJWTAuthentication2026SecureProductionGrade256BitKey!}") String secretString,
            @Value("${datavault.jwt.expiration-ms:86400000}") long expirationMs) {
        
        if (secretString == null || secretString.trim().isEmpty()) {
            throw new IllegalStateException("JWT secret must not be empty");
        }

        try {
            // Ensure minimum 256 bits (32 bytes) for HMAC-SHA256
            byte[] secretBytes = secretString.getBytes(StandardCharsets.UTF_8);
            if (secretBytes.length < 32) {
                MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
                secretBytes = sha256.digest(secretBytes);
            }
            this.key = Keys.hmacShaKeyFor(secretBytes);
            this.expirationMs = expirationMs;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to initialize JWT key", e);
        }
    }

    public String generateToken(String email) {
        return generateToken(email, "USER", null);
    }

    public String generateToken(String email, String role, Long userId) {
        Map<String, Object> claims = new HashMap<>();
        if (role != null) {
            claims.put("role", role);
        }
        if (userId != null) {
            claims.put("userId", userId);
        }

        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .claims(claims)
                .subject(email)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(key)
                .compact();
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String extractEmail(String token) {
        return extractAllClaims(token).getSubject();
    }

    public String extractRole(String token) {
        Claims claims = extractAllClaims(token);
        return claims.get("role", String.class);
    }

    public Date extractExpiration(String token) {
        return extractAllClaims(token).getExpiration();
    }

    public boolean isTokenExpired(String token) {
        try {
            return extractExpiration(token).before(new Date());
        } catch (Exception e) {
            return true;
        }
    }

    public boolean validateToken(String token, String email) {
        try {
            final String extractedEmail = extractEmail(token);
            return (extractedEmail.equalsIgnoreCase(email) && !isTokenExpired(token));
        } catch (Exception e) {
            return false;
        }
    }
}