package com.edu.chatbot.security.controller;

import com.edu.chatbot.security.auth.AuthService;
import com.edu.chatbot.security.dto.AuthResponse;
import com.edu.chatbot.security.dto.LoginRequest;
import com.edu.chatbot.security.dto.RegisterRequest;
import com.edu.chatbot.security.dto.TokenRefreshRequest;
import com.edu.chatbot.security.dto.TokenRefreshResponse;
import com.edu.chatbot.security.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    // Gọi "não bộ" (AuthService) ra để chuẩn bị xử lý
    private final AuthService authService;

    // 1. Cánh cửa cho Đăng ký (Đường dẫn gọi từ Postman: POST /api/auth/register)
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        // Nhờ AuthService xử lý và hứng mã Token trả về
        AuthResponse response = authService.register(request);
        return ResponseEntity.ok(response);
    }

    // 2. Cánh cửa cho Đăng nhập (Đường dẫn gọi từ Postman: POST /api/auth/login)
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        // Nhờ AuthService xử lý và hứng mã Token trả về
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    // 3. Cánh cửa cho Refresh Token (Cấp lại thẻ khi thẻ cũ hết hạn)
    @PostMapping("/refresh")
    public ResponseEntity<TokenRefreshResponse> refreshToken(@Valid @RequestBody TokenRefreshRequest request) {
        TokenRefreshResponse response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    // 4. Cánh cửa cho Đăng xuất (Vô hiệu hóa Refresh Token)
    @PostMapping("/logout")
    public ResponseEntity<String> logout() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            User user = (User) authentication.getPrincipal();
            authService.logout(user.getId());
        }
        return ResponseEntity.ok("Đăng xuất thành công!");
    }
}
