package com.edu.chatbot.security.auth.impl;

import com.edu.chatbot.security.dto.AuthResponse;
import com.edu.chatbot.security.dto.LoginRequest;
import com.edu.chatbot.security.dto.RegisterRequest;
import com.edu.chatbot.security.entity.RefreshToken;
import com.edu.chatbot.security.entity.User;
import com.edu.chatbot.security.enums.Role;
import com.edu.chatbot.security.jwt.JwtTokenProvider;
import com.edu.chatbot.security.repository.UserRepository;
import com.edu.chatbot.security.service.AuditLogService;
import com.edu.chatbot.security.service.RefreshTokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private RefreshTokenService refreshTokenService;

    @InjectMocks
    private AuthServiceImpl authService;

    private User sampleUser;
    private RefreshToken sampleRefreshToken;

    @BeforeEach
    void setUp() {
        sampleUser = User.builder()
                .username("studentdemo")
                .email("student@chatbot.edu.vn")
                .password("hashed_password")
                .fullName("Student Demo")
                .role(Role.ROLE_STUDENT)
                .build();
        sampleUser.setId(1L);

        sampleRefreshToken = RefreshToken.builder()
                .token("sample-refresh-token")
                .user(sampleUser)
                .expiryDate(Instant.now().plusSeconds(3600))
                .build();
    }

    @Test
    void testRegisterSuccess() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("student@chatbot.edu.vn");
        request.setPassword("password123");
        request.setFullName("Student Demo");
        request.setUsername("studentdemo");

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(false);
        when(passwordEncoder.encode(request.getPassword())).thenReturn("hashed_password");
        when(userRepository.save(any(User.class))).thenReturn(sampleUser);
        when(jwtTokenProvider.generateToken(anyString())).thenReturn("mock-access-token");
        when(refreshTokenService.createRefreshToken(anyLong())).thenReturn(sampleRefreshToken);

        AuthResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("mock-access-token", response.getToken());
        assertEquals("sample-refresh-token", response.getRefreshToken());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void testRegisterFailDuplicateEmail() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("student@chatbot.edu.vn");

        when(userRepository.existsByEmail(request.getEmail())).thenReturn(true);

        assertThrows(RuntimeException.class, () -> authService.register(request));
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testLoginSuccess() {
        LoginRequest request = new LoginRequest();
        request.setEmail("student@chatbot.edu.vn");
        request.setPassword("password123");

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches(request.getPassword(), sampleUser.getPassword())).thenReturn(true);
        when(jwtTokenProvider.generateToken(sampleUser.getEmail())).thenReturn("mock-access-token");
        when(refreshTokenService.createRefreshToken(sampleUser.getId())).thenReturn(sampleRefreshToken);

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("mock-access-token", response.getToken());
        assertEquals("sample-refresh-token", response.getRefreshToken());
        verify(auditLogService, times(1)).logAction(eq("ĐĂNG NHẬP"), eq(sampleUser.getEmail()), anyString());
    }

    @Test
    void testLoginFailWrongPassword() {
        LoginRequest request = new LoginRequest();
        request.setEmail("student@chatbot.edu.vn");
        request.setPassword("wrong-password");

        when(userRepository.findByEmail(request.getEmail())).thenReturn(Optional.of(sampleUser));
        when(passwordEncoder.matches(request.getPassword(), sampleUser.getPassword())).thenReturn(false);

        assertThrows(RuntimeException.class, () -> authService.login(request));
    }
}
