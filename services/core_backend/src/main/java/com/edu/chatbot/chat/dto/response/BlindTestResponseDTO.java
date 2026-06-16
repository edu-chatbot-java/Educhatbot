package com.edu.chatbot.chat.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.SuperBuilder;
import lombok.Builder;

@Data
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class BlindTestResponseDTO extends ChatResponseDTO {
    @Builder.Default
    private boolean isBlindTest = true;
    
    private String answerA;
    private String answerB;
    private Long messageId;
}
