package com.edu.chatbot.chat.repository;

import com.edu.chatbot.chat.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    
    List<ChatSession> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<ChatSession> findByIdAndUserId(Long id, Long userId);

    // Dùng tạm khi chưa có User:
    List<ChatSession> findAllByOrderByCreatedAtDesc();
}
