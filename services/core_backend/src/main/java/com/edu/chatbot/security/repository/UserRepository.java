package com.edu.chatbot.security.repository;

import com.edu.chatbot.security.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    // Tìm user theo email (dùng khi đăng nhập)
    Optional<User> findByEmail(String email);
    
    // Kiểm tra email đã tồn tại chưa (dùng khi đăng ký)
    boolean existsByEmail(String email);
}
