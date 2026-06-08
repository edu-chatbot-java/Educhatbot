package com.edu.chatbot.security.auth;

import com.edu.chatbot.security.dto.AuthResponse;
import com.edu.chatbot.security.dto.LoginRequest;
import com.edu.chatbot.security.dto.RegisterRequest;
import com.edu.chatbot.security.entity.User;
import com.edu.chatbot.security.enums.Role;
import com.edu.chatbot.security.jwt.JwtTokenProvider;
import com.edu.chatbot.security.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder; // Sẽ báo đỏ xíu vì chưa làm SecurityConfig
    private final JwtTokenProvider jwtTokenProvider;

    // --- HÀM ĐĂNG KÝ ---
    public AuthResponse register(RegisterRequest request) {
        // 1. Kiểm tra xem email có ai đăng ký chưa
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng!");
        }

        // 2. Tạo tài khoản mới (Mã hóa mật khẩu cho an toàn)
        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .role(Role.ROLE_STUDENT) // Mặc định ai đăng ký cũng là học sinh
                .build();

        userRepository.save(user); // Lưu vào database

        // 3. Lấy máy in thẻ từ ra cấp thẻ (Token)
        String token = jwtTokenProvider.generateToken(user.getEmail());
        return new AuthResponse(token);
    }

    // --- HÀM ĐĂNG NHẬP ---
    public AuthResponse login(LoginRequest request) {
        // 1. Tìm user theo email
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại!"));

        // 2. So sánh mật khẩu nhập vào với mật khẩu trong DB
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Mật khẩu không chính xác!");
        }

        // 3. Nếu đúng hết thì in thẻ từ (Token) đưa cho họ
        String token = jwtTokenProvider.generateToken(user.getEmail());
        return new AuthResponse(token);
    }
}
