package com.edu.chatbot.finetune.client;

import com.edu.chatbot.finetune.dto.FineTuneRequest;
import com.edu.chatbot.finetune.dto.FineTuneResponse;
import com.edu.chatbot.finetune.exception.FineTuneServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;

/**
 * HTTP Client gọi Modal.com Inference Service.
 *
 * Endpoint: POST {modalApiUrl}/generate
 *
 * Xử lý:
 * - Timeout 90s (Modal serverless cold-start có thể mất 15-30s sau thời gian idle)
 * - Retry tối đa 3 lần với backoff 10s khi gặp lỗi 503 hoặc các lỗi dịch vụ tạm thời
 * - Ném FineTuneServiceException (RuntimeException) để GlobalExceptionHandler bắt
 */
@Slf4j
@Component
public class FineTuningClient {

        private final WebClient webClient;
        private final String modalApiUrl;

        public FineTuningClient(
                        @Value("${modal.api.url}") String modalApiUrl,
                        WebClient.Builder builder) {
                this.modalApiUrl = modalApiUrl;

                // Sửa lỗi "Failed to resolve host" của Netty trên Windows
                reactor.netty.http.client.HttpClient httpClient = reactor.netty.http.client.HttpClient.create()
                                .resolver(io.netty.resolver.DefaultAddressResolverGroup.INSTANCE);

                // Di chuyển từ HF sang Modal.com Inference
                this.webClient = builder
                                .clientConnector(
                                                new org.springframework.http.client.reactive.ReactorClientHttpConnector(
                                                                httpClient))
                                .baseUrl(modalApiUrl)
                                .defaultHeader("Content-Type", "application/json")
                                .codecs(config -> config.defaultCodecs().maxInMemorySize(2 * 1024 * 1024)) // 2MB buffer
                                .build();
        }

        /**
         * Gửi prompt tới Modal.com deployed service và nhận câu trả lời.
         *
         * @param prompt Prompt đã build sẵn theo chat template
         * @return Câu trả lời được sinh ra bởi model
         */
        public String generate(String prompt) {
                log.debug("Goi Modal Inference API | URL: {}", modalApiUrl);

                FineTuneRequest request = FineTuneRequest.builder()
                                .prompt(prompt)
                                .maxNewTokens(512)
                                .temperature(0.7f)
                                .build();

                FineTuneResponse response = webClient.post()
                                .uri("/generate")
                                .bodyValue(request)
                                .retrieve()
                                // Chuyển HTTP error sang exception để retryWhen xử lý
                                .onStatus(
                                                status -> status == HttpStatus.SERVICE_UNAVAILABLE,
                                                clientResponse -> Mono.error(new WebClientResponseException(
                                                                503, "Service Unavailable", null, null, null)))
                                .bodyToMono(FineTuneResponse.class)
                                .timeout(Duration.ofSeconds(90))
                                // Retry khi gặp 503 (Modal cold-start): tối đa 3 lần, backoff 10s
                                .retryWhen(Retry.backoff(3, Duration.ofSeconds(10))
                                                .filter(e -> e instanceof WebClientResponseException &&
                                                                ((WebClientResponseException) e)
                                                                                 .getStatusCode() == HttpStatus.SERVICE_UNAVAILABLE)
                                                .doBeforeRetry(signal -> log.warn(
                                                                "Modal model dang cold-start (503), thu lai lan {}...",
                                                                signal.totalRetries() + 1)))
                                .onErrorResume(FineTuneServiceException.class, Mono::error)
                                .onErrorResume(e -> {
                                        log.error("Modal Inference API that bai sau khi retry: {}", e.getMessage());
                                        return Mono.error(new FineTuneServiceException(
                                                         "Mô hình Fine-tuning hiện không phản hồi. Vui lòng thử lại sau vài giây.",
                                                         e));
                                })
                                .block();

                if (response == null || response.getAnswer() == null) {
                        throw new FineTuneServiceException("Modal inference không trả về kết quả. Vui lòng thử lại.");
                }

                String answer = response.getAnswer().trim();
                log.debug("Modal Inference thanh cong | do dai: {} ky tu", answer.length());
                return answer;
        }
}
