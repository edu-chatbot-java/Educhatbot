package com.edu.chatbot.chat.controller;

import com.edu.chatbot.chat.dto.request.ChatRequest;
import com.edu.chatbot.chat.dto.request.CreateSessionRequest;
import com.edu.chatbot.chat.dto.response.ChatResponseDTO;
import com.edu.chatbot.chat.dto.response.MessageDTO;
import com.edu.chatbot.chat.dto.response.SessionDTO;
import com.edu.chatbot.chat.service.ChatService;
import com.edu.chatbot.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat/sessions")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    // Helper method to extract user ID from User entity
    private Long extractUserId(com.edu.chatbot.security.entity.User user) {
        if (user == null || user.getId() == null) {
            return 1L; // Fallback
        }
        return user.getId();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<SessionDTO>> createSession(
            @RequestBody @Valid CreateSessionRequest request,
            @AuthenticationPrincipal com.edu.chatbot.security.entity.User user) {
        
        Long userId = extractUserId(user);
        SessionDTO sessionDTO = chatService.createSession(request.getSubjectId(), userId);
        return ResponseEntity.ok(ApiResponse.success(sessionDTO));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<SessionDTO>>> getUserSessions(
            @AuthenticationPrincipal com.edu.chatbot.security.entity.User user) {
        
        Long userId = extractUserId(user);
        List<SessionDTO> sessions = chatService.getUserSessions(userId);
        return ResponseEntity.ok(ApiResponse.success(sessions));
    }

    @GetMapping("/{id}/messages")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<MessageDTO>>> getSessionHistory(
            @PathVariable Long id,
            @AuthenticationPrincipal com.edu.chatbot.security.entity.User user) {
        
        Long userId = extractUserId(user);
        List<MessageDTO> messages = chatService.getSessionHistory(id, userId);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @PostMapping("/{id}/messages")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<ChatResponseDTO>> sendMessage(
            @PathVariable Long id,
            @RequestBody @Valid ChatRequest request,
            @AuthenticationPrincipal com.edu.chatbot.security.entity.User user) {
        
        Long userId = extractUserId(user);
        // Đảm bảo sessionId trong payload khớp với URL
        request.setSessionId(id);
        
        ChatResponseDTO response = chatService.dispatch(request, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/messages/{messageId}/rating")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<String>> rateMessage(
            @PathVariable Long messageId,
            @RequestBody @Valid com.edu.chatbot.chat.dto.request.RatingRequest request) {
        
        chatService.rateMessage(messageId, request.getRating(), request.getFeedbackType());
        return ResponseEntity.ok(ApiResponse.success("Message rated successfully."));
    }
}
