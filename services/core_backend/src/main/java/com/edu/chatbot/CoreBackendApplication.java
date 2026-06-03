package com.edu.chatbot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing // Bật tính năng tự động cập nhật thời gian (created_at, updated_at)
public class CoreBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(CoreBackendApplication.class, args);
    }
}
