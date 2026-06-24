package com.edu.chatbot.finetune.service;

import com.edu.chatbot.chat.entity.Approach;
import com.edu.chatbot.chat.entity.ChatMessage;
import com.edu.chatbot.chat.entity.ChatSession;
import com.edu.chatbot.chat.entity.Sender;
import com.edu.chatbot.chat.repository.ChatMessageRepository;
import com.edu.chatbot.chat.repository.ChatSessionRepository;
import com.edu.chatbot.finetune.client.FineTuningClient;
import com.edu.chatbot.finetune.dto.FineTuneResultDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class FineTuningServiceImpl implements FineTuningService {

    private final FineTuningClient fineTuningClient;
    private final ChatSessionRepository sessionRepository;
    private final ChatMessageRepository messageRepository;

    private static final String SYSTEM_PROMPT =
            "Bạn là trợ lý học thuật thông minh chuyên về lập trình Java. " +
            "Nhiệm vụ của bạn là trả lời câu hỏi của sinh viên dựa trên ngữ cảnh tài liệu được cung cấp. " +
            "Hãy trả lời bằng tiếng Việt, chính xác, rõ ràng và dễ hiểu. " +
            "Nếu ngữ cảnh không đủ thông tin, hãy nói rõ điều đó thay vì đoán mò.";

    @Override
    public FineTuneResultDTO processFineTuning(Long sessionId, String question, String codeSnippet) {
        log.info("Bat dau xu ly Fine-tuning | sessionId={}", sessionId);
        long startTime = System.currentTimeMillis();

        ChatSession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy phiên chat: " + sessionId));
        
        List<ChatMessage> history = messageRepository
            .findTop10BySessionIdOrderByCreatedAtDesc(sessionId);
            
        String subjectName = session.getSubject() != null ? session.getSubject().getName() : "Không xác định";

        String prompt = buildLlamaPrompt(question, codeSnippet, history, subjectName);

        String answer = fineTuningClient.generate(prompt);

        long latencyMs = System.currentTimeMillis() - startTime;
        
        saveChatMessages(session, question, codeSnippet, answer, latencyMs);

        log.info("Fine-tuning hoan thanh | sessionId={} | latency={}ms", sessionId, latencyMs);

        return FineTuneResultDTO.builder()
                .answer(answer)
                .latencyMs(latencyMs)
                .approach("FINETUNE")
                .build();
    }

    private String buildLlamaPrompt(String question, String codeSnippet,
                                    List<ChatMessage> history, String subjectName) {
        StringBuilder sb = new StringBuilder();

        sb.append("<|begin_of_text|>");

        sb.append("<|start_header_id|>system<|end_header_id|>\n\n")
          .append(SYSTEM_PROMPT)
          .append("\nMôn học hiện tại: ").append(subjectName)
          .append("<|eot_id|>\n");

        java.util.List<ChatMessage> ordered = new java.util.ArrayList<>(history);
        java.util.Collections.reverse(ordered);
        for (ChatMessage msg : ordered) {
            String role = msg.getSender() == Sender.USER ? "user" : "assistant";
            sb.append("<|start_header_id|>").append(role).append("<|end_header_id|>\n\n")
              .append(msg.getContent())
              .append("<|eot_id|>\n");
        }

        sb.append("<|start_header_id|>user<|end_header_id|>\n\n")
          .append(question);

        if (codeSnippet != null && !codeSnippet.isBlank()) {
            sb.append("\n\nCode snippet:\n```java\n")
              .append(codeSnippet)
              .append("\n```");
        }
        sb.append("<|eot_id|>\n");

        sb.append("<|start_header_id|>assistant<|end_header_id|>\n\n");

        return sb.toString();
    }

    private void saveChatMessages(ChatSession session, String question, String codeSnippet, String answer, long latencyMs) {
        ChatMessage userMsg = ChatMessage.builder()
            .session(session)
            .sender(Sender.USER)
            .content(question)
            .codeSnippet(codeSnippet)
            .approach(Approach.FINETUNE)
            .build();
            
        ChatMessage botMsg = ChatMessage.builder()
            .session(session)
            .sender(Sender.BOT)
            .content(answer)
            .approach(Approach.FINETUNE)
            .latencyMs(latencyMs)
            .build();
            
        messageRepository.save(userMsg);
        messageRepository.save(botMsg);
    }
}
