package com.edu.chatbot.chat.entity;

import com.edu.chatbot.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "chat_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatSession extends BaseEntity {

    @Column(name = "title", length = 255)
    private String title;

    // TODO: Bỏ comment và import User khi TV2 đã code xong User entity
    // @ManyToOne(fetch = FetchType.LAZY)
    // @JoinColumn(name = "user_id")
    // private User user;

    // TODO: Bỏ comment và import Subject khi TV1 đã code xong Subject entity
    // @ManyToOne(fetch = FetchType.LAZY)
    // @JoinColumn(name = "subject_id")
    // private Subject subject;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ChatMessage> messages = new ArrayList<>();
}
