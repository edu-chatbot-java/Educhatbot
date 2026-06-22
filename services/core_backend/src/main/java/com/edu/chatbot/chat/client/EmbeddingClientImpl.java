package com.edu.chatbot.chat.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Service
@ConditionalOnProperty(name = "embedding.mock", havingValue = "false")
public class EmbeddingClientImpl implements EmbeddingClient {

    private final WebClient webClient;

    public EmbeddingClientImpl(WebClient.Builder webClientBuilder, 
                               @Value("${embedding.service-url}") String serviceUrl) {
        this.webClient = webClientBuilder.baseUrl(serviceUrl).build();
    }

    @Override
    @SuppressWarnings("unchecked")
    public List<Float> generateEmbedding(String text) {
        Map<String, Object> request = Map.of(
            "texts", List.of(text),
            "prefix", "query: "
        );

        Map<String, Object> response = webClient.post()
                .uri("/api/embed")
                .body(Mono.just(request), Map.class)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        if (response != null && response.containsKey("embeddings")) {
            List<List<Double>> embeddings = (List<List<Double>>) response.get("embeddings");
            if (!embeddings.isEmpty()) {
                List<Double> doubleList = embeddings.get(0);
                return doubleList.stream().map(Double::floatValue).toList();
            }
        }
        throw new RuntimeException("Failed to generate embedding from TV3 service");
    }
}
