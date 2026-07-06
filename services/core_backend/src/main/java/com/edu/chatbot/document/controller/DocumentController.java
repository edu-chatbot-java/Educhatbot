package com.edu.chatbot.document.controller;

import com.edu.chatbot.common.dto.ApiResponse;
import com.edu.chatbot.common.dto.PageResponse;
import com.edu.chatbot.document.dto.DocumentDetailResponse;
import com.edu.chatbot.document.entity.Document;
import com.edu.chatbot.document.service.DocumentService;
import lombok.RequiredArgsConstructor;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<?>> uploadDocument(
            @ModelAttribute com.edu.chatbot.document.dto.DocumentUploadRequest request) {
        try {
            Document document = documentService.uploadAndProcess(
                    request.getFile(),
                    request.getTitle(),
                    request.getSubjectId(),
                    request.getUploadedBy());
            return ResponseEntity.ok(ApiResponse.success(
                    Map.of("documentId", document.getId()),
                    "File is being processed in the background."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage(), "BAD_REQUEST"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(ApiResponse.error(e.getMessage(), "INTERNAL_ERROR"));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getDocuments(
            @RequestParam(name = "subjectId", required = false) Long subjectId,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "10") int size) {
        try {
            PageResponse<DocumentDetailResponse> pageResponse = documentService.getDocuments(subjectId, status, page,
                    size);
            return ResponseEntity.ok(ApiResponse.success(pageResponse, "Documents fetched successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage(), "BAD_REQUEST"));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> getDocumentDetail(@PathVariable(name = "id") Long id) {
        try {
            return ResponseEntity.ok(ApiResponse.success(documentService.getDocumentDetail(id)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage(), "BAD_REQUEST"));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> deleteDocument(@PathVariable(name = "id") Long id) {
        try {
            documentService.deleteDocument(id);
            return ResponseEntity.ok(ApiResponse.success(null, "Document deleted successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage(), "BAD_REQUEST"));
        }
    }

    @GetMapping("/{id}/status")
    public ResponseEntity<ApiResponse<?>> getDocumentStatus(@PathVariable(name = "id") Long id) {
        try {
            Document document = documentService.getDocument(id);
            return ResponseEntity.ok(ApiResponse.success(Map.of(
                    "id", document.getId(),
                    "title", document.getTitle(),
                    "status", document.getStatus().name())));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage(), "BAD_REQUEST"));
        }
    }

    @PostMapping("/{id}/reprocess")
    public ResponseEntity<ApiResponse<?>> reprocessDocument(@PathVariable(name = "id") Long id) {
        try {
            documentService.reprocessDocument(id);
            return ResponseEntity.ok(ApiResponse.success(null, "Added to the reprocessing queue."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage(), "BAD_REQUEST"));
        }
    }
}
