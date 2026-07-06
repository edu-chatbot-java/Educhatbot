package com.edu.chatbot.document.utils;

import lombok.experimental.UtilityClass;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDDocumentCatalog;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.concurrent.*;

@Slf4j
@UtilityClass
public class DocumentSecurityValidator {

    private static final int PROCESS_TIMEOUT_SECONDS = 10;

    private static final byte[] PDF_MAGIC = new byte[] { 0x25, 0x50, 0x44, 0x46, 0x2D }; // %PDF-
    // Text files (.txt) usually don't have magic numbers, so we might need special
    // handling if we support TXT
    // TV3 supports TXT and PDF.

    public static byte[] processAndSecureDocument(MultipartFile file) {
        try {
            byte[] fileBytes = file.getBytes();

            // 1. Validation (Signature)
            String docType = detectDocumentType(fileBytes, file.getOriginalFilename());

            // Sandbox & Timeout
            ExecutorService executor = Executors.newSingleThreadExecutor();
            Future<byte[]> future = executor.submit(() -> sanitizeDocument(fileBytes, docType));

            try {
                return future.get(PROCESS_TIMEOUT_SECONDS, TimeUnit.SECONDS);
            } catch (TimeoutException e) {
                future.cancel(true);
                log.error("Document security processing timeout ({}s)", PROCESS_TIMEOUT_SECONDS);
                throw new IllegalArgumentException("System overloaded or file too complex, please try again.");
            } catch (Exception e) {
                log.error("Document failed security validation", e);
                throw new IllegalArgumentException("Document rejected (may contain malware, JavaScript, or Macros).");
            } finally {
                executor.shutdownNow();
            }

        } catch (IOException e) {
            throw new IllegalArgumentException("Cannot read file content.");
        }
    }

    private static String detectDocumentType(byte[] fileBytes, String filename) {
        if (fileBytes.length < 5 && filename != null && filename.toLowerCase().endsWith(".txt")) {
            return "TXT";
        }
        if (fileBytes.length >= 5 && isMatchMagic(fileBytes, PDF_MAGIC)) {
            return "PDF";
        }
        if (filename != null && filename.toLowerCase().endsWith(".txt")) {
            return "TXT";
        }

        throw new IllegalArgumentException("System only supports safe PDF and TXT formats.");
    }

    private static boolean isMatchMagic(byte[] fileBytes, byte[] magic) {
        for (int i = 0; i < magic.length; i++) {
            if (fileBytes[i] != magic[i])
                return false;
        }
        return true;
    }

    private static byte[] sanitizeDocument(byte[] originalBytes, String docType) throws IOException {
        switch (docType) {
            case "PDF":
                return sanitizePdf(originalBytes);
            case "TXT":
                return originalBytes; // TXT file is safe natively
            default:
                throw new IOException("Unsupported file format.");
        }
    }

    /**
     * Sanitize PDF: Strip Javascript, AcroForms, and Embedded Files.
     */
    private static byte[] sanitizePdf(byte[] originalBytes) throws IOException {
        try (PDDocument document = PDDocument.load(new ByteArrayInputStream(originalBytes))) {
            PDDocumentCatalog catalog = document.getDocumentCatalog();

            if (catalog != null) {
                // Remove OpenAction (auto-executing JavaScript or actions on open)
                catalog.setOpenAction(null);

                // Remove AcroForms (Interactive forms can execute JS)
                if (catalog.getAcroForm() != null) {
                    catalog.getAcroForm().flatten(); // Flatten form to static visual
                    catalog.setAcroForm(null);
                }

                // Remove Embedded Files and Document Level JavaScript
                if (catalog.getNames() != null && catalog.getNames().getCOSObject() != null) {
                    catalog.getNames().getCOSObject().removeItem(org.apache.pdfbox.cos.COSName.EMBEDDED_FILES);
                    catalog.getNames().getCOSObject().removeItem(org.apache.pdfbox.cos.COSName.JAVA_SCRIPT);
                    catalog.getNames().getCOSObject()
                            .removeItem(org.apache.pdfbox.cos.COSName.getPDFName("JavaScript"));
                    catalog.getNames().getCOSObject().removeItem(org.apache.pdfbox.cos.COSName.JS);
                }
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        }
    }
}
