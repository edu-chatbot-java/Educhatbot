package com.edu.chatbot.document.service;

import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;

public interface StorageService {
    String store(MultipartFile file) throws IOException;
    String store(byte[] fileBytes, String originalFilename) throws IOException;
    void delete(String filePath) throws IOException;
}
