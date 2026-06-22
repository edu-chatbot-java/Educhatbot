package com.edu.chatbot.document.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.Contact;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("EduChatbot Core API - TV3 Document Module")
                        .version("1.0.0")
                        .description("Tài liệu API cho phân hệ xử lý tài liệu và lưu trữ Vector (Qdrant).")
                        .contact(new Contact().name("Backend Team")));
    }
}
