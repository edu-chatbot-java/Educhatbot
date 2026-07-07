package com.edu.chatbot.security.auth.impl;

import com.edu.chatbot.security.auth.AuthService;
import com.edu.chatbot.security.dto.AuthResponse;
import com.edu.chatbot.security.dto.LoginRequest;
import com.edu.chatbot.security.dto.RegisterRequest;
import com.edu.chatbot.security.dto.TokenRefreshRequest;
import com.edu.chatbot.security.dto.TokenRefreshResponse;
import com.edu.chatbot.security.entity.RefreshToken;
import com.edu.chatbot.security.entity.User;
import com.edu.chatbot.security.enums.Role;
import com.edu.chatbot.security.jwt.JwtTokenProvider;
import com.edu.chatbot.security.repository.UserRepository;
import com.edu.chatbot.security.service.AuditLogService;
import com.edu.chatbot.security.service.RefreshTokenService;
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
    private final RefreshTokenService refreshTokenService;

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng!");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .username(request.getUsername())
                .role(Role.ROLE_STUDENT)
                .build();

        userRepository.save(user);

        String token = jwtTokenProvider.generateToken(user.getEmail());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());
        
        return new AuthResponse(token, refreshToken.getToken(), user.getRole().name());
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại!"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu không chính xác!");
        }

        String token = jwtTokenProvider.generateToken(user.getEmail());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());
        
        // Ghi lại lịch sử đăng nhập vào sổ Audit Log
        auditLogService.logAction("ĐĂNG NHẬP", user.getEmail(), "Đăng nhập thành công vào hệ thống");
        
        return new AuthResponse(token, refreshToken.getToken(), user.getRole().name());
    }

    @Override
    public TokenRefreshResponse refreshToken(TokenRefreshRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        RefreshToken refreshToken = refreshTokenService.findByToken(requestRefreshToken);
        refreshToken = refreshTokenService.verifyExpiration(refreshToken);
        
        User user = refreshToken.getUser();
        String newAccessToken = jwtTokenProvider.generateToken(user.getEmail());
        
        return new TokenRefreshResponse(newAccessToken, requestRefreshToken);
    }

    @Override
    public void logout(Long userId) {
        userRepository.findById(userId).ifPresent(user -> {
            auditLogService.logAction("ĐĂNG XUẤT", user.getEmail(), "Đăng xuất khỏi hệ thống thành công");
        });
        refreshTokenService.deleteByUserId(userId);
    }
}
