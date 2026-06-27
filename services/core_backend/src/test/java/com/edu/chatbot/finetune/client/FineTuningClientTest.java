package com.edu.chatbot.finetune.client;

import com.edu.chatbot.finetune.dto.FineTuneResponse;
import com.edu.chatbot.finetune.exception.FineTuneServiceException;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.mockwebserver.MockResponse;
import okhttp3.mockwebserver.MockWebServer;
import okhttp3.mockwebserver.RecordedRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;

public class FineTuningClientTest {

    private MockWebServer mockWebServer;
    private FineTuningClient fineTuningClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() throws IOException {
        mockWebServer = new MockWebServer();
        mockWebServer.start();

        String baseUrl = mockWebServer.url("").toString();
        WebClient.Builder builder = WebClient.builder();
        
        fineTuningClient = new FineTuningClient(baseUrl, builder);
    }

    @AfterEach
    void tearDown() throws IOException {
        mockWebServer.shutdown();
    }

    @Test
    void generate_Success() throws Exception {
        FineTuneResponse mockResponse = new FineTuneResponse();
        mockResponse.setAnswer("Đây là câu trả lời được sinh ra từ Modal");
        mockResponse.setLatencyMs(100L);

        mockWebServer.enqueue(new MockResponse()
                .setResponseCode(200)
                .setHeader("Content-Type", "application/json")
                .setBody(objectMapper.writeValueAsString(mockResponse)));

        String answer = fineTuningClient.generate("Hãy trả lời câu hỏi");

        assertEquals("Đây là câu trả lời được sinh ra từ Modal", answer);

        RecordedRequest recordedRequest = mockWebServer.takeRequest();
        assertEquals("/generate", recordedRequest.getPath());
        assertEquals("POST", recordedRequest.getMethod());
    }
}
