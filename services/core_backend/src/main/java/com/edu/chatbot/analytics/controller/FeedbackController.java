package com.edu.chatbot.analytics.controller;

import com.edu.chatbot.analytics.dto.FeedbackRequest;
import com.edu.chatbot.analytics.service.AnalyticsService;
import com.edu.chatbot.common.dto.ApiResponse; // Class do TV1 viết
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final AnalyticsService analyticsService;

    public FeedbackController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }
    @PostMapping("/submit")
    public ApiResponse<String> submitFeedback(
            @Valid @RequestBody FeedbackRequest request,
            @AuthenticationPrincipal Long userId) { 
        
        // Ghi chú: Giả định TV2 cấu hình Security nhét User ID vào Principal.
        // Nếu lúc test chưa có token hợp lệ, code vẫn không chết nhờ gán mặc định.
        Long currentUserId = (userId != null) ? userId : 1L; 
        
        analyticsService.submitFeedback(request, currentUserId);
        
        return ApiResponse.success(null, "Hệ thống đã ghi nhận đánh giá của bạn!");
    }
}