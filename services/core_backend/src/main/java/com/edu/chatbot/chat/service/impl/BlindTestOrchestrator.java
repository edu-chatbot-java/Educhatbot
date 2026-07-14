package com.edu.chatbot.chat.service.impl;

import com.edu.chatbot.chat.dto.request.ChatRequest;
import com.edu.chatbot.chat.dto.response.BlindTestResponseDTO;
import com.edu.chatbot.chat.dto.response.ChatResponseDTO;
import com.edu.chatbot.chat.service.ChatService;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
public class BlindTestOrchestrator {

    private final ChatService chatService;
    private final dev.langchain4j.model.chat.ChatLanguageModel evalModel;
    private final com.edu.chatbot.analytics.repository.FeedbackRepository feedbackRepo;
    private final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(BlindTestOrchestrator.class);

    public BlindTestOrchestrator(@Lazy ChatService chatService,
                                 @org.springframework.beans.factory.annotation.Qualifier("evalModel") dev.langchain4j.model.chat.ChatLanguageModel evalModel,
                                 com.edu.chatbot.analytics.repository.FeedbackRepository feedbackRepo) {
        this.chatService = chatService;
        this.evalModel = evalModel;
        this.feedbackRepo = feedbackRepo;
    }

    public BlindTestResponseDTO dispatchBlindTest(ChatRequest request, Long userId) {
        CompletableFuture<ChatResponseDTO> ragFuture = CompletableFuture.supplyAsync(() ->
                chatService.processRAGMessage(request, userId));

        CompletableFuture<ChatResponseDTO> ftFuture = CompletableFuture.supplyAsync(() ->
                chatService.processFineTuneMessage(request, userId));

        CompletableFuture.allOf(ragFuture, ftFuture).join();

        try {
            ChatResponseDTO ragResponse = ragFuture.get();
            ChatResponseDTO ftResponse = ftFuture.get();

            String ragAns = ragResponse.getMessage().getContent();
            String ftAns = ftResponse.getMessage().getContent();

            List<String> answers = Arrays.asList(ragAns, ftAns);
            Collections.shuffle(answers);

            // Chạy ngầm một tiến trình gửi cho LLM giám khảo (ví dụ GPT OSS) chấm điểm
            CompletableFuture.runAsync(() -> {
                String prompt = String.format(
                        "Bạn là giám khảo AI khách quan. Nhiệm vụ: Đánh giá độ chính xác (correctness) của 2 câu trả lời dưới đây cho câu hỏi: '%s'\n\n" +
                        "[Câu trả lời 1]: %s\n\n" +
                        "[Câu trả lời 2]: %s\n\n" +
                        "Hãy quyết định câu trả lời nào chính xác, đầy đủ và đúng đắn hơn. " +
                        "CHỈ TRẢ VỀ DUY NHẤT 1 TỪ: '1' (nếu Câu trả lời 1 tốt hơn) hoặc '2' (nếu Câu trả lời 2 tốt hơn). Không giải thích gì thêm.",
                        request.getQuestion(), ragAns, ftAns
                );
                
                try {
                    log.info("Đang gửi request chấm Blind Test tới LLM Judge (OpenRouter)...");
                    String evaluation = evalModel.generate(prompt).trim();
                    log.info("Kết quả chấm Blind Test từ LLM: {}", evaluation);
                    
                    String winner = evaluation.contains("1") ? "RAG" : "FINETUNE";
                    
                    com.edu.chatbot.analytics.domain.Feedback feedback = com.edu.chatbot.analytics.domain.Feedback.builder()
                            .messageId(ragResponse.getMessage().getId())
                            .userId(userId)
                            .blindTestWinner(winner)
                            .comment("Auto-evaluated by LLM-as-a-Judge")
                            .build();
                    feedbackRepo.save(feedback);
                    log.info("Đã lưu kết quả Blind Test: {} chiến thắng", winner);
                } catch (Exception e) {
                    log.error("Lỗi khi LLM chấm Blind Test", e);
                }
            });

            return BlindTestResponseDTO.builder()
                    .isBlindTest(true)
                    .answerA(answers.get(0))
                    .answerB(answers.get(1))
                    .messageId(ragResponse.getMessage().getId())
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Error executing blind test", e);
        }
    }
}
