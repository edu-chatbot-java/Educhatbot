package com.edu.chatbot.finetune.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

/**
 * Payload gửi đến Modal.com deployed service endpoint.
 */
@Data
@Builder
public class FineTuneRequest {

    /** Prompt đã được build sẵn theo chat template */
    private String prompt;

    /** Số token tối đa sinh ra (không tính prompt) */
    @JsonProperty("max_new_tokens")
    private Integer maxNewTokens;

    /** Nhiệt độ (0.0 = deterministic, 1.0 = creative) */
    private Float temperature;
}
