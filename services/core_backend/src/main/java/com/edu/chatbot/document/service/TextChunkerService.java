package com.edu.chatbot.document.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class TextChunkerService {

    // Strategy: VietnameseTextSplitter (max 600 chars ~ 400 tokens)
    private static final int MAX_CHUNK_LENGTH = 600; 
    private static final int OVERLAP_LENGTH = 50;

    public List<String> chunkText(String text) {
        List<String> chunks = new ArrayList<>();
        if (text == null || text.isEmpty()) {
            return chunks;
        }

        int length = text.length();
        int start = 0;

        while (start < length) {
            int end = Math.min(start + MAX_CHUNK_LENGTH, length);
            
            // Cố gắng không cắt ngang từ (tìm khoảng trắng gần nhất)
            if (end < length) {
                int lastSpace = text.lastIndexOf(' ', end);
                // Đảm bảo không bị lặp vô hạn nếu một từ quá dài
                if (lastSpace > start + MAX_CHUNK_LENGTH / 2) {
                    end = lastSpace;
                }
            }

            chunks.add(text.substring(start, end).trim());
            
            if (end == length) {
                break;
            }
            
            start = end - OVERLAP_LENGTH;
            // Xử lý fallback nếu overlap bằng hoặc lớn hơn kích thước bước tiến
            if (start <= end - MAX_CHUNK_LENGTH) {
                start = end; 
            }
            if (start < 0) {
                start = 0;
            }
        }

        return chunks;
    }
}
