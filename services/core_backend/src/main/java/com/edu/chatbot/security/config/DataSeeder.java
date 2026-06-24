package com.edu.chatbot.security.config;

import com.edu.chatbot.security.entity.User;
import com.edu.chatbot.security.enums.Role;
import com.edu.chatbot.security.repository.UserRepository;
import com.edu.chatbot.common.entity.Subject;
import com.edu.chatbot.common.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SubjectRepository subjectRepository;

    @Override
    public void run(String... args) throws Exception {
        // Kiểm tra xem đã có tài khoản admin chưa
        if (!userRepository.existsByEmail("admin@chatbot.edu.vn")) {
            User admin = User.builder()
                    .email("admin@chatbot.edu.vn")
                    .password(passwordEncoder.encode("admin123"))
                    .fullName("System Admin")
                    .username("admin")
                    .role(Role.ROLE_ADMIN)
                    .build();

            userRepository.save(admin);
            log.info("Tự động khởi tạo tài khoản Admin mặc định: admin@chatbot.edu.vn / admin123");
        }

        // Kiểm tra xem đã có môn học nào chưa
        if (subjectRepository.count() == 0) {
            Subject subject = new Subject();
            subject.setCode("IT001");
            subject.setName("Java OOP");
            subjectRepository.save(subject);
            log.info("Tự động khởi tạo môn học mặc định: Java OOP (ID: 1)");
        }
    }
}
