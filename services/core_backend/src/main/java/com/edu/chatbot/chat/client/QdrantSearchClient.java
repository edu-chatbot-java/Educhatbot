package com.edu.chatbot.chat.client;

import com.edu.chatbot.common.dto.QdrantPayloadDTO;
import io.qdrant.client.QdrantClient;
import io.qdrant.client.grpc.Points.Filter;
import io.qdrant.client.grpc.Points.Condition;
import io.qdrant.client.grpc.Points.FieldCondition;
import io.qdrant.client.grpc.Points.Match;
import io.qdrant.client.grpc.Points.SearchPoints;
import io.qdrant.client.grpc.Points.ScoredPoint;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class QdrantSearchClient {

    private final QdrantClient qdrantClient;
    private final String collectionName;
    private final int topK;

    public QdrantSearchClient(QdrantClient qdrantClient,
                              @Value("${qdrant.collection-name}") String collectionName,
                              @Value("${rag.top-k}") int topK) {
        this.qdrantClient = qdrantClient;
        this.collectionName = collectionName;
        this.topK = topK;
    }

    public List<QdrantPayloadDTO> searchByVectorAndSubject(List<Float> vector, Long subjectId) {
        try {
            // Build filter by subjectId
            Filter filter = Filter.newBuilder()
                    .addMust(Condition.newBuilder()
                            .setField(FieldCondition.newBuilder()
                                    .setKey("subjectId")
                                    .setMatch(Match.newBuilder().setInteger(subjectId).build())
                                    .build())
                            .build())
                    .build();

            SearchPoints searchPoints = SearchPoints.newBuilder()
                    .setCollectionName(collectionName)
                    .addAllVector(vector)
                    .setFilter(filter)
                    .setLimit(topK)
                    .setWithPayload(io.qdrant.client.grpc.Points.WithPayloadSelector.newBuilder().setEnable(true).build())
                    .build();

            List<ScoredPoint> searchResult = qdrantClient.searchAsync(searchPoints).get();

            return searchResult.stream()
                    .map(this::parsePayload)
                    .collect(Collectors.toList());

        } catch (Exception e) {
            throw new RuntimeException("Error searching Qdrant", e);
        }
    }

    private QdrantPayloadDTO parsePayload(ScoredPoint point) {
        Map<String, io.qdrant.client.grpc.JsonWithInt.Value> payload = point.getPayloadMap();
        
        Long chunkId = payload.containsKey("chunkId") ? payload.get("chunkId").getIntegerValue() : null;
        Long subId = payload.containsKey("subjectId") ? payload.get("subjectId").getIntegerValue() : null;
        String content = payload.containsKey("content") ? payload.get("content").getStringValue() : "";
        
        return QdrantPayloadDTO.builder()
                .chunkId(chunkId)
                .subjectId(subId)
                .content(content)
                .build();
    }
}
