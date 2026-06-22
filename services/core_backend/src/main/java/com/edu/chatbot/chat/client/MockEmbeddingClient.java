package com.edu.chatbot.chat.client;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

@Service
@ConditionalOnProperty(name = "embedding.mock", havingValue = "true", matchIfMissing = true)
public class MockEmbeddingClient implements EmbeddingClient {

    @Override
    public List<Float> generateEmbedding(String text) {
        // Trả về mảng 384 chiều ngẫu nhiên để test
        Random random = new Random();
        List<Float> embedding = new ArrayList<>(384);
        for (int i = 0; i < 384; i++) {
            embedding.add(random.nextFloat());
        }
        return embedding;
    }
}
