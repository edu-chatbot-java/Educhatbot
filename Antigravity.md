# 🚀 Dự án Antigravity: Chatbot Học Thuật Tiếng Việt (RAG vs Fine-tuning)

Tài liệu này đóng vai trò là bản đồ kiến trúc hệ thống và cung cấp ngữ cảnh toàn diện cho các AI Agent / LLM để đọc hiểu, phân tích, đánh giá hiệu năng và sinh mã nguồn (code) cho kho lưu trữ (repository) này.

---

## 📌 1. Tổng quan & Ngữ cảnh Dự án
* **Mục tiêu:** Xây dựng một chatbot học thuật cho phép sinh viên tra cứu và hỏi đáp dựa trên tài liệu môn học (slide, giáo trình, bài giảng).
* **Nghiên cứu Cốt lõi:** Tiến hành thử nghiệm đối chứng và đánh giá hiệu năng giữa hai phương pháp: **RAG (Retrieval-Augmented Generation)** và **Fine-tuning** trong môi trường xử lý ngôn ngữ tự nhiên tiếng Việt.
* **Công nghệ Sử dụng (Stack):** Java 17+, Spring Boot 3.x, Spring Security (JWT), LangChain4j / Spring AI, **Supabase Cloud Database (PostgreSQL)** tích hợp extension `vector`, và một cầu nối Python FastAPI để huấn luyện/gọi mô hình LLM.
* **Thời gian Triển khai:** Phát triển thần tốc trong 2 tuần (Sprint MVP).

---

## 👥 2. Danh sách Thành viên & Phân chia Module Sở hữu
Hệ thống được module hóa thành 3 phân hệ độc lập, chạy song song theo mô hình "ghép cặp chéo" gồm 6 thành viên. Khi phân tích hoặc viết code, AI cần tuân thủ nghiêm ngặt ranh giới trách nhiệm này:

### 🧩 Phân hệ 1: Kiến trúc Cốt lõi & Bảo mật
* **Thành viên 1 (Trưởng nhóm - Core & Base):** Chịu trách nhiệm khởi tạo dự án, kết nối và cấu hình **Supabase Connection Pool (HikariCP)**, xử lý lỗi tập trung (`@ControllerAdvice`), định nghĩa các Base DTO và chuẩn hóa dữ liệu API trả về.
* **Thành viên 2 (Bảo mật & Xác thực):** Chịu trách nhiệm triển khai chuỗi lọc bảo mật Spring Security, cấu hình bộ lọc kiểm tra JWT (`OncePerRequestFilter`), quản lý định danh và phân quyền Endpoint (`/api/auth/**`).

### 🧩 Phân hệ 2: Luồng dữ liệu RAG (Java Thuần & Supabase Vector)
* **Thành viên 3 (Nạp & Xử lý dữ liệu):** Chịu trách nhiệm đọc file (Apache Tika), thuật toán cắt nhỏ văn bản theo ngữ nghĩa tiếng Việt (Text Splitting), gọi mô hình tạo Embedding và đồng bộ dữ liệu vector trực tiếp lên bảng lưu trữ của **Supabase**.
* **Thành viên 4 (Điều phối RAG):** Chịu trách nhiệm quản lý phiên chat (`chat_sessions`), thực hiện gọi hàm tìm kiếm vector tương đồng (Similarity Search) từ tầng lưu trữ của Supabase, tối ưu hóa câu lệnh tiếng Việt (Prompt Engineering) và điều phối LLM thông qua LangChain4j.

### 🧩 Phân hệ 3: Mô hình Fine-tuning & Thống kê (Hybrid AI)
* **Thành viên 5 (Cầu nối AI Bridge):** Chịu trách nhiệm xây dựng microservice Python FastAPI (để load và expose API mô hình tiếng Việt đã được chạy Fine-tune LoRA) và viết logic `WebClient` phía Java để điều hướng các request chat sang Python.
* **Thành viên 6 (Xuất dữ liệu & Thống kê):** Chịu trách nhiệm quản lý thông tin Profile sinh viên, viết hàm tương tác với Supabase để gom lịch sử chat cũ xuất ra file định dạng `.jsonl` làm tập dữ liệu huấn luyện, và tính toán chỉ số đo lường hiệu năng (Latency mạng + xử lý bằng `System.currentTimeMillis()`, số lượng token, điểm đánh giá từ user).

---

## 🗄️ 3. Thiết kế Cơ sở Dữ liệu (Supabase / PostgreSQL Schema)
Tất cả các thực thể nằm trên Cloud Supabase. Đảm bảo các cấu hình mapping JPA tuân thủ cấu trúc quan hệ và dữ liệu vector (đã bật extension `vector` trên Supabase) sau:

* `users`: `id` (PK), `username`, `password` (BCrypt), `role` (STUDENT, ADMIN)
* `documents`: `id` (PK), `title`, `file_path`, `status` (PROCESSING, READY), `uploaded_by` (FK)
* `document_chunks`: `id` (PK), `document_id` (FK), `content` (TEXT), `embedding` (Kiểu dữ liệu `vector` trên Supabase - 1536 hoặc 384 chiều tùy thuộc vào mô hình embedding sử dụng)
* `chat_sessions`: `id` (PK), `user_id` (FK), `title`, `created_at`
* `chat_messages`: `id` (PK), `session_id` (FK), `sender` (USER, BOT), `content` (TEXT), `approach` (RAG, FINETUNE), `latency_ms` (BIGINT - lưu ý chỉ số này bao gồm cả Network Latency đến Supabase), `user_rating` (INT), `created_at`

---

## 🛠️ 4. Chỉ thị Nhắc lệnh cho AI (Hướng dẫn Code & Phân tích)

Khi đọc mã nguồn hoặc nhận yêu cầu viết code từ repo này, AI phải tuyệt đối tuân thủ các ràng buộc sau:

1. **Chuẩn mã nguồn Spring Boot 3.x & Cloud DB:** Sử dụng cú pháp Spring Boot hiện đại. Cấu hình pooling kết nối phải có các thuộc tính `connection-timeout` và `idle-timeout` để tránh việc mất kết nối đột ngột với Cloud Supabase qua internet.
2. **Xử lý Tiếng Việt UTF-8:** Khi sinh mã cho các bộ cắt chữ (text splitter) hoặc prompt template, đảm bảo tương thích 100% với tiếng Việt có dấu. Khi cắt văn bản (chunking), phải ưu tiên cắt theo dấu câu (`.`, `?`, `!`) để tránh bẻ gãy các từ ghép tiếng Việt.
3. **Cơ chế Stateless Authentication:** Không sử dụng HTTP Session. Tất cả các API ngoại trừ cổng mở `/api/auth/**` đều phải đi qua `JwtAuthenticationFilter` và lấy thông tin user hiện tại từ `SecurityContextHolder` thông qua annotation `@AuthenticationPrincipal`.
4. **Cơ chế Mock dữ liệu:** Nếu một chức năng cần gọi Dependency Service từ một thành viên khác chưa hoàn thiện, hãy tự động tạo một Interface và một Class triển khai tạm thời (Mock Implementation) trả về dữ liệu giả định để đảm bảo ứng dụng luôn biên dịch (compile) thành công.

---

## 📂 5. Cấu trúc Thư mục Mục tiêu
```text
src/main/java/com/edu/chatbot/
├── config/                # Cấu hình hệ thống (HikariCP Supabase, Async, Cors)
├── security/              # Cấu hình Spring Security & Bộ lọc JWT Filter (Thành viên 2)
├── controller/            # Các REST Controller phân tách theo tính năng
├── domain/                # Các thực thể JPA Entities (Ánh xạ sang Supabase)
├── repository/            # Tầng Spring Data JPA & pgvector/Supabase Repositories
├── service/               # Interface định nghĩa các nghiệp vụ cốt lõi
│   ├── impl/              # Lớp triển khai chi tiết logic (Thành viên 3, 4, 5, 6)
│   └── Base/              # Các class Base dùng chung & Bộ xử lý lỗi tập trung (Thành viên 1)
└── dto/                   # Định nghĩa cấu trúc dữ liệu Request/Response Payload