package com.example.datavault.encryption;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class EncryptionService {

    private static final String ALGORITHM = "AES";
    private static final String CIPHER_TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH_BYTES = 12; // 96 bits recommended for GCM
    private static final int GCM_TAG_LENGTH_BITS = 128; // 128 bits auth tag

    private final SecretKey secretKey;
    private final SecureRandom secureRandom;

    public EncryptionService(@Value("${datavault.encryption.key:DataVaultAES256SecretEncryptionKey2026!SecureKey}") String configuredKey) {
        if (configuredKey == null || configuredKey.trim().isEmpty()) {
            throw new IllegalStateException("Encryption key must be configured and cannot be empty");
        }
        try {
            // Derive consistent 256-bit (32 bytes) AES key using SHA-256
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            byte[] keyBytes = sha256.digest(configuredKey.getBytes(StandardCharsets.UTF_8));
            this.secretKey = new SecretKeySpec(keyBytes, ALGORITHM);
            this.secureRandom = new SecureRandom();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to initialize AES-GCM encryption service", e);
        }
    }

    public static class EncryptedResult {
        private final String ciphertext;
        private final String iv;

        public EncryptedResult(String ciphertext, String iv) {
            this.ciphertext = ciphertext;
            this.iv = iv;
        }

        public String getCiphertext() {
            return ciphertext;
        }

        public String getIv() {
            return iv;
        }
    }

    public EncryptedResult encrypt(String plaintext) {
        if (plaintext == null) {
            return null;
        }
        try {
            byte[] iv = new byte[GCM_IV_LENGTH_BYTES];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(CIPHER_TRANSFORMATION);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, parameterSpec);

            byte[] cipherBytes = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            String ciphertextBase64 = Base64.getEncoder().encodeToString(cipherBytes);
            String ivBase64 = Base64.getEncoder().encodeToString(iv);

            return new EncryptedResult(ciphertextBase64, ivBase64);
        } catch (Exception e) {
            throw new RuntimeException("Encryption operation failed", e);
        }
    }

    public String decrypt(String ciphertextBase64, String ivBase64) {
        if (ciphertextBase64 == null || ivBase64 == null) {
            return null;
        }
        try {
            byte[] cipherBytes = Base64.getDecoder().decode(ciphertextBase64);
            byte[] iv = Base64.getDecoder().decode(ivBase64);

            Cipher cipher = Cipher.getInstance(CIPHER_TRANSFORMATION);
            GCMParameterSpec parameterSpec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, parameterSpec);

            byte[] plainBytes = cipher.doFinal(cipherBytes);
            return new String(plainBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException("Decryption operation failed. Data integrity or authentication tag invalid", e);
        }
    }
}
