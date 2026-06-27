package com.edu.chatbot.finetune.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Response từ Modal.com deployed service endpoint.
 */
@Data
public class FineTuneResponse {

    private String answer;

    @JsonProperty("latency_ms")
    private Long latencyMs;
}
