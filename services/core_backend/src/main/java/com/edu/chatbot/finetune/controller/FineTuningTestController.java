package com.edu.chatbot.finetune.controller;

import com.edu.chatbot.finetune.dto.FineTuneResultDTO;
import com.edu.chatbot.finetune.service.FineTuningService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/finetune/test")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class FineTuningTestController {

    private final FineTuningService fineTuningService;

    @PostMapping("/chat")
    public ResponseEntity<?> testChat(@RequestBody TestChatRequest request) {
        try {
            // Hardcode sessionId = 1 để test tạm
            FineTuneResultDTO result = fineTuningService.processFineTuning(
                    1L,
                    request.getQuestion(),
                    request.getCodeSnippet()
            );
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Chi tiết lỗi: " + e.getMessage() + (e.getCause() != null ? " - Cause: " + e.getCause().getMessage() : ""));
        }
    }

    @Data
    public static class TestChatRequest {
        private String question;
        private String codeSnippet;
    }
}
