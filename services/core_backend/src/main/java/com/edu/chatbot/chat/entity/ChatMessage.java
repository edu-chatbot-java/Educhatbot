package com.edu.chatbot.chat.entity;

import com.edu.chatbot.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "chat_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private ChatSession session;

    @Enumerated(EnumType.STRING)
    @Column(name = "sender", nullable = false, length = 10)
    private Sender sender;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "code_snippet", columnDefinition = "TEXT")
    private String codeSnippet;

    @Column(name = "detected_language", length = 50)
    private String detectedLanguage;

    @Enumerated(EnumType.STRING)
    @Column(name = "approach", length = 20)
    private Approach approach;

    @Column(name = "latency_ms")
    private Long latencyMs;

    // TODO: TV6 sẽ thiết kế chức năng Rating. Hiện tại để nullable = true.
    @Column(name = "user_rating")
    private Integer userRating;

    // TODO: TV6 sẽ thiết kế chức năng Feedback. Hiện tại để nullable = true.
    @Column(name = "feedback_type", length = 20)
    private String feedbackType;
}
