package com.edu.chatbot.finetune.client;

import com.edu.chatbot.finetune.dto.FineTuneRequest;
import com.edu.chatbot.finetune.dto.FineTuneResponse;
import com.edu.chatbot.finetune.exception.FineTuneServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;
import java.util.List;

/**
 * HTTP Client gọi Hugging Face Inference API.
 *
 * Endpoint: POST https://api-inference.huggingface.co/models/{modelId}
 *
 * Xử lý:
 * - Timeout 90s (HF cold-start có thể mất 20-60s sau thời gian idle)
 * - Retry tối đa 3 lần với backoff 10s khi gặp lỗi 503 (model đang khởi động)
 * - Ném FineTuneServiceException (RuntimeException) để GlobalExceptionHandler
 * bắt
 */
@Slf4j
@Component
public class FineTuningClient {

        private final WebClient webClient;
        private final String modelId;

        public FineTuningClient(
                        @Value("${huggingface.api.token}") String hfToken,
                        @Value("${huggingface.model.id}") String modelId,
                        WebClient.Builder builder) {
                this.modelId = modelId;

                // Sửa lỗi "Failed to resolve api-inference.huggingface.co" của Netty trên
                // Windows
                reactor.netty.http.client.HttpClient httpClient = reactor.netty.http.client.HttpClient.create()
                                .resolver(io.netty.resolver.DefaultAddressResolverGroup.INSTANCE);

                this.webClient = builder
                                .clientConnector(
                                                new org.springframework.http.client.reactive.ReactorClientHttpConnector(
                                                                httpClient))
                                .baseUrl("https://router.huggingface.co/hf-inference")
                                .defaultHeader("Authorization", "Bearer " + hfToken)
                                .defaultHeader("Content-Type", "application/json")
                                .codecs(config -> config.defaultCodecs().maxInMemorySize(2 * 1024 * 1024)) // 2MB buffer
                                .build();
        }

        /**
         * Gửi prompt tới HF Inference API và nhận câu trả lời.
         *
         * @param prompt Prompt đã build sẵn theo Llama-3.1 chat template
         * @return Câu trả lời được sinh ra bởi model
         */
        public String generate(String prompt) {
                log.debug("Goi HF Inference API | model: {}", modelId);

                FineTuneRequest request = FineTuneRequest.builder()
                                .inputs(prompt)
                                .parameters(FineTuneRequest.Parameters.builder()
                                                .maxNewTokens(512)
                                                .temperature(0.7f)
                                                .doSample(true)
                                                .returnFullText(false) // Chỉ trả phần sinh ra, không lặp lại prompt
                                                .topP(0.9f)
                                                .repetitionPenalty(1.15f) // Chống lặp từ (duoc duoc duoc...)
                                                .build())
                                .build();

                List<FineTuneResponse> responses = webClient.post()
                                .uri("/models/" + modelId)
                                .bodyValue(request)
                                .retrieve()
                                // Chuyển HTTP error sang exception để retryWhen xử lý
                                .onStatus(
                                                status -> status == HttpStatus.SERVICE_UNAVAILABLE,
                                                response -> Mono.error(new WebClientResponseException(
                                                                503, "Service Unavailable", null, null, null)))
                                .bodyToMono(new ParameterizedTypeReference<List<FineTuneResponse>>() {
                                })
                                .timeout(Duration.ofSeconds(90))
                                // Retry khi gặp 503 (HF cold-start): tối đa 3 lần, backoff 10s
                                .retryWhen(Retry.backoff(3, Duration.ofSeconds(10))
                                                .filter(e -> e instanceof WebClientResponseException &&
                                                                ((WebClientResponseException) e)
                                                                                .getStatusCode() == HttpStatus.SERVICE_UNAVAILABLE)
                                                .doBeforeRetry(signal -> log.warn(
                                                                "HF model dang cold-start (503), thu lai lan {}...",
                                                                signal.totalRetries() + 1)))
                                .onErrorResume(FineTuneServiceException.class, Mono::error) // Không wrap lại nếu đã là
                                                                                            // FineTuneServiceException
                                .onErrorResume(e -> {
                                        log.error("HF Inference API that bai sau khi retry: {}", e.getMessage());
                                        return Mono.error(new FineTuneServiceException(
                                                        "Mô hình Fine-tuning hiện không phản hồi. Vui lòng thử lại sau vài giây.",
                                                        e));
                                })
                                .block();

                if (responses == null || responses.isEmpty() || responses.get(0).getGeneratedText() == null) {
                        throw new FineTuneServiceException("Hugging Face không trả về kết quả. Vui lòng thử lại.");
                }

                String answer = responses.get(0).getGeneratedText().trim();
                log.debug("HF Inference thanh cong | do dai: {} ky tu", answer.length());
                return answer;
        }
}
