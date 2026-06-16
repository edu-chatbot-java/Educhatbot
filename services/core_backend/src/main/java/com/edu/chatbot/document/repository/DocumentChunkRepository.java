package com.edu.chatbot.document.repository;

import com.edu.chatbot.document.entity.DocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, Long> {
    
    // Lấy danh sách Chunk dựa trên các IDs do Qdrant trả về
    List<DocumentChunk> findByIdIn(List<Long> ids);
}
