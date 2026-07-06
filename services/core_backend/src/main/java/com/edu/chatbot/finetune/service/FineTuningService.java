package com.edu.chatbot.finetune.service;

import com.edu.chatbot.finetune.dto.FineTuneResultDTO;

/**
 * Interface cho Fine-tuning Service (TV5).
 *
 * TV4 (ChatController) gọi phương thức này khi người dùng chọn approach = FINETUNE.
 * TV5 chịu trách nhiệm implement toàn bộ luồng RF-10.
 */
public interface FineTuningService {

    /**
     * Xử lý câu hỏi theo luồng Fine-tuning (RF-10):
     * 1. Load ChatSession + Subject từ DB
     * 2. Lấy 5 tin nhắn gần nhất làm Chat Memory
     * 3. Build prompt theo Llama-3.1 chat template
     * 4. Gọi Hugging Face Inference API
     * 5. Lưu kết quả vào chat_messages (approach=FINETUNE, latency_ms)
     * 6. Trả về FineTuneResultDTO
     *
     * @param sessionId   ID phiên chat hiện tại
     * @param question    Câu hỏi của sinh viên
     * @param codeSnippet Đoạn code đính kèm (null nếu không có)
     * @return FineTuneResultDTO chứa câu trả lời, latency và approach
     */
    FineTuneResultDTO processFineTuning(Long sessionId, String question, String codeSnippet);
}
