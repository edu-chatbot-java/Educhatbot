package com.edu.chatbot.security.config;

import com.edu.chatbot.security.jwt.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    // 1. Cung cấp "Máy băm mật khẩu" (Chính hàm này sẽ giúp file AuthServiceImpl hết bị lỗi đỏ)
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // 2. Thiết lập bộ luật an ninh cho toàn hệ thống
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Tắt CSRF (vì mình dùng Token, không dùng Session cookie)
            .cors(cors -> cors.disable()) // Tắt CORS (cấu hình sau nếu frontend kết nối)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // Chế độ không lưu trạng thái
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll() // Cánh cửa /api/auth mở tự do cho mọi người đăng ký, đăng nhập
                .requestMatchers("/api/admin/**").hasRole("ADMIN") // Chỉ ADMIN mới được vào các link bắt đầu bằng /api/admin
                .requestMatchers("/api/teacher/**").hasAnyRole("TEACHER", "ADMIN") // TEACHER hoặc ADMIN được vào
                .anyRequest().authenticated() // BẤT CỨ cánh cửa nào khác đều phải trình thẻ Token
            )
            // Nhét "Ông bảo vệ" JwtFilter đứng ở trước cửa kiểm tra của Spring
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
