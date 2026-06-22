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
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat/sessions")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    // Helper method to extract user ID from UserDetails
    private Long extractUserId(UserDetails userDetails) {
        // Fallback or mock implementation until TV2 finishes JWT
        if (userDetails == null || userDetails.getUsername() == null) {
            return 1L; // Mock user ID
        }
        try {
            return Long.parseLong(userDetails.getUsername());
        } catch (NumberFormatException e) {
            return 1L; // Default fallback
        }
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<SessionDTO>> createSession(
            @RequestBody @Valid CreateSessionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long userId = extractUserId(userDetails);
        SessionDTO sessionDTO = chatService.createSession(request.getSubjectId(), userId);
        return ResponseEntity.ok(ApiResponse.success(sessionDTO));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<SessionDTO>>> getUserSessions(
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long userId = extractUserId(userDetails);
        List<SessionDTO> sessions = chatService.getUserSessions(userId);
        return ResponseEntity.ok(ApiResponse.success(sessions));
    }

    @GetMapping("/{id}/messages")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<MessageDTO>>> getSessionHistory(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long userId = extractUserId(userDetails);
        List<MessageDTO> messages = chatService.getSessionHistory(id, userId);
        return ResponseEntity.ok(ApiResponse.success(messages));
    }

    @PostMapping("/{id}/messages")
    @PreAuthorize("hasAnyRole('STUDENT', 'ADMIN')")
    public ResponseEntity<ApiResponse<ChatResponseDTO>> sendMessage(
            @PathVariable Long id,
            @RequestBody @Valid ChatRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        Long userId = extractUserId(userDetails);
        // Đảm bảo sessionId trong payload khớp với URL
        request.setSessionId(id);
        
        ChatResponseDTO response = chatService.dispatch(request, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
