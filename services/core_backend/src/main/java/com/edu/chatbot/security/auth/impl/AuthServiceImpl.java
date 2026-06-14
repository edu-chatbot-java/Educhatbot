package com.edu.chatbot.security.auth.impl;

import com.edu.chatbot.security.auth.AuthService;
import com.edu.chatbot.security.dto.AuthResponse;
import com.edu.chatbot.security.dto.LoginRequest;
import com.edu.chatbot.security.dto.RegisterRequest;
import com.edu.chatbot.security.entity.User;
import com.edu.chatbot.security.enums.Role;
import com.edu.chatbot.security.jwt.JwtTokenProvider;
import com.edu.chatbot.security.repository.UserRepository;
import com.edu.chatbot.security.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder; 
    private final JwtTokenProvider jwtTokenProvider;
    private final AuditLogService auditLogService;

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng!");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(Role.ROLE_STUDENT)
                .build();

        userRepository.save(user);

        String token = jwtTokenProvider.generateToken(user.getEmail());
        return new AuthResponse(token);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại!"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu không chính xác!");
        }

        String token = jwtTokenProvider.generateToken(user.getEmail());
        
        // Ghi lại lịch sử đăng nhập vào sổ Audit Log
        auditLogService.logAction("ĐĂNG NHẬP", user.getEmail(), "Đăng nhập thành công vào hệ thống");
        
        return new AuthResponse(token);
    }
}
