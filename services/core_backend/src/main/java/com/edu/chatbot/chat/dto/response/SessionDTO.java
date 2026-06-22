package com.edu.chatbot.chat.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class SessionDTO {
    private Long id;
    private String title;
    private Long subjectId;
    private LocalDateTime createdAt;
}
