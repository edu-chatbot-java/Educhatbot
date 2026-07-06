package com.edu.chatbot.security.jwt;

import com.edu.chatbot.security.entity.User;
import com.edu.chatbot.security.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        try {
            // 1. Lấy mã Token từ header của request
            String jwt = getJwtFromRequest(request);

            // 2. Kiểm tra mã Token có hợp lệ không
            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                
                // Lấy email từ chuỗi jwt
                String email = tokenProvider.getEmailFromJWT(jwt);

                // Lấy thông tin người dùng từ Database
                User user = userRepository.findByEmail(email)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy user với email này"));

                // Phân quyền cho người dùng (dựa vào Role trong DB)
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        user, null, Collections.singletonList(new SimpleGrantedAuthority(user.getRole().name()))
                );
                
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Lưu người dùng đã xác thực vào Context của Spring Security
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception ex) {
            System.out.println("Không thể thiết lập xác thực người dùng: " + ex.getMessage());
        }

        // Cho đi tiếp vào Controller
        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        // Kiểm tra xem header Authorization có chứa thông tin jwt (bắt đầu bằng Bearer) không
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
