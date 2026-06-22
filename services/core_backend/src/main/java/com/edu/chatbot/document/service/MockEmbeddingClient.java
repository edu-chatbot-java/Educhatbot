package com.edu.chatbot.document.service;

import com.edu.chatbot.document.dto.EmbeddingResponseDTO;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@Profile("mock")
public class MockEmbeddingClient implements EmbeddingClient {
    
    @Override
    public EmbeddingResponseDTO getEmbeddings(List<String> chunks) {
        EmbeddingResponseDTO response = new EmbeddingResponseDTO();
        List<List<Float>> embeddings = new ArrayList<>();
        
        for (int i = 0; i < chunks.size(); i++) {
            List<Float> vector = new ArrayList<>();
            for (int j = 0; j < 768; j++) {
                vector.add((float) Math.random());
            }
            embeddings.add(vector);
        }
        
        response.setEmbeddings(embeddings);
        response.setDimension(768);
        response.setModel("mock-model");
        return response;
    }
}
