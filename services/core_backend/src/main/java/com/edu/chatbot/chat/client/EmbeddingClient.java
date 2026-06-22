package com.edu.chatbot.chat.client;

import java.util.List;

public interface EmbeddingClient {
    List<Float> generateEmbedding(String text);
}
