package com.edu.chatbot.document.service;

import com.edu.chatbot.document.dto.DocumentDetailResponse;
import com.edu.chatbot.document.entity.Document;
import org.springframework.web.multipart.MultipartFile;

public interface DocumentService {
    Document uploadAndProcess(MultipartFile file, String title, Long subjectId, String uploadedBy) throws Exception;

    com.edu.chatbot.common.dto.PageResponse<com.edu.chatbot.document.dto.DocumentDetailResponse> getDocuments(Long subjectId, String status, int page, int size);

    Document getDocument(Long id);

    DocumentDetailResponse getDocumentDetail(Long id);

    void reprocessDocument(Long id);

    void deleteDocument(Long id);
}
