package com.edu.chatbot.document.service.impl;

import com.edu.chatbot.document.entity.Document;
import com.edu.chatbot.document.enums.DocumentStatus;
import com.edu.chatbot.document.enums.FileType;
import com.edu.chatbot.document.repository.DocumentChunkRepository;
import com.edu.chatbot.document.repository.DocumentRepository;
import com.edu.chatbot.document.service.DocumentProcessingPipeline;
import com.edu.chatbot.document.service.DocumentService;
import com.edu.chatbot.document.service.QdrantSyncService;
import com.edu.chatbot.document.service.StorageService;
import com.edu.chatbot.document.utils.HashUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService {

    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final StorageService storageService;
    private final DocumentProcessingPipeline documentProcessingPipeline;
    private final QdrantSyncService qdrantSyncService;

    @Override
    @Transactional
    public Document uploadAndProcess(MultipartFile file, String title, Long subjectId, String uploadedBy)
            throws Exception {
        // Validate
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File must not be empty.");
        }
        if (file.getSize() > 50 * 1024 * 1024) { // 50MB
            throw new IllegalArgumentException("File size exceeds 50MB limit.");
        }

        // Security validation (quét virus, mã độc, sandbox pdf)
        byte[] secureFileBytes = com.edu.chatbot.document.utils.DocumentSecurityValidator
                .processAndSecureDocument(file);

        // Hash file để chặn duplicate
        String fileHash = HashUtils.calculateSha256(secureFileBytes);
        if (documentRepository.existsByFileHash(fileHash)) {
            throw new IllegalArgumentException("This file has already been uploaded (duplicate content).");
        }

        // Lưu file
        String filePath = storageService.store(secureFileBytes, file.getOriginalFilename());

        // Xác định loại file
        FileType fileType = getFileType(file.getOriginalFilename());

        // Tạo Document
        Document document = new Document();
        document.setTitle(title);
        document.setFilePath(filePath);
        document.setFileType(fileType);
        document.setFileSize((long) secureFileBytes.length);
        document.setFileHash(fileHash);
        document.setStatus(DocumentStatus.PROCESSING);
        document.setUploadedBy(uploadedBy);
        document.setSubjectId(subjectId);

        Document savedDoc = documentRepository.save(document);

        // Kích hoạt pipeline bất đồng bộ
        documentProcessingPipeline.processDocument(savedDoc.getId());

        return savedDoc;
    }

    @Override
    @Transactional
    public void reprocessDocument(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Document not found with id=" + id));

        if (document.getStatus() == DocumentStatus.PROCESSING) {
            throw new IllegalStateException("Document is being processed, cannot reprocess.");
        }

        // Dọn dẹp chunks và vector cũ
        qdrantSyncService.deleteByDocumentId(document.getId());
        document.getChunks().clear();
        documentChunkRepository.deleteByDocumentId(document.getId()); // Cần thêm query này

        document.setStatus(DocumentStatus.PROCESSING);
        documentRepository.save(document);

        // Chạy lại
        documentProcessingPipeline.processDocument(document.getId());
    }

    @Override
    @Transactional
    public void deleteDocument(Long id) {
        Document document = documentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Document not found with id=" + id));

        // Xóa từ Qdrant
        qdrantSyncService.deleteByDocumentId(document.getId());

        // Xóa file vật lý
        try {
            storageService.delete(document.getFilePath());
        } catch (Exception e) {
            log.warn("Cannot delete physical file: {}", document.getFilePath());
        }

        // Xóa Database (Chunks sẽ tự bị xóa do CascadeType.ALL)
        documentRepository.delete(document);
    }

    @Override
    @Transactional(readOnly = true)
    public Document getDocument(Long id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Document not found with id=" + id));
    }

    @Override
    @Transactional(readOnly = true)
    public com.edu.chatbot.document.dto.DocumentDetailResponse getDocumentDetail(Long id) {
        Document document = getDocument(id);
        return com.edu.chatbot.document.dto.DocumentDetailResponse.builder()
                .id(document.getId())
                .title(document.getTitle())
                .fileType(document.getFileType().name())
                .fileSize(document.getFileSize())
                .status(document.getStatus().name())
                .subjectId(document.getSubjectId())
                .uploadedBy(document.getUploadedBy())
                .createdAt(document.getCreatedAt() != null ? document.getCreatedAt().toString() : "")
                .updatedAt(document.getUpdatedAt() != null ? document.getUpdatedAt().toString() : "")
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public com.edu.chatbot.common.dto.PageResponse<com.edu.chatbot.document.dto.DocumentDetailResponse> getDocuments(Long subjectId, String status, int page, int size) {
        org.springframework.data.domain.PageRequest pageRequest = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("createdAt").descending());
        
        DocumentStatus documentStatus = null;
        if (status != null && !status.isEmpty()) {
            try {
                documentStatus = DocumentStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid status: " + status);
            }
        }

        org.springframework.data.domain.Page<Document> documentPage = documentRepository.findAllWithFilters(subjectId, documentStatus, pageRequest);
        
        org.springframework.data.domain.Page<com.edu.chatbot.document.dto.DocumentDetailResponse> responsePage = documentPage.map(doc -> com.edu.chatbot.document.dto.DocumentDetailResponse.builder()
                .id(doc.getId())
                .title(doc.getTitle())
                .fileType(doc.getFileType().name())
                .fileSize(doc.getFileSize())
                .status(doc.getStatus().name())
                .subjectId(doc.getSubjectId())
                .uploadedBy(doc.getUploadedBy())
                .createdAt(doc.getCreatedAt() != null ? doc.getCreatedAt().toString() : "")
                .updatedAt(doc.getUpdatedAt() != null ? doc.getUpdatedAt().toString() : "")
                .build());

        return com.edu.chatbot.common.dto.PageResponse.of(responsePage);
    }

    private FileType getFileType(String filename) {
        if (filename != null) {
            if (filename.toLowerCase().endsWith(".pdf"))
                return FileType.PDF;
            if (filename.toLowerCase().endsWith(".txt"))
                return FileType.TXT;
        }
        throw new IllegalArgumentException("Unsupported file format (only PDF, TXT supported).");
    }
}
