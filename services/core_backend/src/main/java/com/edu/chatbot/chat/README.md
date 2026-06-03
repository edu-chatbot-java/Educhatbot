# Chat Module (Thành viên 4)

Package này chứa toàn bộ luồng RAG và kết nối LLM.

## Nhiệm vụ của TV4:
- Entity `ChatSession` và `ChatMessage`
- Controller và Service xử lý luồng chat.
- Lấy câu hỏi và lịch sử chat (tối đa 5 câu).
- **Query Rewriting:** Gọi Groq API (model Llama 3.1 8B) để viết lại câu hỏi hoàn chỉnh dựa trên lịch sử chat.
- Gọi API sang `embedding_service` để sinh vector cho câu hỏi đã được viết lại.
- Truy vấn Qdrant kNN (nhớ filter theo `subject_id`).
- Gọi ngược Supabase lấy Text context.
- Tích hợp LangChain4j để ráp Prompt và gọi LLM chính trả về Frontend.
- **Triển khai Blind Test (A/B Testing):** Trong một số trường hợp, gọi song song cả RAG (LangChain4j) và Fine-tuning (qua `FineTuningClient`), trả về 2 kết quả dưới dạng mảng `[A, B]` ẩn danh để Frontend hiển thị so sánh.

## ⚠️ QUY TẮC BẮT BUỘC (CONTRACT)
1. **Entity:** `ChatSession` và `ChatMessage` bắt buộc phải `extends BaseEntity` từ package `common`.
2. **Qdrant Payload:** Khi Qdrant trả kết quả về, **bắt buộc** phải ép kiểu (parse) cục JSON đó thành object `QdrantPayloadDTO` (nằm trong thư mục `common`). Lấy nội dung bằng `payload.getContent()`. Tuyệt đối không tự parse chay.
3. **API Response:** Mọi REST API phải trả về `ApiResponse`.
