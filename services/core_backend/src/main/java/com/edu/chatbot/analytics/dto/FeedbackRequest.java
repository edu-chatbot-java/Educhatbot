package com.edu.chatbot.analytics.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class FeedbackRequest {

    @NotNull(message = "Message ID không được để trống")
    private Long messageId;

    @Min(value = 1, message = "Rating thấp nhất là 1 sao")
    @Max(value = 5, message = "Rating cao nhất là 5 sao")
    private Integer rating; // Có thể null nếu họ chỉ thả thumbs up/down

    private String thumbsAction; // "THUMBS_UP" hoặc "THUMBS_DOWN"

    private String blindTestWinner; // "RAG" hoặc "FINETUNE" (Dành cho tính năng A/B Testing)

    private String comment;
}