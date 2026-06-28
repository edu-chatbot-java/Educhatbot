package com.edu.chatbot.chat.service.impl;

import com.edu.chatbot.chat.client.EmbeddingClient;
import com.edu.chatbot.chat.client.FineTuningClient;
import com.edu.chatbot.chat.client.QdrantSearchClient;
import com.edu.chatbot.chat.dto.request.ChatRequest;
import com.edu.chatbot.chat.dto.response.ChatResponseDTO;
import com.edu.chatbot.chat.entity.Approach;
import com.edu.chatbot.chat.entity.ChatSession;
import com.edu.chatbot.chat.repository.ChatMessageRepository;
import com.edu.chatbot.chat.repository.ChatSessionRepository;
import com.edu.chatbot.chat.service.CodeDetectionService;
import com.edu.chatbot.chat.service.QueryRewritingService;
import dev.langchain4j.model.chat.ChatLanguageModel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class ChatServiceImplTest {

    @Mock private ChatSessionRepository sessionRepository;
    @Mock private ChatMessageRepository messageRepository;
    @Mock private QueryRewritingService queryRewritingService;
    @Mock private CodeDetectionService codeDetectionService;
    @Mock private EmbeddingClient embeddingClient;
    @Mock private QdrantSearchClient qdrantSearchClient;
    @Mock private ChatLanguageModel chatModel;
    @Mock private BlindTestOrchestrator blindTestOrchestrator;
    @Mock private FineTuningClient fineTuningClient;

    @InjectMocks
    private ChatServiceImpl chatService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testProcessRAGMessage() {
        ChatRequest request = new ChatRequest();
        request.setSessionId(1L);
        request.setQuestion("Test query");
        request.setApproach(Approach.RAG);

        ChatSession mockSession = new ChatSession();
        mockSession.setId(1L);
        
        when(sessionRepository.findById(1L)).thenReturn(Optional.of(mockSession));
        when(messageRepository.findTop10BySessionIdOrderByCreatedAtDesc(1L)).thenReturn(List.of());
        when(queryRewritingService.rewriteQuery(anyString(), any())).thenReturn("Test query rewritten");
        
        CodeDetectionService.CodeDetectionResult codeResult = CodeDetectionService.CodeDetectionResult.builder()
                .hasCode(false).naturalLanguageQuestion("Test query").build();
        when(codeDetectionService.detect(anyString())).thenReturn(codeResult);
        
        when(embeddingClient.generateEmbedding(anyString())).thenReturn(List.of(0.1f, 0.2f));
        when(qdrantSearchClient.searchByVectorAndSubject(any(), anyLong())).thenReturn(List.of());
        when(chatModel.generate(anyString())).thenReturn("RAG Answer");

        ChatResponseDTO response = chatService.processRAGMessage(request, 1L);

        assertNotNull(response);
        assertEquals("RAG Answer", response.getMessage().getContent());
        verify(chatModel, times(1)).generate(anyString());
        verify(messageRepository, times(2)).save(any()); // Save user msg + bot msg
    }

    @Test
    void testProcessFineTuneMessage() {
        ChatRequest request = new ChatRequest();
        request.setSessionId(1L);
        request.setQuestion("Test finetune query");
        request.setApproach(Approach.FINETUNE);

        ChatSession mockSession = new ChatSession();
        mockSession.setId(1L);

        when(sessionRepository.findById(1L)).thenReturn(Optional.of(mockSession));
        when(fineTuningClient.generateResponse(anyString())).thenReturn("Finetune Answer");

        ChatResponseDTO response = chatService.processFineTuneMessage(request, 1L);

        assertNotNull(response);
        assertEquals("Finetune Answer", response.getMessage().getContent());
        verify(fineTuningClient, times(1)).generateResponse(anyString());
    }
}
