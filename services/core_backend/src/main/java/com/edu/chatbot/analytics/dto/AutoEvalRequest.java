package com.edu.chatbot.analytics.dto;

import jakarta.validation.constraints.NotNull;

public class AutoEvalRequest {
    
    @NotNull(message = "Cần chỉ định mô hình muốn đánh giá (RAG hoặc FINETUNE)")
    private String approach; 
    
    private Integer sampleSize = 10; 

    public AutoEvalRequest() {
    }


    public String getApproach() {
        return approach;
    }

    public void setApproach(String approach) {
        this.approach = approach;
    }

    public Integer getSampleSize() {
        return sampleSize;
    }

    public void setSampleSize(Integer sampleSize) {
        this.sampleSize = sampleSize;
    }
}