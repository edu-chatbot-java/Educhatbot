package com.edu.chatbot.common.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

/**
 * Lớp đóng gói chuẩn cho mọi phản hồi API của toàn hệ thống (Standard API Response)
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL) // Ẩn các trường null khi parse sang JSON
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private T data;
    private String errorCode;

    // Các hàm Helper tĩnh để dùng nhanh trong Controller
    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .success(true)
                .message("Operation successful")
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> error(String message, String errorCode) {
        return ApiResponse.<T>builder()
                .success(false)
                .message(message)
                .errorCode(errorCode)
                .build();
    }
}
