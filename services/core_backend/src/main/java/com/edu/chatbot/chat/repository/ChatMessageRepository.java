package com.edu.chatbot.chat.repository;

import com.edu.chatbot.chat.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    
    // Lấy 10 tin nhắn gần nhất của phiên để làm Context
    List<ChatMessage> findTop10BySessionIdOrderByCreatedAtDesc(Long sessionId);
}
