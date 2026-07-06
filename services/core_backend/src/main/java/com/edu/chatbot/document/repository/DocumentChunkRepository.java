package com.edu.chatbot.document.repository;

import com.edu.chatbot.document.entity.DocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, Long> {

    @Query("SELECT COUNT(c) FROM DocumentChunk c WHERE c.document.id = :documentId")
    long countChunksByDocumentId(@Param("documentId") Long documentId);

    void deleteByDocumentId(Long documentId);

    // Lấy danh sách Chunk dựa trên các IDs do Qdrant trả về
    List<DocumentChunk> findByIdIn(List<Long> ids);
}
