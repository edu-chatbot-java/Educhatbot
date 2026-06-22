package com.edu.chatbot.chat.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateSessionRequest {
    @NotNull(message = "subjectId cannot be null")
    private Long subjectId;
}
