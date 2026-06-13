package com.edu.chatbot.analytics.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AutoEvalRequest {
    
    @NotNull(message = "Cần chỉ định mô hình muốn đánh giá (RAG hoặc FINETUNE)")
    private String approach; 
    
    // Số lượng câu hỏi muốn lấy ngẫu nhiên từ lịch sử để chấm điểm
    private Integer sampleSize = 10; 
}