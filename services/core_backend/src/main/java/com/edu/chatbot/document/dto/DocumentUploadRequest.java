package com.edu.chatbot.document.dto;

import org.springframework.web.multipart.MultipartFile;
import lombok.Data;

@Data
public class DocumentUploadRequest {
    private MultipartFile file;
    private String title;
    private Long subjectId;
    private String uploadedBy;
}
