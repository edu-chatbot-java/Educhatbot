package com.edu.chatbot.finetune.dto;

import lombok.Builder;
import lombok.Data;

/**
 * DTO trả về từ FineTuningService cho ChatController (TV4).
 * Chứa câu trả lời, độ trễ và loại approach để TV6 ghi log.
 */
@Data
@Builder
public class FineTuneResultDTO {

    /** Câu trả lời được sinh ra từ mô hình Fine-tuned */
    private String answer;

    /** Thời gian xử lý toàn bộ luồng (ms) — bao gồm cả network call đến HF */
    private Long latencyMs;

    /** Luôn = "FINETUNE" — TV6 dùng để ghi vào cột approach trong chat_messages */
    private String approach;
}
