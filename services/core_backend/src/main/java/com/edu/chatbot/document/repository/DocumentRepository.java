package com.edu.chatbot.document.repository;

import com.edu.chatbot.document.entity.Document;
import com.edu.chatbot.document.enums.DocumentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    @Query("""
                SELECT d FROM Document d
                WHERE (:subjectId IS NULL OR d.subjectId = :subjectId)
                  AND (:status IS NULL OR d.status = :status)
            """)
    Page<Document> findAllWithFilters(
            @Param("subjectId") Long subjectId,
            @Param("status") DocumentStatus status,
            Pageable pageable);

    boolean existsByFileHash(String fileHash);

    boolean existsByTitleAndSubjectId(String title, Long subjectId);
}
