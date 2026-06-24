package com.edu.chatbot.document.config;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Collections.PayloadSchemaType;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class QdrantCollectionInitializer {

    private final QdrantClient qdrantClient;
    private static final String COLLECTION_NAME = "edu_documents";

    @PostConstruct
    public void initCollection() {
        try {
            boolean exists = qdrantClient.collectionExistsAsync(COLLECTION_NAME).get();
            if (!exists) {
                qdrantClient.createCollectionAsync(
                        COLLECTION_NAME,
                        VectorParams.newBuilder().setDistance(Distance.Cosine).setSize(384).build()
                ).get();
                log.info("Initialized Qdrant collection: {}", COLLECTION_NAME);
                
                // Đánh index cho trường subject_id để cho phép lọc (filter)
                qdrantClient.createPayloadIndexAsync(
                        COLLECTION_NAME,
                        "subject_id",
                        PayloadSchemaType.Integer,
                        null,
                        null,
                        null,
                        null
                ).get();
                log.info("Created Payload Index for subject_id on collection: {}", COLLECTION_NAME);
            }
        } catch (Exception e) {
            log.warn("Notice: Cannot connect to Qdrant ({}). Ensure Qdrant is running if you want vector synchronization.", e.getMessage());
        }
    }
}
