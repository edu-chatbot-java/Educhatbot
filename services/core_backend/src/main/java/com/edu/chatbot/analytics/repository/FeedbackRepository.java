package com.edu.chatbot.analytics.repository;

import com.edu.chatbot.analytics.domain.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    // Đếm số lượt chiến thắng trong Blind Test của RAG hoặc Fine-tune
    @Query("SELECT COUNT(f) FROM Feedback f WHERE f.blindTestWinner = :approach")
    Long countBlindTestWinsByApproach(String approach);

    // Tính điểm đánh giá (sao) trung bình
    @Query("SELECT AVG(f.rating) FROM Feedback f WHERE f.rating IS NOT NULL")
    Double getAverageRating();
}