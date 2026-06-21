package com.edu.chatbot.document.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DocumentDetailResponse {
    private Long id;
    private String title;
    private String fileType;
    private Long fileSize;
    private String status;
    private Long subjectId;
    private String uploadedBy;
    private String createdAt;
    private String updatedAt;
}
