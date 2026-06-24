package com.edu.chatbot.document.service.impl;

import com.edu.chatbot.document.dto.EmbeddingResponseDTO;
import com.edu.chatbot.document.entity.Document;
import com.edu.chatbot.document.entity.DocumentChunk;
import com.edu.chatbot.document.service.EmbeddingClient;
import com.edu.chatbot.document.service.QdrantSyncService;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.grpc.Points;
import io.qdrant.client.grpc.Points.PointId;
import io.qdrant.client.grpc.Points.PointStruct;
import io.qdrant.client.grpc.Points.Vectors;
import io.qdrant.client.grpc.Points.Filter;
import io.qdrant.client.grpc.Points.Condition;
import io.qdrant.client.grpc.Points.FieldCondition;
import io.qdrant.client.grpc.Points.Match;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import static io.qdrant.client.ValueFactory.value;

@Slf4j
@Service
@RequiredArgsConstructor
public class QdrantSyncServiceImpl implements QdrantSyncService {

    private final QdrantClient qdrantClient;
    private final EmbeddingClient embeddingClient;
    private static final String COLLECTION_NAME = "edu_documents";

    @Override
    public void upsertChunks(Document document, List<DocumentChunk> chunks) {
        if (chunks == null || chunks.isEmpty())
            return;

        List<String> texts = chunks.stream().map(DocumentChunk::getContent).collect(Collectors.toList());

        // Gọi API Embedding
        EmbeddingResponseDTO embedResponse = embeddingClient.getEmbeddings(texts);

        List<PointStruct> points = new ArrayList<>();
        for (int i = 0; i < chunks.size(); i++) {
            DocumentChunk chunk = chunks.get(i);
            List<Float> vectorData = embedResponse.getEmbeddings().get(i);

            Points.Vector vector = Points.Vector.newBuilder()
                    .addAllData(vectorData)
                    .build();

            PointStruct point = PointStruct.newBuilder()
                    .setId(PointId.newBuilder().setNum(chunk.getId()).build())
                    .setVectors(Vectors.newBuilder().setVector(vector).build())
                    .putPayload("document_id", value(document.getId()))
                    .putPayload("subject_id", value(document.getSubjectId()))
                    .putPayload("chunk_id", value(chunk.getId()))
                    .putPayload("chunk_index", value(chunk.getChunkIndex()))
                    .putPayload("content", value(chunk.getContent()))
                    .build();
            points.add(point);
        }

        try {
            qdrantClient.upsertAsync(COLLECTION_NAME, points).get();
            log.info("Synced {} chunks to Qdrant for document id={}", points.size(), document.getId());
        } catch (Exception e) {
            log.error("Error syncing to Qdrant", e);
            throw new RuntimeException("Qdrant upsert error", e);
        }
    }

    @Override
    public void deleteByDocumentId(Long documentId) {
        try {
            Filter filter = Filter.newBuilder()
                    .addMust(Condition.newBuilder()
                            .setField(FieldCondition.newBuilder()
                                    .setKey("document_id")
                                    .setMatch(Match.newBuilder().setInteger(documentId).build())
                                    .build())
                            .build())
                    .build();

            qdrantClient.deleteAsync(COLLECTION_NAME, filter).get();
            log.info("Deleted points for document_id={} from Qdrant", documentId);
        } catch (Exception e) {
            log.error("Error deleting points from Qdrant", e);
        }
    }
}
