package com.edu.chatbot.security.jwt;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
        // Cấu hình jwtSecret và jwtExpirationInMs thông qua ReflectionTestUtils
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", "dGhpc2lzYXNlY3JldGtleWZvcmVkdWNoYXRib3Rqd3R0b2tlbnNpZ25hdHVyZXdpdGhsb25nc3RyaW5n");
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtExpirationInMs", 3600000L); // 1 giờ
    }

    @Test
    void testGenerateTokenAndGetEmail() {
        String email = "test@example.com";
        String token = jwtTokenProvider.generateToken(email);

        assertNotNull(token);
        assertTrue(jwtTokenProvider.validateToken(token));
        assertEquals(email, jwtTokenProvider.getEmailFromJWT(token));
    }

    @Test
    void testValidateInvalidToken() {
        assertFalse(jwtTokenProvider.validateToken("invalid-token"));
    }
}
