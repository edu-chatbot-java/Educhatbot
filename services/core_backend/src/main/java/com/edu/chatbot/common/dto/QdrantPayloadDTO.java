package com.edu.chatbot.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Lớp DTO định nghĩa "Hợp đồng (Contract)" bắt buộc giữa TV3 (người đẩy dữ liệu)
 * và TV4 (người lấy dữ liệu) trên Qdrant Vector Database.
 * Tránh việc TV3 lưu thuộc tính là "text_content" mà TV4 lại đi tìm "content".
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QdrantPayloadDTO {
    
    // ID của bản ghi Document Chunk trong Supabase (để TV4 query ngược về DB nếu cần)
    private Long chunkId;
    
    // ID của Môn học (Bắt buộc phải có để TV4 dùng Filter lọc đúng ngữ cảnh môn học)
    private Long subjectId;
    
    // Nội dung văn bản (TV4 sẽ rút trích trường này để đưa vào Prompt cho LLM)
    private String content;

    // Metadata phụ (Tên file, số trang, v.v. - Không bắt buộc)
    private Map<String, Object> metadata;
}
