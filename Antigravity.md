# 🚀 Dự án Antigravity: Chatbot Học Thuật Tiếng Việt (RAG vs Fine-tuning)

Tài liệu này đóng vai trò là bản đồ kiến trúc hệ thống và cung cấp ngữ cảnh toàn diện cho các AI Agent / LLM để đọc hiểu, phân tích, đánh giá hiệu năng và sinh mã nguồn (code) cho kho lưu trữ (repository) này.

---

## 📌 1. Tổng quan & Ngữ cảnh Dự án
* **Mục tiêu:** Xây dựng một chatbot học thuật cho phép sinh viên tra cứu và hỏi đáp dựa trên tài liệu môn học (slide, giáo trình, bài giảng).
* **Nghiên cứu Cốt lõi:** Tiến hành thử nghiệm đối chứng và đánh giá hiệu năng giữa hai phương pháp: **RAG (Retrieval-Augmented Generation)** và **Fine-tuning** trong môi trường xử lý ngôn ngữ tự nhiên tiếng Việt.
* **Công nghệ Sử dụng (Stack):** Java 17+, Spring Boot 3.x, Spring Security (JWT), LangChain4j / Spring AI, **Supabase Cloud Database (PostgreSQL/pgvector)** làm Source of Truth, **Qdrant Vector Database** để nén và tìm kiếm ANN tốc độ cao, và một cầu nối Python FastAPI để huấn luyện/gọi mô hình LLM.
* **Thời gian Triển khai:** Phát triển thần tốc trong 2 tuần (Sprint MVP).

---

## 👥 2. Danh sách Thành viên & Phân chia Module Sở hữu
Hệ thống được module hóa thành 3 phân hệ độc lập, chạy song song theo mô hình "ghép cặp chéo" gồm 6 thành viên. Khi phân tích hoặc viết code, AI cần tuân thủ nghiêm ngặt ranh giới trách nhiệm này:

### 🧩 Phân hệ 1: Kiến trúc Cốt lõi & Bảo mật
* **Thành viên 1 (Trưởng nhóm - Core Infrastructure & Benchmark Dataset):** Chịu trách nhiệm phân tích yêu cầu, thiết kế kiến trúc hệ thống (SRS, ERD, Use Case, Tech Stack), và phân tích hướng phát triển mở rộng. Thiết lập kiến trúc Microservices (Java Spring Boot + Python FastAPI), kết nối **Supabase Connection Pool (HikariCP)**, xử lý lỗi tập trung (`@ControllerAdvice`), xây dựng các lớp nền tảng (ApiResponse, Global Exception Handler, Base Entity, Common Utilities). Thiết lập Docker/CI/CD và quản lý Git Flow. Xây dựng bộ dữ liệu đánh giá (Benchmark Dataset) gồm bộ câu hỏi kiểm thử và tập đáp án tham chiếu (Ground Truth).
* **Thành viên 2 (Security & User Management):** Chịu trách nhiệm thiết kế bảng người dùng, triển khai Spring Security Filter Chain, cấu hình JWT Authentication (Access + Refresh Token), quản lý RBAC (`ROLE_STUDENT`, `ROLE_ADMIN`). Xây dựng hệ thống Audit Log và kiểm tra/xác thực dữ liệu đầu vào (Validation).

### 🧩 Phân hệ 2: Luồng dữ liệu RAG (Java Thuần & Supabase Vector)
* **Thành viên 3 (Document Processing & Data Ingestion):** Chịu trách nhiệm đọc file (Apache Tika), thuật toán `VietnameseTextSplitter`, tiền xử lý dữ liệu văn bản, gọi mô hình Embedding, lưu trữ gốc lên **Supabase** và đồng bộ vector sang **Qdrant**. Xây dựng giao diện quản lý tài liệu (danh sách, xóa, xem thông tin). Thu thập và chuẩn hóa tài liệu phục vụ RAG và Fine-tuning.
* **Thành viên 4 (RAG Orchestrator):** Chịu trách nhiệm xây dựng cơ chế truy xuất bằng Vector Search qua **Qdrant** (ANN Search), tích hợp LangChain4j, thiết kế Prompt Template tiếng Việt. Xây dựng Session Management, Chat Memory và luồng RAG hoàn chỉnh (Embedding Query → Qdrant Retrieval → Context Building → Response Generation). Hiển thị nguồn tài liệu được sử dụng để sinh câu trả lời.

### 🧩 Phân hệ 3: Mô hình Fine-tuning & Thống kê (Hybrid AI)
* **Thành viên 5 (Fine-tuning & AI Bridge):** Chịu trách nhiệm chuẩn bị dữ liệu huấn luyện, xây dựng script Fine-tuning (QLoRA), huấn luyện mô hình trên Colab/Kaggle, dựng FastAPI Model Server (đóng gói Docker). Xây dựng API giao tiếp Java ↔ Python, tích hợp `WebClient` để gọi FastAPI từ Spring Boot và xử lý luồng Fine-tuning hoàn chỉnh.
* **Thành viên 6 (Analytics & Evaluation):** Chịu trách nhiệm thiết kế bảng lưu kết quả đánh giá, xây dựng hệ thống ghi nhận (Latency, số lượng request, loại model). Xây dựng API Feedback (Thumbs Up/Down, Rating 1-5 sao), xuất dữ liệu JSONL, Dashboard thống kê (thời gian phản hồi TB, số cuộc hội thoại, mức độ hài lòng). Xây dựng công cụ đánh giá tự động (Faithfulness Score, Answer Relevancy Score) và thực hiện benchmark so sánh RAG vs Fine-tuning.
---

## 🗄️ 3. Thiết kế Cơ sở Dữ liệu (Supabase / PostgreSQL Schema)
Tất cả các thực thể nằm trên Cloud Supabase. Đảm bảo các cấu hình mapping JPA tuân thủ cấu trúc quan hệ và dữ liệu vector (đã bật extension `vector` trên Supabase) sau:

* `subjects`: `id` (PK), `code` (UK - VD: JAVA_OOP, CSHARP_BASIC), `name`, `description` (TEXT), `is_active`, `created_at`
* `users`: `id` (PK), `username` (UK - MSSV), `email` (UK), `password` (BCrypt), `role` (STUDENT, ADMIN), `is_active`, `created_at`, `updated_at`
* `documents`: `id` (PK), `title`, `file_path`, `file_type` (PDF, TXT), `file_size`, `status` (PROCESSING, READY, ERROR), `uploaded_by` (FK → users), `subject_id` (FK → subjects), `created_at`, `updated_at`
* `document_chunks`: `id` (PK), `document_id` (FK → documents), `content` (TEXT), `embedding` (Kiểu dữ liệu `vector` trên Supabase - 384 hoặc 1536 chiều), `chunk_index` (INT), `created_at`
* `chat_sessions`: `id` (PK), `user_id` (FK → users), `subject_id` (FK → subjects), `title`, `created_at`, `updated_at`
* `chat_messages`: `id` (PK), `session_id` (FK → chat_sessions), `sender` (USER, BOT), `content` (TEXT), `code_snippet` (TEXT - code gửi kèm nếu có), `detected_language` (Java, CSharp, Python, NULL), `approach` (RAG, FINETUNE), `latency_ms` (BIGINT), `user_rating` (INT 1-5), `feedback_type` (THUMBS_UP, THUMBS_DOWN, NULL), `created_at`
* `audit_logs`: `id` (PK), `user_id` (FK → users), `action` (LOGIN, UPLOAD, ADMIN_ACTION), `entity_type`, `entity_id`, `details` (TEXT), `ip_address`, `created_at`
* `evaluation_results`: `id` (PK), `approach` (RAG, FINETUNE), `question`, `generated_answer` (TEXT), `ground_truth` (TEXT), `faithfulness_score` (FLOAT), `relevancy_score` (FLOAT), `recall_at_k` (FLOAT), `precision_at_k` (FLOAT), `k_value` (INT), `latency_ms`, `evaluated_at`

---

## 🛠️ 4. Chỉ thị Nhắc lệnh cho AI (Hướng dẫn Code & Phân tích)

Khi đọc mã nguồn hoặc nhận yêu cầu viết code từ repo này, AI phải tuyệt đối tuân thủ các ràng buộc sau:

1. **Chuẩn mã nguồn Spring Boot 3.x & Cloud DB:** Sử dụng cú pháp Spring Boot hiện đại. Cấu hình pooling kết nối phải có các thuộc tính `connection-timeout` và `idle-timeout` để tránh việc mất kết nối đột ngột với Cloud Supabase qua internet.
2. **Xử lý Tiếng Việt UTF-8:** Khi sinh mã cho các bộ cắt chữ (text splitter) hoặc prompt template, đảm bảo tương thích 100% với tiếng Việt có dấu. Khi cắt văn bản (chunking), phải ưu tiên cắt theo dấu câu (`.`, `?`, `!`) để tránh bẻ gãy các từ ghép tiếng Việt.
3. **Cơ chế Stateless Authentication:** Không sử dụng HTTP Session. Tất cả các API ngoại trừ cổng mở `/api/auth/**` đều phải đi qua `JwtAuthenticationFilter` và lấy thông tin user hiện tại từ `SecurityContextHolder` thông qua annotation `@AuthenticationPrincipal`.
4. **Cơ chế Mock dữ liệu:** Nếu một chức năng cần gọi Dependency Service từ một thành viên khác chưa hoàn thiện, hãy tự động tạo một Interface và một Class triển khai tạm thời (Mock Implementation) trả về dữ liệu giả định để đảm bảo ứng dụng luôn biên dịch (compile) thành công.
5. **Quy tắc Tôn trọng Lãnh thổ (Database Owner Matrix Enforced):** Tuyệt đối KHÔNG SỬA TRỰC TIẾP vào Entity hoặc Repository do thành viên khác làm chủ (VD: TV4 không được sửa DocumentChunk của TV3). Thay vào đó:
    - Mọi giao tiếp liên module phải thông qua **DTO (Data Transfer Object)** và các hàm public từ **Service** của module sở hữu.
    - Nếu cần thêm trường dữ liệu, phải yêu cầu thành viên sở hữu bảng đó (Owner) thêm vào.
    - Các file Cấu hình (`@Configuration`) hoặc Bean dùng chung phải được đẩy vào thư mục `common`, tuyệt đối không sao chép lại (duplicate) sang thư mục của mình để tránh lỗi `ConflictingBeanDefinitionException`.

---

## 📂 5. Cấu trúc Thư mục Mục tiêu
```text
project_root/
├── services/
│   ├── core_backend/                # Microservice Java (Spring Boot) - Core API
│   │   ├── src/main/java/com/edu/chatbot/
│   │   │   ├── common/              # Lớp Base, Exception, Utils, DTO (TV1)
│   │   │   ├── security/            # Cấu hình JWT, Auth (TV2)
│   │   │   ├── document/            # Logic upload, chunking (TV3)
│   │   │   ├── chat/                # Logic RAG, gọi LLM (TV4)
│   │   │   ├── finetune/            # Logic gọi WebClient sang Model Python (TV5)
│   │   │   └── analytics/           # Logic Dashboard, Auto Eval (TV6)
│   │   └── pom.xml                  # Cấu hình Maven chung cho Backend Java
│   │
│   ├── embedding_service/           # Microservice Python (FastAPI) - Sinh Vector
│   │   ├── main.py                  # API FastAPI (ONNX)
│   │   └── requirements.txt         
│   │
│   └── finetune_service/            # Microservice Python (FastAPI) - AI Model
│       ├── main.py                  # API gọi Model LLM Fine-tuned (TV5)
│       └── requirements.txt         
└── docker-compose.yml               # Quản lý chạy toàn bộ hệ thống
```
---

## 🤖 6. Hướng dẫn Prompt cho Antigravity (Dành cho thành viên team)

Để Antigravity AI code chính xác 100% và không bị lệch khỏi kiến trúc dự án, khi giao việc cho Antigravity, **BẮT BUỘC** phải gắn kèm câu lệnh mồi (Prompt) theo khuôn mẫu dưới đây:

> "Antigravity, hãy đọc file `SR.md`, file `Antigravity.md` và file `README.md` trong thư mục của tao (ví dụ `document/README.md`). Dựa vào các yêu cầu đó và các quy định bắt buộc trong file `common/README.md`, hãy code cho tao tính năng [TÊN TÍNH NĂNG]."

**Ví dụ thực tế:**
* *"Antigravity, hãy đọc file `SR.md`, file `Antigravity.md` và file `chat/README.md`. Dựa vào các yêu cầu đó và các quy định bắt buộc trong file `common/README.md`, hãy code cho tao API tạo ChatSession mới."*

Việc cung cấp câu lệnh mồi này sẽ ép tôi (Antigravity) phải tự động load lại "Hiến pháp dự án" trước khi gõ code, đảm bảo:
1. Mọi Entity đều tự động kế thừa `BaseEntity`.
2. Mọi dữ liệu JSON trả về đều được bọc trong `ApiResponse`.
3. Mọi tương tác Qdrant đều chuẩn xác với `QdrantPayloadDTO`.