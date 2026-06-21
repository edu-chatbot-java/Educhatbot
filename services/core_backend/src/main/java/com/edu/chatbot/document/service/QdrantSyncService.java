package com.edu.chatbot.document.service;

import com.edu.chatbot.document.entity.Document;
import com.edu.chatbot.document.entity.DocumentChunk;

import java.util.List;

public interface QdrantSyncService {
    void upsertChunks(Document document, List<DocumentChunk> chunks);
    void deleteByDocumentId(Long documentId);
}
