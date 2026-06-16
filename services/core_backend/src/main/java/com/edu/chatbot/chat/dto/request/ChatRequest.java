package com.edu.chatbot.chat.dto.request;

import com.edu.chatbot.chat.entity.Approach;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChatRequest {
    @NotNull(message = "sessionId cannot be null")
    private Long sessionId;

    @NotBlank(message = "question cannot be blank")
    private String question;

    @NotNull(message = "approach cannot be null")
    private Approach approach;
}
