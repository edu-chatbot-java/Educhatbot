package com.edu.chatbot.chat.dto.response;

import com.edu.chatbot.chat.entity.Approach;
import com.edu.chatbot.chat.entity.Sender;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class MessageDTO {
    private Long id;
    private Sender sender;
    private String content;
    private String codeSnippet;
    private String detectedLanguage;
    private Approach approach;
    private Long latencyMs;
    private LocalDateTime createdAt;
}
