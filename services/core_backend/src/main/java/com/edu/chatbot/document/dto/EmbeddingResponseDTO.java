package com.edu.chatbot.document.dto;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
public class EmbeddingResponseDTO {
    private List<List<Float>> embeddings;
    private int dimension;
    private String model;
}
