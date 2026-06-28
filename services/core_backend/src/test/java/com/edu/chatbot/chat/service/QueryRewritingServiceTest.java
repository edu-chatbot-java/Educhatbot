package com.edu.chatbot.chat.service;

import com.edu.chatbot.chat.entity.ChatMessage;
import com.edu.chatbot.chat.entity.Sender;
import dev.langchain4j.model.chat.ChatLanguageModel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class QueryRewritingServiceTest {

    private ChatLanguageModel mockModel;
    private QueryRewritingService service;

    @BeforeEach
    void setUp() {
        mockModel = Mockito.mock(ChatLanguageModel.class);
        service = new QueryRewritingService(mockModel);
    }

    @Test
    void testRewriteWithHistory() {
        when(mockModel.generate(anyString())).thenReturn("Làm sao để dùng OOP trong Java?");
        
        ChatMessage msg1 = new ChatMessage();
        msg1.setSender(Sender.USER);
        msg1.setContent("OOP là gì?");
        
        String result = service.rewriteQuery("Làm sao để dùng nó?", List.of(msg1));
        
        assertEquals("Làm sao để dùng OOP trong Java?", result);
        verify(mockModel, times(1)).generate(anyString());
    }

    @Test
    void testRewriteNoHistory() {
        String currentQuestion = "OOP là gì?";
        String result = service.rewriteQuery(currentQuestion, List.of());
        
        assertEquals(currentQuestion, result);
        verify(mockModel, never()).generate(anyString());
    }
}
