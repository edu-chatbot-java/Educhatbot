package com.edu.chatbot.security.service;

import com.edu.chatbot.security.entity.AuditLog;
import com.edu.chatbot.security.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public void logAction(String action, String email, String details) {
        AuditLog log = AuditLog.builder()
                .action(action)
                .email(email)
                .details(details)
                .build();
        auditLogRepository.save(log);
    }
}
