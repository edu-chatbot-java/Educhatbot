package com.edu.chatbot.document.service;

import com.edu.chatbot.document.entity.Document;
import com.edu.chatbot.document.entity.DocumentChunk;
import com.edu.chatbot.document.enums.DocumentStatus;
import com.edu.chatbot.document.repository.DocumentChunkRepository;
import com.edu.chatbot.document.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.FileInputStream;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentProcessingPipeline {

    private final TextParserService textParserService;
    private final TextChunkerService textChunkerService;
    private final DocumentRepository documentRepository;
    private final DocumentChunkRepository documentChunkRepository;
    private final QdrantSyncService qdrantSyncService;

    @Async("documentTaskExecutor")
    @Transactional
    public void processDocument(Long documentId) {
        log.info("Starting processing for document id={}", documentId);

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found with id=" + documentId));

        try {
            // Bước 1: Parse Text
            File file = Paths.get(document.getFilePath()).toFile();

            String parsedText;
            try (FileInputStream fis = new FileInputStream(file)) {
                parsedText = textParserService.parseText(fis, document.getFileType());
            }

            // Bước 2: Chunker
            List<String> rawChunks = textChunkerService.chunkText(parsedText);

            // Bước 3: Lưu Chunks vào Supabase
            List<DocumentChunk> savedChunks = new ArrayList<>();
            for (int i = 0; i < rawChunks.size(); i++) {
                DocumentChunk chunk = new DocumentChunk();
                chunk.setDocument(document);
                chunk.setContent(rawChunks.get(i));
                chunk.setChunkIndex(i);
                savedChunks.add(documentChunkRepository.save(chunk));
            }

            // Bước 4: Gọi Python Embedding & Upsert Qdrant
            // Phần này sẽ được gọi bên trong QdrantSyncService (nó gọi EmbeddingClient rồi
            // upsert)
            qdrantSyncService.upsertChunks(document, savedChunks);

            // Bước 5: Cập nhật READY
            document.setStatus(DocumentStatus.READY);
            documentRepository.save(document);
            log.info("Successfully processed document id={}", documentId);

        } catch (Exception e) {
            log.error("Error processing document id={}", documentId, e);
            document.setStatus(DocumentStatus.ERROR);
            documentRepository.save(document);
        }
    }
}
