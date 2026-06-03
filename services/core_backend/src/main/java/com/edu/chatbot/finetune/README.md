# Fine-Tuning Integration Module (Thành viên 5)

Package này chứa logic kết nối (Bridge) giữa Backend Java và Microservice Python (LLM đã được Fine-tune).

## Nhiệm vụ của TV5 (bên cạnh việc code Python):
- Xây dựng lớp `FineTuningClient` sử dụng `WebClient` hoặc `RestTemplate`.
- Định nghĩa DTO `FineTuneRequest` và `FineTuneResponse`.
- Bắn HTTP POST sang URL API (có thể là `http://localhost:8000/api/generate` khi dev nội bộ, hoặc **Hugging Face Inference Endpoint / HF Space** khi đã deploy model lên Hugging Face).
- Tích hợp logic xử lý lỗi (Timeout, Fallback) khi API từ Hugging Face phản hồi chậm.
- Phối hợp với TV4 để trong hàm `ChatController`, nếu User chọn "Chế độ Fine-tuning" thì sẽ gọi qua module này thay vì luồng RAG, sau đó trả Response về hiển thị lên giao diện.
