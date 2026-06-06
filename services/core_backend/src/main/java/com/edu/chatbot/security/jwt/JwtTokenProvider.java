package com.edu.chatbot.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;

@Component
public class JwtTokenProvider {

    // Khóa bí mật dùng để ký token
    @Value("${app.jwt.secret:dGhpc2lzYXNlY3JldGtleWZvcmVkdWNoYXRib3Rqd3R0b2tlbnNpZ25hdHVyZXdpdGhsb25nc3RyaW5n}")
    private String jwtSecret;

    // Thời gian sống của token (1 ngày = 86400000 ms)
    @Value("${app.jwt.expiration-in-ms:86400000}")
    private long jwtExpirationInMs;

    private Key getSigningKey() {
        byte[] keyBytes = io.jsonwebtoken.io.Decoders.BASE64.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // 1. Tạo thẻ từ (token) cho người dùng đăng nhập thành công
    public String generateToken(String email) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(expiryDate)
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    // 2. Đọc thẻ từ (token) để biết đây là email của ai
    public String getEmailFromJWT(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }

    // 3. Bảo vệ cửa: Kiểm tra xem thẻ từ (token) này có phải thẻ xịn không
    public boolean validateToken(String authToken) {
        try {
            Jwts.parserBuilder().setSigningKey(getSigningKey()).build().parseClaimsJws(authToken);
            return true;
        } catch (Exception ex) {
            System.out.println("Token không hợp lệ hoặc đã hết hạn: " + ex.getMessage());
        }
        return false;
    }
}
