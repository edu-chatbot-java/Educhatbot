package com.edu.chatbot.finetune.exception;

/**
 * Exception nghiệp vụ cho luồng Fine-tuning.
 * Được ném khi HF Inference API không phản hồi hoặc trả về lỗi.
 * GlobalExceptionHandler sẽ tự động bắt và trả về HTTP 503.
 */
public class FineTuneServiceException extends RuntimeException {

    public FineTuneServiceException(String message) {
        super(message);
    }

    public FineTuneServiceException(String message, Throwable cause) {
        super(message, cause);
    }
}
