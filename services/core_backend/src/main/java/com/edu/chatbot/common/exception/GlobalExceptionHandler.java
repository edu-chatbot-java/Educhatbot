package com.edu.chatbot.common.exception;

import com.edu.chatbot.common.dto.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.HashMap;
import java.util.Map;

/**
 * Bắt và xử lý lỗi tập trung cho toàn bộ các API (ControllerAdvice)
 */
@ControllerAdvice
public class GlobalExceptionHandler {

    // Bắt các Exception chung (Internal Server Error)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGlobalException(Exception ex) {
        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error(ex.getMessage(), "INTERNAL_SERVER_ERROR"));
    }

    // Bắt lỗi Validation (Khi dùng @Valid ở DTO)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidationException(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        
        ex.getBindingResult().getFieldErrors().forEach(error -> 
            errors.put(error.getField(), error.getDefaultMessage())
        );

        ApiResponse<Object> response = ApiResponse.builder()
                .success(false)
                .message("Validation failed")
                .errorCode("BAD_REQUEST")
                .data(errors) // Trả về danh sách field bị lỗi
                .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
    
    // TODO: TV1 có thể định nghĩa thêm CustomException (ví dụ: ResourceNotFoundException) ở đây
}
