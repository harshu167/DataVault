package com.example.datavault.document;

import com.example.datavault.common.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class DocumentStorageService {

    private final Path rootLocation;
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList("pdf", "png", "jpg", "jpeg", "txt", "docx", "csv");
    private static final long MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

    public DocumentStorageService(@Value("${datavault.upload.dir:./uploads/documents}") String uploadDir) {
        this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize document storage folder at: " + rootLocation, e);
        }
    }

    public static class StoredFileInfo {
        private final String storageFileName;
        private final String originalFileName;
        private final String contentType;
        private final long fileSize;
        private final String absolutePath;

        public StoredFileInfo(String storageFileName, String originalFileName, String contentType, long fileSize, String absolutePath) {
            this.storageFileName = storageFileName;
            this.originalFileName = originalFileName;
            this.contentType = contentType;
            this.fileSize = fileSize;
            this.absolutePath = absolutePath;
        }

        public String getStorageFileName() {
            return storageFileName;
        }

        public String getOriginalFileName() {
            return originalFileName;
        }

        public String getContentType() {
            return contentType;
        }

        public long getFileSize() {
            return fileSize;
        }

        public String getAbsolutePath() {
            return absolutePath;
        }
    }

    public StoredFileInfo storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Failed to store empty file");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("File size exceeds maximum allowed limit of 15MB");
        }

        String originalFilename = Paths.get(file.getOriginalFilename() != null ? file.getOriginalFilename() : "document").getFileName().toString();

        // Validate extension to prevent malicious uploads
        String extension = "";
        int lastDotIndex = originalFilename.lastIndexOf('.');
        if (lastDotIndex > 0) {
            extension = originalFilename.substring(lastDotIndex + 1).toLowerCase();
        }

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("File type not allowed. Allowed types: " + String.join(", ", ALLOWED_EXTENSIONS));
        }

        String storageFileName = UUID.randomUUID().toString() + (extension.isEmpty() ? "" : "." + extension);
        Path destinationFile = this.rootLocation.resolve(storageFileName).normalize().toAbsolutePath();

        // Prevent directory traversal
        if (!destinationFile.getParent().equals(this.rootLocation)) {
            throw new BadRequestException("Cannot store file outside current directory");
        }

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, destinationFile, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + originalFilename, e);
        }

        String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";

        return new StoredFileInfo(
                storageFileName,
                originalFilename,
                contentType,
                file.getSize(),
                destinationFile.toString()
        );
    }

    public Resource loadAsResource(String storageFileName) {
        try {
            Path file = rootLocation.resolve(storageFileName).normalize();
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new BadRequestException("Could not read file: " + storageFileName);
            }
        } catch (Exception e) {
            throw new BadRequestException("Could not read file: " + storageFileName);
        }
    }

    public void deleteFile(String storageFileName) {
        try {
            Path file = rootLocation.resolve(storageFileName).normalize();
            Files.deleteIfExists(file);
        } catch (IOException ignored) {
        }
    }
}
