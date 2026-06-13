package com.edu.chatbot.analytics.service;

import com.edu.chatbot.analytics.dto.DashboardResponse;
import com.edu.chatbot.analytics.dto.FeedbackRequest;

public interface AnalyticsService {
    
    // Hứng dữ liệu đánh giá từ user
    void submitFeedback(FeedbackRequest request, Long userId);
    
    // Tính toán số liệu vẽ Dashboard
    DashboardResponse getDashboardStats();
    
    // Xuất dữ liệu chat 5 sao ra file JSONL
    byte[] exportTrainingDataToJsonl();

    // Khai báo hàm chạy đánh giá tự động
    void runAutoEvaluation(String approach, int sampleSize);
}