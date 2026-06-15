package com.edu.chatbot.security.auth;

import com.edu.chatbot.security.dto.AuthResponse;
import com.edu.chatbot.security.dto.LoginRequest;
import com.edu.chatbot.security.dto.RegisterRequest;
import com.edu.chatbot.security.dto.TokenRefreshRequest;
import com.edu.chatbot.security.dto.TokenRefreshResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    TokenRefreshResponse refreshToken(TokenRefreshRequest request);
    void logout(Long userId);
}
