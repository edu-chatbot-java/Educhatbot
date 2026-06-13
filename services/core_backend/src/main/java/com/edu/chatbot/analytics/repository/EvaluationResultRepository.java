package com.edu.chatbot.analytics.repository;

import com.edu.chatbot.analytics.domain.EvaluationResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface EvaluationResultRepository extends JpaRepository<EvaluationResult, Long> {
    
    // Ví dụ: Hàm tính Latency trung bình theo phương pháp (RAG hoặc FINETUNE)
    @Query("SELECT AVG(e.latencyMs) FROM EvaluationResult e WHERE e.approach = :approach")
    Double getAverageLatencyByApproach(String approach);
    
    // Ví dụ: Hàm tính điểm Faithfulness trung bình
    @Query("SELECT AVG(e.faithfulnessScore) FROM EvaluationResult e WHERE e.approach = :approach")
    Double getAverageFaithfulnessByApproach(String approach);
}