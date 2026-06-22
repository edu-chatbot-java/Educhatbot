package com.edu.chatbot.chat.service;

import com.edu.chatbot.chat.entity.ChatMessage;
import dev.langchain4j.model.chat.ChatLanguageModel;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class QueryRewritingService {

    private final ChatLanguageModel rewritingModel;

    public QueryRewritingService(@Qualifier("rewritingModel") ChatLanguageModel rewritingModel) {
        this.rewritingModel = rewritingModel;
    }

    public String rewriteQuery(String currentQuestion, List<ChatMessage> history) {
        if (history == null || history.isEmpty()) {
            return currentQuestion;
        }

        String historyText = history.stream()
                .map(msg -> msg.getSender() + ": " + msg.getContent())
                .collect(Collectors.joining("\n"));

        String prompt = String.format(
            "Bạn là một trợ lý học thuật. Dựa vào lịch sử hội thoại dưới đây, \n" +
            "hãy viết lại câu hỏi cuối cùng thành một câu hoàn chỉnh, rõ ràng, \n" +
            "đầy đủ ngữ nghĩa mà không cần lịch sử để hiểu được.\n" +
            "Chỉ trả về câu hỏi đã viết lại, không giải thích.\n\n" +
            "Lịch sử:\n%s\n\nCâu hỏi gốc: %s\nCâu hỏi đã viết lại:",
            historyText, currentQuestion
        );

        return rewritingModel.generate(prompt).trim();
    }
}
