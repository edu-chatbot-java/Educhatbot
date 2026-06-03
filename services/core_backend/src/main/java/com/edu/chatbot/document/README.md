# Document Module (Thành viên 3)

Package này chứa logic liên quan đến xử lý tài liệu, băm văn bản và lưu trữ vector.

## Nhiệm vụ của TV3:
- Entity `Document` và `DocumentChunk`
- Tích hợp Apache Tika để đọc PDF/TXT
- Code thuật toán `VietnameseTextSplitter`
- Gọi HTTP POST sang `embedding_service` để lấy vector
- Lưu văn bản gốc vào Supabase và đồng bộ vector sang Qdrant Cloud.
- Controller và Service cho tính năng Quản lý tài liệu của Admin.

## ⚠️ QUY TẮC BẮT BUỘC (CONTRACT)
1. **Entity:** `Document` và `DocumentChunk` bắt buộc phải `extends BaseEntity` từ package `common`.
2. **Qdrant Payload:** Khi đẩy vector lên Qdrant, phần payload JSON **bắt buộc** phải được tạo từ object `QdrantPayloadDTO` (nằm trong thư mục `common`). Tuyệt đối không tự định nghĩa cấu trúc JSON thô để tránh xung đột với TV4.
3. **API Response:** Mọi REST API phải trả về `ApiResponse`.
