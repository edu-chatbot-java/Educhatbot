package com.edu.chatbot.document.repository;

import com.edu.chatbot.document.entity.DocumentChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DocumentChunkRepository extends JpaRepository<DocumentChunk, Long> {

    @Query("SELECT COUNT(c) FROM DocumentChunk c WHERE c.document.id = :documentId")
    long countChunksByDocumentId(@Param("documentId") Long documentId);

    void deleteByDocumentId(Long documentId);
}
