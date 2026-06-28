package com.edu.chatbot.chat.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CodeDetectionServiceTest {

    private CodeDetectionService service;

    @BeforeEach
    void setUp() {
        service = new CodeDetectionService();
    }

    @Test
    void testDetectMarkdownCode() {
        String msg = "Đây là code:\n```java\nSystem.out.println(\"Hi\");\n```";
        var result = service.detect(msg);
        assertTrue(result.isHasCode());
        assertEquals("System.out.println(\"Hi\");", result.getCodeSnippet());
        assertEquals("Đây là code:", result.getNaturalLanguageQuestion());
    }

    @Test
    void testDetectHeuristic() {
        String msg = "Lỗi khi chạy public void test() {} là sao?";
        var result = service.detect(msg);
        assertTrue(result.isHasCode());
        assertEquals(msg, result.getCodeSnippet());
        assertEquals(msg, result.getNaturalLanguageQuestion());
    }

    @Test
    void testNoCode() {
        String msg = "Interface trong Java là gì?";
        var result = service.detect(msg);
        assertFalse(result.isHasCode());
        assertNull(result.getCodeSnippet());
        assertEquals(msg, result.getNaturalLanguageQuestion());
    }
}
