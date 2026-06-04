# 🛑 QUY ĐỊNH NGHIÊM NGẶT DÀNH CHO FINETUNE (DÀNH CHO TV5 - AI ENGINEER) 🛑

Tài liệu này chứa các quy tắc sống còn về việc sử dụng dữ liệu để đảm bảo mô hình không bị rò rỉ dữ liệu (Data Leakage) và đánh giá được chính xác khách quan nhất.

## ❌ 1. TUYỆT ĐỐI KHÔNG FINETUNE TẬP EVAL
- **File:** `f:\IT project\JAVA\Project\Benchmark\data\query_benchmark\eval_200_questions.json`
- **Mục đích:** File này chứa 200 câu hỏi được sinh độc lập, hoàn toàn mới. Đây là **ĐỀ THI** dùng để đánh giá (Benchmark) hệ thống RAG và đo lường độ thông minh của mô hình sau khi Finetune.
- **Hậu quả nếu vi phạm:** Nếu bạn lấy file này nạp vào để Finetune, mô hình sẽ học thuộc lòng đáp án của đề thi (Data Leakage). Kết quả đánh giá mô hình sau này sẽ cao một cách giả tạo (ảo) và mất đi tính khách quan của toàn bộ dự án.

## ✅ 2. CHỈ ĐƯỢC PHÉP FINETUNE TẬP AUGMENTED
- **File:** `f:\IT project\JAVA\Project\Benchmark\data\Fine-tune\java_augmented_dataset.json` (Hoặc các bản đã shuffle/format từ file này).
- **Mục đích:** Đây là tập dữ liệu huấn luyện chính thức, đã được Data Engineer nhân bản, kiểm duyệt kỹ lưỡng và hoàn toàn tách biệt khỏi đề thi.
- **Hành động:** Bạn (TV5) chỉ được phép sử dụng dữ liệu xuất phát từ file này để đưa vào LLaMA-Factory, Unsloth hoặc hệ thống Finetune của bạn.

---
**Ký xác nhận (Data Engineer):**
*Đã rà soát và đóng gói toàn bộ Pipeline sinh dữ liệu. Chúc TV5 Finetune mô hình Qwen 2.5 3B đạt loss siêu thấp!*
