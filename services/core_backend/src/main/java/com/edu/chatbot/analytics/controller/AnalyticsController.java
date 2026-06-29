package com.edu.chatbot.analytics.controller;

import com.edu.chatbot.analytics.dto.AutoEvalRequest;
import com.edu.chatbot.analytics.dto.DashboardResponse;
import com.edu.chatbot.analytics.service.AnalyticsService;
import com.edu.chatbot.common.dto.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    // Viết Constructor bằng tay thay vì dùng Lombok
    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<DashboardResponse> getDashboard() {
        DashboardResponse stats = analyticsService.getDashboardStats();
        return ApiResponse.success(stats, "Trích xuất số liệu Dashboard thành công");
    }

    @GetMapping("/export/jsonl")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportJsonl() {
        byte[] fileContent = analyticsService.exportTrainingDataToJsonl();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=antigravity_training_data.jsonl")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(fileContent);
    }

    @PostMapping("/evaluate")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<String> triggerAutoEvaluation(@Valid @RequestBody AutoEvalRequest request) {
        analyticsService.runAutoEvaluation(request.getApproach(), request.getSampleSize());
        return ApiResponse.success(null, String.format("Đã kích hoạt đánh giá thành công cho %s với %d mẫu. Vui lòng check Dashboard.", 
                        request.getApproach(), request.getSampleSize()));
    }
}