package com.edu.chatbot.chat.repository;

import com.edu.chatbot.chat.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    
    // Lấy 10 tin nhắn gần nhất của phiên để làm Context
    List<ChatMessage> findTop10BySessionIdOrderByCreatedAtDesc(Long sessionId);
    
    // Lấy danh sách tin nhắn theo điểm đánh giá
    List<ChatMessage> findByUserRating(Integer rating);

    @org.springframework.data.jpa.repository.Query("SELECT AVG(m.userRating) FROM ChatMessage m WHERE m.userRating IS NOT NULL")
    Double getAverageRating();

    @org.springframework.data.jpa.repository.Query("SELECT AVG(m.latencyMs) FROM ChatMessage m WHERE m.approach = :approach")
    Double getAverageLatencyByApproach(@org.springframework.data.repository.query.Param("approach") com.edu.chatbot.chat.entity.Approach approach);
}
