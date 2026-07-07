package com.edu.chatbot.chat.service.impl;

import com.edu.chatbot.chat.client.EmbeddingClient;
import com.edu.chatbot.chat.client.FineTuningClient;
import com.edu.chatbot.chat.client.QdrantSearchClient;
import com.edu.chatbot.chat.dto.request.ChatRequest;
import com.edu.chatbot.chat.dto.response.ChatResponseDTO;
import com.edu.chatbot.chat.dto.response.MessageDTO;
import com.edu.chatbot.chat.dto.response.SessionDTO;
import com.edu.chatbot.chat.dto.response.SourceDTO;
import com.edu.chatbot.chat.entity.Approach;
import com.edu.chatbot.chat.entity.ChatMessage;
import com.edu.chatbot.chat.entity.ChatSession;
import com.edu.chatbot.chat.entity.Sender;
import com.edu.chatbot.chat.repository.ChatMessageRepository;
import com.edu.chatbot.chat.repository.ChatSessionRepository;
import com.edu.chatbot.chat.service.ChatService;
import com.edu.chatbot.chat.service.CodeDetectionService;
import com.edu.chatbot.chat.service.QueryRewritingService;
import com.edu.chatbot.common.dto.QdrantPayloadDTO;
import dev.langchain4j.model.chat.ChatLanguageModel;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class ChatServiceImpl implements ChatService {

    private final ChatSessionRepository sessionRepository;
    private final ChatMessageRepository messageRepository;
    private final QueryRewritingService queryRewritingService;
    private final CodeDetectionService codeDetectionService;
    private final EmbeddingClient embeddingClient;
    private final QdrantSearchClient qdrantSearchClient;
    private final ChatLanguageModel chatModel;
    private final BlindTestOrchestrator blindTestOrchestrator;
    private final FineTuningClient fineTuningClient;
    private final Random random = new Random();

    public ChatServiceImpl(
            ChatSessionRepository sessionRepository,
            ChatMessageRepository messageRepository,
            QueryRewritingService queryRewritingService,
            CodeDetectionService codeDetectionService,
            EmbeddingClient embeddingClient,
            QdrantSearchClient qdrantSearchClient,
            @Qualifier("chatModel") ChatLanguageModel chatModel,
            BlindTestOrchestrator blindTestOrchestrator,
            FineTuningClient fineTuningClient) {
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
        this.queryRewritingService = queryRewritingService;
        this.codeDetectionService = codeDetectionService;
        this.embeddingClient = embeddingClient;
        this.qdrantSearchClient = qdrantSearchClient;
        this.chatModel = chatModel;
        this.blindTestOrchestrator = blindTestOrchestrator;
        this.fineTuningClient = fineTuningClient;
    }

    @Override
    @Transactional
    public SessionDTO createSession(Long subjectId, Long userId) {
        com.edu.chatbot.security.entity.User user = new com.edu.chatbot.security.entity.User();
        user.setId(userId);
        
        com.edu.chatbot.common.entity.Subject subject = new com.edu.chatbot.common.entity.Subject();
        subject.setId(subjectId);

        ChatSession session = ChatSession.builder()
                .title("New Chat")
                .user(user)
                .subject(subject)
                .build();
        session = sessionRepository.save(session);
        return SessionDTO.builder()
                .id(session.getId())
                .title(session.getTitle())
                .subjectId(subjectId)
                .build();
    }

    @Override
    public List<SessionDTO> getUserSessions(Long userId) {
        return sessionRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(s -> SessionDTO.builder()
                        .id(s.getId())
                        .title(s.getTitle())
                        .subjectId(s.getSubject() != null ? s.getSubject().getId() : null)
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<MessageDTO> getSessionHistory(Long sessionId, Long userId) {
        return messageRepository.findTop10BySessionIdOrderByCreatedAtDesc(sessionId).stream()
                .map(m -> MessageDTO.builder()
                        .id(m.getId())
                        .content(m.getContent())
                        .sender(m.getSender())
                        .codeSnippet(m.getCodeSnippet())
                        .approach(m.getApproach())
                        .latencyMs(m.getLatencyMs())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ChatResponseDTO dispatch(ChatRequest request, Long userId) {
        double blindTestProbability = 0.2; // Configuration parameter theoretically
        if (random.nextDouble() < blindTestProbability) {
            return blindTestOrchestrator.dispatchBlindTest(request, userId);
        } else {
            if (request.getApproach() == Approach.FINETUNE) {
                return processFineTuneMessage(request, userId);
            }
            return processRAGMessage(request, userId);
        }
    }

    @Override
    @Transactional
    public ChatResponseDTO processRAGMessage(ChatRequest request, Long userId) {
        long startTime = System.currentTimeMillis();

        ChatSession session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new RuntimeException("Session not found"));

        ChatMessage userMsg = ChatMessage.builder()
                .session(session)
                .sender(Sender.USER)
                .content(request.getQuestion())
                .approach(Approach.RAG)
                .build();
        messageRepository.save(userMsg);

        List<ChatMessage> history = messageRepository.findTop10BySessionIdOrderByCreatedAtDesc(session.getId());

        String rewrittenQuery = queryRewritingService.rewriteQuery(request.getQuestion(), history);

        CodeDetectionService.CodeDetectionResult codeResult = codeDetectionService.detect(request.getQuestion());

        List<Float> vector = embeddingClient.generateEmbedding(rewrittenQuery);

        Long subjectId = session.getSubject() != null ? session.getSubject().getId() : 1L; // Mock 1L if null
        List<QdrantPayloadDTO> qdrantResults = qdrantSearchClient.searchByVectorAndSubject(vector, subjectId);

        String context = qdrantResults.stream()
                .map(QdrantPayloadDTO::getContent)
                .collect(Collectors.joining("\n\n"));

        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append("Bạn là một trợ lý học thuật thông minh, chuyên hỗ trợ sinh viên học lập trình bằng tiếng Việt.\n")
                .append("Hãy trả lời câu hỏi của sinh viên DỰA TRÊN và CHỈ DỰA TRÊN các đoạn tài liệu được cung cấp.\n")
                .append("Nếu tài liệu không đủ thông tin, hãy nói thẳng \"Tôi không tìm thấy thông tin về vấn đề này trong tài liệu môn học.\"\n")
                .append("Trả lời bằng tiếng Việt, rõ ràng, súc tích.\n")
                .append("Khi đề cập đến các hàm, tên biến, hoặc đoạn code ngắn (dưới 1 dòng) trong câu giải thích, hãy luôn sử dụng định dạng inline code dạng `code` (dùng dấu backtick đơn) thay vì block code (dấu backtick triple). Tuyệt đối không tự ý xuống dòng giữa câu giải thích.\n\n")
                .append("[TÀI LIỆU THAM KHẢO]\n").append(context).append("\n\n")
                .append("[LỊCH SỬ HỘI THOẠI]\n")
                .append(history.stream().map(m -> m.getSender() + ": " + m.getContent()).collect(Collectors.joining("\n")))
                .append("\n\n");

        if (codeResult.isHasCode()) {
            promptBuilder.append("[ĐOẠN MÃ NGUỒN CẦN PHÂN TÍCH]\n```\n")
                    .append(codeResult.getCodeSnippet()).append("\n```\n\n");
        }

        promptBuilder.append("[CÂU HỎI CỦA SINH VIÊN]\n").append(request.getQuestion()).append("\n\n[TRẢ LỜI]\n");

        String answer = chatModel.generate(promptBuilder.toString());
        long latencyMs = System.currentTimeMillis() - startTime;

        ChatMessage botMsg = ChatMessage.builder()
                .session(session)
                .sender(Sender.BOT)
                .content(answer)
                .codeSnippet(codeResult.isHasCode() ? codeResult.getCodeSnippet() : null)
                .approach(Approach.RAG)
                .latencyMs(latencyMs)
                .build();
        messageRepository.save(botMsg);

        if (session.getTitle() == null || session.getTitle().equals("New Chat")) {
            session.setTitle(request.getQuestion().substring(0, Math.min(request.getQuestion().length(), 50)));
            sessionRepository.save(session);
        }

        List<SourceDTO> sources = qdrantResults.stream()
                .map(r -> SourceDTO.builder()
                        .chunkId(r.getChunkId())
                        .content(r.getContent())
                        .build())
                .collect(Collectors.toList());

        return ChatResponseDTO.builder()
                .message(MessageDTO.builder()
                        .id(botMsg.getId())
                        .content(botMsg.getContent())
                        .sender(botMsg.getSender())
                        .codeSnippet(botMsg.getCodeSnippet())
                        .approach(Approach.RAG)
                        .latencyMs(latencyMs)
                        .sources(qdrantResults.stream().map(r -> "Subject ID: " + r.getSubjectId() + " (Chunk: " + r.getChunkId() + ")").collect(Collectors.toList()))
                        .build())
                .sources(sources)
                .build();
    }

    @Override
    @Transactional
    public void rateMessage(Long messageId, Integer rating, String feedbackType) {
        ChatMessage message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        message.setUserRating(rating);
        message.setFeedbackType(feedbackType);
        messageRepository.save(message);
    }

    @Override
    @Transactional
    public ChatResponseDTO processFineTuneMessage(ChatRequest request, Long userId) {
        long startTime = System.currentTimeMillis();
        ChatSession session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new RuntimeException("Session not found"));

        ChatMessage userMsg = ChatMessage.builder()
                .session(session)
                .sender(Sender.USER)
                .content(request.getQuestion())
                .approach(Approach.FINETUNE)
                .build();
        messageRepository.save(userMsg);

        String answer = fineTuningClient.generateResponse(request.getQuestion());
        long latencyMs = System.currentTimeMillis() - startTime;

        ChatMessage botMsg = ChatMessage.builder()
                .session(session)
                .sender(Sender.BOT)
                .content(answer)
                .approach(Approach.FINETUNE)
                .latencyMs(latencyMs)
                .build();
        messageRepository.save(botMsg);

        return ChatResponseDTO.builder()
                .message(MessageDTO.builder()
                        .id(botMsg.getId())
                        .content(botMsg.getContent())
                        .sender(botMsg.getSender())
                        .approach(Approach.FINETUNE)
                        .latencyMs(latencyMs)
                        .build())
                .build();
    }
}
