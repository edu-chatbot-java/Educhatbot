package com.edu.chatbot.analytics.service.impl;

import com.edu.chatbot.analytics.domain.EvaluationResult;
import com.edu.chatbot.analytics.domain.Feedback;
import com.edu.chatbot.analytics.dto.DashboardResponse;
import com.edu.chatbot.analytics.dto.FeedbackRequest;
import com.edu.chatbot.analytics.repository.EvaluationResultRepository;
import com.edu.chatbot.analytics.repository.FeedbackRepository;
import com.edu.chatbot.analytics.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalyticsServiceImpl implements AnalyticsService {

    private final FeedbackRepository feedbackRepo;
    private final EvaluationResultRepository evalRepo;

    @Override
    @Transactional
    public void submitFeedback(FeedbackRequest request, Long userId) {
        log.info("Nhận feedback cho messageId: {} từ userId: {}", request.getMessageId(), userId);
        
        Feedback feedback = Feedback.builder()
                .messageId(request.getMessageId())
                .userId(userId)
                .rating(request.getRating())
                .thumbsAction(request.getThumbsAction())
                .blindTestWinner(request.getBlindTestWinner())
                .comment(request.getComment())
                .build();
                
        feedbackRepo.save(feedback);
        log.info("Lưu feedback thành công vào cơ sở dữ liệu.");
    }

    @Override
    public DashboardResponse getDashboardStats() {
        log.info("Đang tổng hợp số liệu cho Dashboard...");

        // 1. Lấy số liệu cơ bản từ FeedbackRepository
        Double avgRating = feedbackRepo.getAverageRating();
        Long ragWins = feedbackRepo.countBlindTestWinsByApproach("RAG");
        Long finetuneWins = feedbackRepo.countBlindTestWinsByApproach("FINETUNE");
        
        // 2. Lấy số liệu từ EvaluationResultRepository
        Double ragAvgLatency = evalRepo.getAverageLatencyByApproach("RAG");
        Double finetuneAvgLatency = evalRepo.getAverageLatencyByApproach("FINETUNE");
        Double avgFaithfulness = evalRepo.getAverageFaithfulnessByApproach("RAG"); 
        Double avgRelevancy = evalRepo.getAverageRelevancyByApproach("FINETUNE");
        // 3. Tính toán tỷ lệ thắng (Win Rate) cho bài Test Mù (Blind Test)
        long totalBlindTests = (ragWins != null ? ragWins : 0) + (finetuneWins != null ? finetuneWins : 0);
        double ragWinRate = 0.0;
        if (totalBlindTests > 0) {
            ragWinRate = ((double) ragWins / totalBlindTests) * 100;
        }

        // 4. Đóng gói toàn bộ số liệu vào DTO để trả về Frontend
        return DashboardResponse.builder()
                .averageRating(avgRating != null ? Math.round(avgRating * 10.0) / 10.0 : 0.0)
                .ragWins(ragWins != null ? ragWins : 0)
                .finetuneWins(finetuneWins != null ? finetuneWins : 0)
                .ragWinRatePercentage(Math.round(ragWinRate * 10.0) / 10.0)
                .ragAverageLatencyMs(ragAvgLatency)
                .finetuneAverageLatencyMs(finetuneAvgLatency)
                .averageFaithfulness(avgFaithfulness != null ? avgFaithfulness : 0.0)
                .averageRelevancy(avgRelevancy != null ? avgRelevancy : 0.0)
                // Các trường count cần hook vào ChatSessionRepo sau, tạm gán 0
                .totalChatSessions(0L) 
                .totalMessages(0L)
                .build();
    }

    @Override
    public byte[] exportTrainingDataToJsonl() {
        log.info("Bắt đầu xuất dữ liệu JSONL... (Đang sử dụng Mock Data)");
        
        /* * MOCK DATA: Áp dụng quy tắc Mock của dự án vì Thành viên 4 (TV4) chưa hoàn thiện 
         * ChatMessageRepository. Sau này khi TV4 code xong, bạn sẽ thay chuỗi này bằng 
         * lệnh Query xuống DB: findByUserRating(5) rồi dùng ObjectMapper format thành JSON.
         */
        String mockJsonl = "{\"messages\": [{\"role\": \"user\", \"content\": \"Tính đa hình là gì?\"}, {\"role\": \"assistant\", \"content\": \"Là khả năng một đối tượng có nhiều hình thái trong lập trình OOP...\"}]}\n"
                         + "{\"messages\": [{\"role\": \"user\", \"content\": \"Giải thích khái niệm Dependency Injection?\"}, {\"role\": \"assistant\", \"content\": \"Là một design pattern giúp giảm sự phụ thuộc giữa các class...\"}]}\n";
        
        return mockJsonl.getBytes(StandardCharsets.UTF_8);
    }

    @Override
    @Transactional
    public void runAutoEvaluation(String approach, int sampleSize) {
        log.info("Bắt đầu chạy Auto Evaluation (LLM-as-a-Judge) cho mô hình: {} với {} mẫu", approach, sampleSize);

        /*
         * TƯƠNG LAI: 
         * 1. Lấy danh sách lịch sử chat thực tế từ TV4.
         * 2. Bắn Prompt này sang Groq API (Llama 3 8B) để chấm điểm thật.
         */
        
        String promptTemplate = """
            Bạn là một giám khảo AI khách quan. 
            Nhiệm vụ: Chấm điểm ĐỘ TRUNG THỰC (Faithfulness) của câu trả lời AI dựa trên Ngữ cảnh gốc.
            - Phạt nặng (0.0) nếu AI bịa đặt (hallucination).
            - Cho điểm tuyệt đối (1.0) nếu AI bám sát ngữ cảnh.
            Chỉ trả về duy nhất một con số thập phân.
            """;
        
        log.debug("Đã khởi tạo Prompt Đánh giá: {}", promptTemplate);

        // MOCK POINT: Giả lập điểm số phản hồi từ Groq API
        Float mockFaithfulnessScore = 0.88f;
        Float mockRelevancyScore = 0.92f;

        // Lưu kết quả chấm điểm vào Database để hiển thị lên Dashboard
        EvaluationResult result = EvaluationResult.builder()
                .approach(approach)
                .question("Mô phỏng câu hỏi test từ DB")
                .generatedAnswer("Mô phỏng câu trả lời test từ DB")
                .groundTruth("Mô phỏng đáp án tham chiếu chuẩn")
                .faithfulnessScore(mockFaithfulnessScore)
                .relevancyScore(mockRelevancyScore)
                .latencyMs((long) (Math.random() * 2000 + 500)) // Random latency từ 500ms - 2500ms
                .build();
                
        evalRepo.save(result);
        log.info("Đã hoàn tất lưu kết quả đánh giá tự động vào hệ thống!");
    }
}