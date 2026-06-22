package com.edu.chatbot.security.entity;

import com.edu.chatbot.common.entity.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog extends BaseEntity {

    private String action; // Tên hành động (VD: ĐĂNG NHẬP)
    private String email; // Người thực hiện
    private String details; // Chi tiết thêm

}
