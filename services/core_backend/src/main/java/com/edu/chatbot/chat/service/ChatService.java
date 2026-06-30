package com.edu.chatbot.chat.service;

import com.edu.chatbot.chat.dto.request.ChatRequest;
import com.edu.chatbot.chat.dto.response.ChatResponseDTO;
import com.edu.chatbot.chat.dto.response.MessageDTO;
import com.edu.chatbot.chat.dto.response.SessionDTO;

import java.util.List;

public interface ChatService {
    SessionDTO createSession(Long subjectId, Long userId);
    List<SessionDTO> getUserSessions(Long userId);
    List<MessageDTO> getSessionHistory(Long sessionId, Long userId);

    ChatResponseDTO processRAGMessage(ChatRequest request, Long userId);
    ChatResponseDTO processFineTuneMessage(ChatRequest request, Long userId);
    ChatResponseDTO dispatch(ChatRequest request, Long userId);
    void rateMessage(Long messageId, Integer rating, String feedbackType);
}
