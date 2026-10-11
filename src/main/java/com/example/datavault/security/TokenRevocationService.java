package com.example.datavault.security;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class TokenRevocationService {

    private final RevokedTokenRepository revokedTokenRepository;

    public TokenRevocationService(RevokedTokenRepository revokedTokenRepository) {
        this.revokedTokenRepository = revokedTokenRepository;
    }

    public void revokeToken(String token, String userEmail, LocalDateTime expiresAt) {
        if (token == null || token.trim().isEmpty()) {
            return;
        }
        if (!revokedTokenRepository.existsByToken(token)) {
            RevokedToken revoked = new RevokedToken(token, userEmail, expiresAt);
            revokedTokenRepository.save(revoked);
        }
    }

    public boolean isRevoked(String token) {
        if (token == null || token.trim().isEmpty()) {
            return true;
        }
        return revokedTokenRepository.existsByToken(token);
    }
}
