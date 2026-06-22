package com.edu.chatbot.document.service;

import com.edu.chatbot.document.enums.FileType;
import org.apache.tika.Tika;
import org.apache.tika.exception.TikaException;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.text.Normalizer;

@Service
public class TextParserService {

    private final Tika tika;

    public TextParserService() {
        this.tika = new Tika();
        // Cấu hình tika max size nếu cần
        this.tika.setMaxStringLength(-1); // Không giới hạn độ dài chuỗi trích xuất
    }

    public String parseText(InputStream inputStream, FileType fileType) throws IOException {
        try {
            String extractedText = tika.parseToString(inputStream);
            
            // Cân bằng Unicode (NFC) chuẩn hóa tiếng Việt
            String normalizedText = Normalizer.normalize(extractedText, Normalizer.Form.NFC);
            
            // Xóa bỏ các ký tự null và khoảng trắng thừa
            normalizedText = normalizedText.replace("\u0000", "");
            normalizedText = normalizedText.replaceAll("\\s+", " ").trim();
            
            if (normalizedText.isEmpty()) {
                throw new IllegalArgumentException("Cannot extract text from file (file might be a scanned image without a text layer or corrupted).");
            }
            
            return normalizedText;
        } catch (TikaException e) {
            throw new IOException("Error parsing file with Tika (file might be encrypted).", e);
        }
    }
}
