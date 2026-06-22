package com.edu.chatbot.analytics.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DashboardResponse {
    
    // Tổng quan
    private Long totalChatSessions;
    private Long totalMessages;
    private Double averageRating;

    // So sánh Latency (Thời gian phản hồi)
    private Double ragAverageLatencyMs;
    private Double finetuneAverageLatencyMs;

    // So sánh Win Rate (Tỉ lệ thắng trong Blind Test)
    private Long ragWins;
    private Long finetuneWins;
    private Double ragWinRatePercentage; 

    // Điểm đánh giá tự động (Auto Eval)
    private Double averageFaithfulness;
    private Double averageRelevancy;
}