# Analytics Module (Thành viên 6)

Package này chứa tính năng thống kê và tự động chấm điểm hiệu năng AI.

## Nhiệm vụ của TV6:
- Entity `Feedback` và `EvaluationResult`.
- Các API cho Dashboard (đếm số user, tính latency trung bình, tỷ lệ đánh giá).
- **Hứng API Blind Test:** Xử lý kết quả khi sinh viên bình chọn Mô hình A hay Mô hình B, vẽ biểu đồ Tỉ lệ thắng của RAG vs Fine-tuning.
- Xuất dữ liệu JSONL cho TV5 fine-tune.
- Chạy đánh giá tự động: Faithfulness Score, Answer Relevancy, Recall@K.
