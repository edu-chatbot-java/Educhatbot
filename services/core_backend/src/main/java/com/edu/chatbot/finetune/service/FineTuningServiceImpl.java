package com.edu.chatbot.finetune.service;

import com.edu.chatbot.finetune.client.FineTuningClient;
import com.edu.chatbot.finetune.dto.FineTuneResultDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Triển khai luồng Fine-tuning (RF-10).
 *
 * LƯU Ý: Class này phụ thuộc vào ChatSession, ChatMessage, Subject
 * do TV4 cung cấp. Khi TV4 chưa hoàn thiện, các dependency sẽ được
 * mock tạm bởi MockChatRepository (xem phần TODO bên dưới).
 *
 * Tuân thủ Antigravity.md §4:
 * - Không try-catch im lặng → throw lỗi để GlobalExceptionHandler bắt
 * - Không trả Entity thô ra ngoài → bọc trong FineTuneResultDTO
 */
@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class FineTuningServiceImpl implements FineTuningService {

    private final FineTuningClient fineTuningClient;

    // ─── TODO: Uncomment khi TV4 đã tạo các class này ────────────────────────
    // private final ChatSessionRepository sessionRepository;
    // private final ChatMessageRepository messageRepository;
    // ─────────────────────────────────────────────────────────────────────────

    // System prompt dùng để hướng dẫn model trong mỗi cuộc hội thoại
    private static final String SYSTEM_PROMPT =
            "Bạn là trợ lý học thuật thông minh chuyên về lập trình Java. " +
            "Nhiệm vụ của bạn là trả lời câu hỏi của sinh viên dựa trên ngữ cảnh tài liệu được cung cấp. " +
            "Hãy trả lời bằng tiếng Việt, chính xác, rõ ràng và dễ hiểu. " +
            "Nếu ngữ cảnh không đủ thông tin, hãy nói rõ điều đó thay vì đoán mò.";

    @Override
    public FineTuneResultDTO processFineTuning(Long sessionId, String question, String codeSnippet) {
        log.info("Bat dau xu ly Fine-tuning | sessionId={}", sessionId);
        long startTime = System.currentTimeMillis();

        // ─── Bước 1-2: Load session + history ────────────────────────────────
        // TODO: Thay bằng code thật khi TV4 cung cấp Repository
        // ChatSession session = sessionRepository.findById(sessionId)
        //     .orElseThrow(() -> new RuntimeException("Không tìm thấy phiên chat: " + sessionId));
        // List<ChatMessage> history = messageRepository
        //     .findTop5BySessionOrderByCreatedAtDesc(session);
        // String subjectName = session.getSubject().getName();

        // Mock tạm để app compile và chạy được trong khi chờ TV4
        String subjectName = "Lập trình Java";
        java.util.List<MockMessage> history = java.util.Collections.emptyList();

        // ─── Bước 3: Build Llama-3.1 chat prompt ─────────────────────────────
        String prompt = buildLlamaPrompt(question, codeSnippet, history, subjectName);

        // ─── Bước 4: Gọi HF Inference API ────────────────────────────────────
        String answer = fineTuningClient.generate(prompt);

        // ─── Bước 5: Lưu vào DB ──────────────────────────────────────────────
        long latencyMs = System.currentTimeMillis() - startTime;
        // TODO: Uncomment khi TV4 cung cấp ChatMessage Entity + Repository
        // saveChatMessages(session, question, codeSnippet, answer, latencyMs);

        log.info("Fine-tuning hoan thanh | sessionId={} | latency={}ms", sessionId, latencyMs);

        return FineTuneResultDTO.builder()
                .answer(answer)
                .latencyMs(latencyMs)
                .approach("FINETUNE")
                .build();
    }

    /**
     * Build prompt theo chuẩn Llama-3.1 chat template.
     *
     * Format:
     *   <|begin_of_text|>
     *   <|start_header_id|>system<|end_header_id|>\n\n{system}\n<|eot_id|>
     *   <|start_header_id|>user<|end_header_id|>\n\n{user}<|eot_id|>
     *   <|start_header_id|>assistant<|end_header_id|>\n\n
     */
    private String buildLlamaPrompt(String question, String codeSnippet,
                                    java.util.List<MockMessage> history, String subjectName) {
        StringBuilder sb = new StringBuilder();

        // Header
        sb.append("<|begin_of_text|>");

        // System turn
        sb.append("<|start_header_id|>system<|end_header_id|>\n\n")
          .append(SYSTEM_PROMPT)
          .append("\nMôn học hiện tại: ").append(subjectName)
          .append("<|eot_id|>\n");

        // Chat history (5 cặp gần nhất, đã đảo ngược về đúng thứ tự)
        java.util.List<MockMessage> ordered = new java.util.ArrayList<>(history);
        java.util.Collections.reverse(ordered);
        for (MockMessage msg : ordered) {
            sb.append("<|start_header_id|>").append(msg.role).append("<|end_header_id|>\n\n")
              .append(msg.content)
              .append("<|eot_id|>\n");
        }

        // User turn hiện tại
        sb.append("<|start_header_id|>user<|end_header_id|>\n\n")
          .append(question);

        // Đính kèm code snippet nếu có
        if (codeSnippet != null && !codeSnippet.isBlank()) {
            sb.append("\n\nCode snippet:\n```java\n")
              .append(codeSnippet)
              .append("\n```");
        }
        sb.append("<|eot_id|>\n");

        // Kết thúc — mở đầu turn của assistant (model sẽ tiếp tục từ đây)
        sb.append("<|start_header_id|>assistant<|end_header_id|>\n\n");

        return sb.toString();
    }

    // ─── Mock class tạm thời — xóa khi TV4 cung cấp ChatMessage Entity ───────
    /** Đại diện tạm cho một tin nhắn trong lịch sử chat */
    private static class MockMessage {
        String role;    // "user" hoặc "assistant"
        String content;
    }
}
