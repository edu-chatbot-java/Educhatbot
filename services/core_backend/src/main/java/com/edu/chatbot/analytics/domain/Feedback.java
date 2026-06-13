package com.edu.chatbot.analytics.domain;

import com.edu.chatbot.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "feedbacks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Feedback extends BaseEntity {

    @Column(name = "message_id", nullable = false)
    private Long messageId; // Liên kết với tin nhắn được đánh giá

    @Column(name = "user_id", nullable = false)
    private Long userId; // Người đánh giá

    @Column(name = "rating")
    private Integer rating; // Đánh giá 1-5 sao

    @Column(name = "thumbs_action")
    private String thumbsAction; // THUMBS_UP hoặc THUMBS_DOWN

    // Cột cực kỳ quan trọng cho Blind Test (A/B Testing)
    @Column(name = "blind_test_winner")
    private String blindTestWinner; // Lưu "RAG" hoặc "FINETUNE" dựa trên vote của user

    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment; // Góp ý thêm của sinh viên (nếu có)
}