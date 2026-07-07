package com.edu.chatbot.security.config;

import com.edu.chatbot.security.entity.User;
import com.edu.chatbot.security.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
public class AuditLogInterceptor implements HandlerInterceptor {

    private final AuditLogService auditLogService;

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) throws Exception {
        int status = response.getStatus();
        // Chỉ ghi log cho các request thành công (2xx)
        if (status >= 200 && status < 300) {
            String method = request.getMethod();
            String uri = request.getRequestURI();
            
            // Lấy email người thực hiện từ context Spring Security
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String email = "anonymous";
            if (authentication != null && authentication.getPrincipal() instanceof User) {
                User user = (User) authentication.getPrincipal();
                email = user.getEmail();
            } else if (authentication != null && authentication.getName() != null) {
                email = authentication.getName();
            }

            String action = null;
            String details = null;

            // Xử lý ghi nhận log cho phân hệ tài liệu (documents)
            if (uri.startsWith("/api/documents")) {
                if ("POST".equalsIgnoreCase(method)) {
                    if (uri.endsWith("/reprocess")) {
                        action = "ADMIN_ACTION";
                        details = "Xử lý lại (reprocess) tài liệu qua URI: " + uri;
                    } else {
                        action = "UPLOAD";
                        details = "Tải lên tài liệu mới thành công";
                    }
                } else if ("DELETE".equalsIgnoreCase(method)) {
                    action = "ADMIN_ACTION";
                    details = "Xóa tài liệu thành công: " + uri;
                }
            } 
            // Xử lý ghi nhận log cho các thao tác quản lý môn học
            else if (uri.startsWith("/api/subjects") && !"GET".equalsIgnoreCase(method)) {
                action = "ADMIN_ACTION";
                details = "Thao tác quản lý môn học: " + method + " " + uri;
            }

            if (action != null) {
                auditLogService.logAction(action, email, details);
            }
        }
    }
}
