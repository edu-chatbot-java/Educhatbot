package com.edu.chatbot.document.service.impl;

import com.edu.chatbot.document.dto.EmbeddingRequestDTO;
import com.edu.chatbot.document.dto.EmbeddingResponseDTO;
import com.edu.chatbot.document.service.EmbeddingClient;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;

@Service
@Profile("!mock")
public class EmbeddingClientImpl implements EmbeddingClient {

    private final WebClient webClient;

    public EmbeddingClientImpl(WebClient.Builder webClientBuilder,
            @Value("${embedding.api.url:http://localhost:8001/api/embed}") String apiUrl) {
        this.webClient = webClientBuilder.baseUrl(apiUrl).build();
    }

    @Override
    public EmbeddingResponseDTO getEmbeddings(List<String> chunks) {
        EmbeddingRequestDTO request = new EmbeddingRequestDTO(chunks);

        return webClient.post()
                .bodyValue(request)
                .retrieve()
                .bodyToMono(EmbeddingResponseDTO.class)
                .block(); // Đồng bộ trong luồng bất đồng bộ của Pipeline
    }
}
