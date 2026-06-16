package com.edu.chatbot.chat.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SourceDTO {
    private Long chunkId;
    private String content;
}
