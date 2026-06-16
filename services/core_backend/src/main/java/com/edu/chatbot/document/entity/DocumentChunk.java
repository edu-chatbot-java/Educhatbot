package com.edu.chatbot.document.entity;

import com.edu.chatbot.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

@Entity
@Table(name = "document_chunks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentChunk extends BaseEntity {

    // Mock entity để TV4 có thể compile. TV3 sẽ hoàn thiện sau.
    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "chunk_index")
    private Integer chunkIndex;
}
