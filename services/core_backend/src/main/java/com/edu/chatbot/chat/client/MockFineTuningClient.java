package com.edu.chatbot.chat.client;

import org.springframework.stereotype.Service;

@Service
public class MockFineTuningClient implements FineTuningClient {

    @Override
    public String generateResponse(String prompt) {
        try {
            Thread.sleep(1000); // Giả lập độ trễ
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        return "Đây là câu trả lời Mock từ Fine-tuned model (TV5 chưa code). Prompt nhận được: " + prompt;
    }
}
