package com.edu.chatbot.finetune.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Response từ Hugging Face Inference API (text-generation).
 * HF trả về dạng JSON array: [{ "generated_text": "..." }]
 */
@Data
public class FineTuneResponse {

    @JsonProperty("generated_text")
    private String generatedText;
}
