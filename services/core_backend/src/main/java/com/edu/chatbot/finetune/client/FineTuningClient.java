package com.edu.chatbot.finetune.client;

import com.edu.chatbot.finetune.exception.FineTuneServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * HTTP Client gọi Ollama API trên GCP VM.
 */
@Slf4j
@Component
public class FineTuningClient {

    private final WebClient webClient;
    private final String modelId;

    public FineTuningClient(
            @Value("${finetune.service-url:http://10.178.0.3:11434}") String serviceUrl,
            @Value("${finetune.model.id:hf.co/neshaki/llama3.1-8b-java-chatbot-GGUF}") String modelId,
            WebClient.Builder builder) {
        
        this.modelId = modelId;

        reactor.netty.http.client.HttpClient httpClient = reactor.netty.http.client.HttpClient.create()
                .resolver(io.netty.resolver.DefaultAddressResolverGroup.INSTANCE);

        this.webClient = builder
                .clientConnector(new org.springframework.http.client.reactive.ReactorClientHttpConnector(httpClient))
                .baseUrl(serviceUrl)
                .defaultHeader("Content-Type", "application/json")
                .codecs(config -> config.defaultCodecs().maxInMemorySize(2 * 1024 * 1024)) // 2MB buffer
                .build();
    }

    /**
     * Gửi prompt tới Ollama API và nhận câu trả lời.
     *
     * @param prompt Prompt đã build sẵn theo Llama-3.1 chat template
     * @return Câu trả lời được sinh ra bởi model
     */
    public String generate(String prompt) {
        log.debug("Goi Ollama API | model: {}", modelId);

        Map<String, Object> request = new HashMap<>();
        request.put("model", modelId);
        request.put("prompt", prompt);
        request.put("stream", false);

        Map<String, Object> options = new HashMap<>();
        options.put("temperature", 0.7f);
        options.put("top_p", 0.9f);
        request.put("options", options);

        Map<String, Object> response = webClient.post()
                .uri("/api/generate")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .timeout(Duration.ofSeconds(120))
                .onErrorResume(e -> {
                    log.error("Ollama API that bai: {}", e.getMessage());
                    return Mono.error(new FineTuneServiceException(
                            "Mô hình Llama hiện không phản hồi. Vui lòng kiểm tra lại máy ảo GCP.", e));
                })
                .block();

        if (response == null || !response.containsKey("response")) {
            throw new FineTuneServiceException("Ollama không trả về kết quả hợp lệ.");
        }

        String answer = (String) response.get("response");
        log.debug("Ollama tra ve thanh cong | do dai: {} ky tu", answer.length());
        return answer.trim();
    }
}
