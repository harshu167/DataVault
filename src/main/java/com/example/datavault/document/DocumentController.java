package com.example.datavault.document;

import com.example.datavault.common.ApiResponse;
import com.example.datavault.document.dto.DocumentResponseDTO;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DocumentResponseDTO>> uploadDocument(
            Authentication authentication,
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam("dataCategory") String dataCategory) {
        DocumentResponseDTO response = documentService.uploadDocument(authentication.getName(), file, title, dataCategory);
        return ResponseEntity.ok(ApiResponse.ok("Document uploaded securely", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DocumentResponseDTO>>> listDocuments(Authentication authentication) {
        List<DocumentResponseDTO> documents = documentService.getUserDocuments(authentication.getName());
        return ResponseEntity.ok(ApiResponse.ok("Documents retrieved successfully", documents));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DocumentResponseDTO>> getDocumentMetadata(
            Authentication authentication,
            @PathVariable Long id) {
        DocumentResponseDTO response = documentService.getDocumentMetadata(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.ok("Document metadata retrieved", response));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadDocument(
            Authentication authentication,
            @PathVariable Long id) {
        DocumentService.DownloadResult result = documentService.downloadDocument(authentication.getName(), id);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(result.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + result.getFileName() + "\"")
                .body(result.getResource());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteDocument(
            Authentication authentication,
            @PathVariable Long id) {
        documentService.deleteDocument(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.ok("Document deleted successfully", "Document " + id + " deleted"));
    }
}
