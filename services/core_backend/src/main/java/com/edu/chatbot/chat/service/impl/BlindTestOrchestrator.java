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

    public BlindTestOrchestrator(@Lazy ChatService chatService) {
        this.chatService = chatService;
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
