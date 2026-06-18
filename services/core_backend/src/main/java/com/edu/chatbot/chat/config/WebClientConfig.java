package com.edu.chatbot.chat.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    @Value("${embedding.service-url:http://localhost:8001}")
    private String embeddingServiceUrl;

    @Value("${finetune.service-url:http://localhost:8000}")
    private String finetuneServiceUrl;

    @Bean
    public WebClient embeddingWebClient() {
        return WebClient.builder()
                .baseUrl(embeddingServiceUrl)
                .build();
    }

    @Bean
    public WebClient finetuningWebClient() {
        return WebClient.builder()
                .baseUrl(finetuneServiceUrl)
                .build();
    }
}
