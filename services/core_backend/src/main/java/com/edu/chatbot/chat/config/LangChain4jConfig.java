package com.edu.chatbot.chat.config;

import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.openai.OpenAiChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class LangChain4jConfig {

    @Value("${llm.api-key}")
    private String llmApiKey;

    @Value("${llm.base-url}")
    private String llmBaseUrl;

    @Value("${llm.chat-model}")
    private String llmChatModel;

    @Value("${llm.max-tokens:2048}")
    private int llmMaxTokens;

    @Value("${groq.api-key}")
    private String groqApiKey;

    @Value("${groq.base-url}")
    private String groqBaseUrl;

    @Value("${groq.rewriting-model}")
    private String groqRewritingModel;

    @Value("${openrouter.api-key:}")
    private String openRouterApiKey;

    @Value("${openrouter.base-url:https://openrouter.ai/api/v1}")
    private String openRouterBaseUrl;

    @Value("${openrouter.eval-model:google/gemma-4-31b-it:free}")
    private String openRouterEvalModel;

    @Bean
    public ChatLanguageModel chatModel() {
        return OpenAiChatModel.builder()
                .apiKey(llmApiKey)
                .baseUrl(llmBaseUrl)
                .modelName(llmChatModel)
                .maxTokens(llmMaxTokens)
                .timeout(Duration.ofSeconds(60))
                .build();
    }

    @Bean
    public ChatLanguageModel rewritingModel() {
        return OpenAiChatModel.builder()
                .apiKey(groqApiKey)
                .baseUrl(groqBaseUrl)
                .modelName(groqRewritingModel)
                .maxTokens(1024)
                .timeout(Duration.ofSeconds(30))
                .build();
    }

    @Bean("evalModel")
    public ChatLanguageModel evalModel() {
        return OpenAiChatModel.builder()
                .apiKey(openRouterApiKey)
                .baseUrl(openRouterBaseUrl)
                .modelName(openRouterEvalModel)
                .maxTokens(1024)
                .timeout(Duration.ofSeconds(120)) // Auto Eval can be slow
                .build();
    }
}
