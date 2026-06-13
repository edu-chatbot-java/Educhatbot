package com.edu.chatbot.analytics.domain;

import com.edu.chatbot.common.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "evaluation_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluationResult extends BaseEntity {

    @Column(name = "approach", nullable = false)
    private String approach;

    @Column(name = "question", columnDefinition = "TEXT")
    private String question;

    @Column(name = "generated_answer", columnDefinition = "TEXT")
    private String generatedAnswer;

    @Column(name = "ground_truth", columnDefinition = "TEXT")
    private String groundTruth;

    @Column(name = "faithfulness_score")
    private Float faithfulnessScore;

    @Column(name = "relevancy_score")
    private Float relevancyScore;

    @Column(name = "recall_at_k")
    private Float recallAtK;

    @Column(name = "precision_at_k")
    private Float precisionAtK;

    @Column(name = "k_value")
    private Integer kValue;

    @Column(name = "latency_ms")
    private Long latencyMs;
}