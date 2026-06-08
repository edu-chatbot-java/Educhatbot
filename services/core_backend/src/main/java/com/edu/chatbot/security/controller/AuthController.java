package com.edu.chatbot.security.controller;

import com.edu.chatbot.security.auth.AuthService;
import com.edu.chatbot.security.dto.AuthResponse;
import com.edu.chatbot.security.dto.LoginRequest;
import com.edu.chatbot.security.dto.RegisterRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    // Gọi "não bộ" (AuthService) ra để chuẩn bị xử lý
    private final AuthService authService;

    // 1. Cánh cửa cho Đăng ký (Đường dẫn gọi từ Postman: POST /api/auth/register)
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        // Nhờ AuthService xử lý và hứng mã Token trả về
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(response);
    }

    // 2. Cánh cửa cho Đăng nhập (Đường dẫn gọi từ Postman: POST /api/auth/login)
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        // Nhờ AuthService xử lý và hứng mã Token trả về
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }
}
