package com.edu.chatbot.finetune.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

/**
 * Payload gửi đến Hugging Face Inference API (Text Generation Inference).
 * Format chuẩn theo HF API: https://huggingface.co/docs/api-inference/tasks/text-generation
 */
@Data
@Builder
public class FineTuneRequest {

    /** Prompt đã được build sẵn theo Llama-3.1 chat template */
    private String inputs;

    /** Tham số điều khiển việc sinh văn bản */
    private Parameters parameters;

    @Data
    @Builder
    public static class Parameters {

        /** Số token tối đa sinh ra (không tính prompt) */
        @JsonProperty("max_new_tokens")
        private Integer maxNewTokens;

        /** Nhiệt độ (0.0 = deterministic, 1.0 = creative) */
        private Float temperature;

        /** Bật sampling ngẫu nhiên */
        @JsonProperty("do_sample")
        private Boolean doSample;

        /** false = chỉ trả phần AI sinh ra, không lặp lại prompt đầu vào */
        @JsonProperty("return_full_text")
        private Boolean returnFullText;

        /** Top-p nucleus sampling */
        @JsonProperty("top_p")
        private Float topP;

        /** Tham số chống lặp từ (ví dụ 1.1 đến 1.2) */
        @JsonProperty("repetition_penalty")
        private Float repetitionPenalty;
    }
}
