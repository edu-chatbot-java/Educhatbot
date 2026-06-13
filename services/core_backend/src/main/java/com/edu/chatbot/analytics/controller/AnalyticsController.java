package com.edu.chatbot.analytics.controller;

import com.edu.chatbot.analytics.dto.AutoEvalRequest;
import com.edu.chatbot.analytics.dto.DashboardResponse;
import com.edu.chatbot.analytics.service.AnalyticsService;
import com.edu.chatbot.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /**
     * API 1: Cung cấp toàn bộ số liệu thống kê để vẽ biểu đồ trên Dashboard.
     * Quyền: Chỉ Admin
     */
    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<DashboardResponse> getDashboard() {
        DashboardResponse stats = analyticsService.getDashboardStats();
        
        return ApiResponse.<DashboardResponse>builder()
                .status("success")
                .code(200)
                .message("Trích xuất số liệu Dashboard thành công")
                .data(stats)
                .build();
    }

    /**
     * API 2: Tải xuống tệp dữ liệu huấn luyện JSONL cho TV5.
     * Quyền: Chỉ Admin
     * Đặc biệt: Sử dụng ResponseEntity để ép trình duyệt tự động download file.
     */
    @GetMapping("/export/jsonl")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportJsonl() {
        byte[] fileContent = analyticsService.exportTrainingDataToJsonl();
        
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=antigravity_training_data.jsonl")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(fileContent);
    }

    /**
     * API 3: Kích hoạt hệ thống AI giám khảo chấm điểm tự động.
     * Quyền: Chỉ Admin
     */
    @PostMapping("/evaluate")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<String> triggerAutoEvaluation(@Valid @RequestBody AutoEvalRequest request) {
        
        // Gọi hàm xử lý chạy đánh giá
        analyticsService.runAutoEvaluation(request.getApproach(), request.getSampleSize());
        
        return ApiResponse.<String>builder()
                .status("success")
                .code(200)
                .message(String.format("Đã kích hoạt đánh giá thành công cho %s với %d mẫu. Vui lòng check Dashboard.", 
                        request.getApproach(), request.getSampleSize()))
                .data(null)
                .build();
    }
}