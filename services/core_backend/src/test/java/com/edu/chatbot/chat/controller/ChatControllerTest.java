package com.edu.chatbot.chat.controller;

import com.edu.chatbot.chat.dto.request.CreateSessionRequest;
import com.edu.chatbot.chat.dto.response.SessionDTO;
import com.edu.chatbot.chat.service.ChatService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ChatControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ChatService chatService;

    @InjectMocks
    private ChatController chatController;

    private ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        HandlerMethodArgumentResolver principalResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.getParameterType().isAssignableFrom(UserDetails.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                          NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return new org.springframework.security.core.userdetails.User("1", "password", java.util.Collections.emptyList());
            }
        };

        mockMvc = MockMvcBuilders.standaloneSetup(chatController)
                .setCustomArgumentResolvers(principalResolver)
                .build();
    }

    @Test
    void testCreateSession() throws Exception {
        CreateSessionRequest req = new CreateSessionRequest();
        req.setSubjectId(10L);

        SessionDTO mockSession = SessionDTO.builder()
                .id(1L)
                .title("New Chat")
                .subjectId(10L)
                .build();

        // Using mock user ID 1L as per the fallback logic
        when(chatService.createSession(anyLong(), anyLong())).thenReturn(mockSession);

        mockMvc.perform(post("/api/chat/sessions")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(1))
                .andExpect(jsonPath("$.data.subjectId").value(10));
    }
}
