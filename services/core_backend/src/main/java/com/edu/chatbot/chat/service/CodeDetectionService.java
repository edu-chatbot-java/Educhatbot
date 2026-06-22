package com.edu.chatbot.chat.service;

import lombok.Builder;
import lombok.Data;
import org.springframework.stereotype.Service;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class CodeDetectionService {

    @Data
    @Builder
    public static class CodeDetectionResult {
        private boolean hasCode;
        private String codeSnippet;
        private String naturalLanguageQuestion;
    }

    private static final Pattern MARKDOWN_CODE_PATTERN = Pattern.compile("```(?:\\w+)?\\s*(.*?)\\s*```", Pattern.DOTALL);

    public CodeDetectionResult detect(String message) {
        if (message == null || message.trim().isEmpty()) {
            return CodeDetectionResult.builder()
                    .hasCode(false)
                    .naturalLanguageQuestion(message)
                    .build();
        }

        Matcher matcher = MARKDOWN_CODE_PATTERN.matcher(message);
        if (matcher.find()) {
            String codeSnippet = matcher.group(1).trim();
            String naturalLanguageQuestion = message.replace(matcher.group(0), "").trim();
            return CodeDetectionResult.builder()
                    .hasCode(true)
                    .codeSnippet(codeSnippet)
                    .naturalLanguageQuestion(naturalLanguageQuestion)
                    .build();
        }

        // Heuristics based detection
        String[] keywords = {"public class ", "public void ", "import java.", "def ", "#include"};
        for (String keyword : keywords) {
            if (message.contains(keyword)) {
                return CodeDetectionResult.builder()
                        .hasCode(true)
                        .codeSnippet(message)
                        .naturalLanguageQuestion(message) // Entire message is code for simplicity in heuristic
                        .build();
            }
        }

        return CodeDetectionResult.builder()
                .hasCode(false)
                .naturalLanguageQuestion(message)
                .build();
    }
}
