package com.edu.chatbot.document.service;

import com.edu.chatbot.document.dto.EmbeddingResponseDTO;

import java.util.List;

public interface EmbeddingClient {
    EmbeddingResponseDTO getEmbeddings(List<String> chunks);
}
