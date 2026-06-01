
# 📝 TÀI LIỆU ĐẶC TẢ YÊU CẦU HỆ THỐNG (SRS)

## CHƯƠNG 1: GIỚI THIỆU TỔNG QUAN

### 1.1. Mục tiêu Dự án

Dự án nhằm phát triển một hệ thống Chatbot thông minh hỗ trợ sinh viên tra cứu tài liệu môn học bằng tiếng Việt. Đồng thời, dự án đóng vai trò là một công trình thực nghiệm để đối chứng, đánh giá và so sánh hiệu năng toàn diện giữa hai phương pháp tiếp cận AI tiên tiến hiện nay: **RAG (Retrieval-Augmented Generation)** chạy trên nền tảng Java thuần và **Fine-tuning (Huấn luyện chuyên biệt)** thông qua một cầu nối microservice.

### 1.2. Phạm vi Hệ thống

Hệ thống được thiết kế dưới dạng ứng dụng Web Enterprise.

* **Phần lõi quản trị và điều phối:** Do Java Spring Boot đảm nhiệm.
* **Phần lưu trữ dữ liệu quan hệ và dữ liệu không gian vector:** Sử dụng hạ tầng điện toán đám mây Supabase Cloud.
* **Phần xử lý mô hình trí tuệ nhân tạo:** Sử dụng kết hợp thư viện LangChain4j (Java) và FastAPI (Python).

---

## CHƯƠNG 2: MÔ HÌNH HÓA CHỨC NĂNG (FUNCTIONAL REQUIREMENTS)

Hệ thống được phân rã thành 4 phân hệ chức năng chính với các yêu cầu chi tiết sau:

### 2.1. Phân hệ Quản lý Người dùng & Bảo mật (Auth & Identity Subsystem)

* **RF-01: Đăng ký tài khoản:** Cho phép sinh viên tạo tài khoản mới bằng Mã số sinh viên (MSSV), mật khẩu và email trường.
* **RF-02: Đăng nhập & Cấp Token:** Xác thực thông tin người dùng. Nếu chính xác, hệ thống sinh mã **JWT (JSON Web Token)** chứa các trường: `userId`, `username`, `role`, và thời gian hết hạn (Expiration Time).
* **RF-03: Kiểm soát phân quyền (RBAC):** Chặn và phân luồng quyền truy cập tại tầng Filter:
* `ROLE_STUDENT`: Có quyền sử dụng Chatbot (RAG/Fine-tune), xem lịch sử cá nhân, chấm điểm câu trả lời.
* `ROLE_ADMIN`: Có toàn quyền của Student, cộng thêm quyền upload tài liệu và truy cập Dashboard hệ thống.



### 2.2. Phân hệ Nạp & Xử lý Tài liệu (Data Ingestion Subsystem)

* **RF-04: Tải lên tài liệu:** Admin có thể upload các file tài liệu học thuật định dạng `.pdf` hoặc `.txt`.
* **RF-05: Trích xuất nội dung (Text Parsing):** Hệ thống sử dụng thư viện **Apache Tika** để đọc và chuyển đổi toàn bộ nội dung file sang chuỗi text UTF-8, tự động lọc bỏ các ký tự rác.
* **RF-06: Cắt nhỏ văn bản (Semantic Chunking):** Hệ thống tự động băm nhỏ văn bản thành các đoạn (chunks) có độ dài từ 500-1000 ký tự. Thuật toán cắt phải nhận diện dấu câu (`.`, `?`, `!`) để không làm gãy từ ghép tiếng Việt.
* **RF-07: Tạo và Lưu Vector (Embedding Vectorization):** Hệ thống gọi mô hình embedding để chuyển đổi các chunks thành chuỗi vector số thực (ví dụ: 1536 chiều), sau đó dùng JPA để insert trực tiếp vào bảng `document_chunks` trên **Supabase** (đã bật extension `vector`).

### 2.3. Phân hệ Điều phối Hội thoại Lai (Hybrid Chat Orchestrator)

* **RF-08: Quản lý Phiên chat (Session Management):** Sinh viên có thể tạo nhiều tab chat riêng biệt cho từng môn học. Mỗi phiên có một `sessionId` và tiêu đề tự động sinh dựa trên câu hỏi đầu tiên.
* **RF-09: Thực thi Luồng RAG (Java Native Pipeline):** Khi ở chế độ RAG:
1. Chuyển câu hỏi của sinh viên thành vector.
2. Thực hiện truy vấn khoảng cách Cosine trên Supabase để lấy ra Top $K$ đoạn văn bản liên quan nhất.
3. Tích hợp cấu trúc Prompt tiếng Việt (bao gồm Context + Câu hỏi).
4. Gửi Prompt đến LLM qua thư viện LangChain4j và trả kết quả theo dạng Streaming/Text về giao diện.


* **RF-10: Thực thi Luồng Fine-tuning (Python Bridge Pipeline):** Khi ở chế độ Fine-tuning, Backend Java sẽ đảm nhận việc điều phối chính:
1. **Tiếp nhận & Xác thực (Java):** Spring Boot nhận request từ Frontend, xác thực JWT và kiểm tra quyền.
2. **Chuẩn bị Ngữ cảnh (Java):** Trích xuất lịch sử chat (Chat Memory) từ Database để ghép nối vào câu hỏi.
3. **Chuyển tiếp (Java -> Python):** Spring Boot sử dụng `WebClient` làm Proxy để đẩy payload (câu hỏi + lịch sử) qua giao thức HTTP sang Microservice Python FastAPI.
4. **Sinh văn bản (Python):** Python FastAPI chuyển tiếp dữ liệu vào mô hình ngôn ngữ lớn local đã được cấu hình trọng số Fine-tune (LoRA) để sinh câu trả lời.
5. **Lưu trữ & Trả về (Java):** Spring Boot nhận kết quả từ Python, tiến hành lưu cặp câu hỏi/trả lời mới vào Database (Supabase) và bọc kết quả trong `ApiResponse` trả về Frontend.


* **RF-11: Lưu ngữ cảnh (Chat Memory):** Hệ thống tích hợp bộ nhớ lưu trữ lại tối đa 5 cặp câu hỏi-trả lời gần nhất trong cùng một phiên để duy trì ngữ cảnh khi sinh viên hỏi các câu kế tiếp.
* **RF-12: Thu thập phản hồi (Feedback Collection):** Sinh viên có quyền nhấn nút Thumbs Up/Down hoặc chấm điểm từ 1 đến 5 sao cho từng câu trả lời để hệ thống ghi nhận tính chính xác.

### 2.4. Phân hệ Thống kê & Xuất Dữ liệu (Analytics & Data Exporter)

* **RF-13: Đo đếm hiệu năng (Metric Logging):** Với mỗi tin nhắn được gửi đi, hệ thống ngầm ghi vết:
* `latency_ms`: Thời gian xử lý từ lúc nhận request đến lúc sinh xong phản hồi (bằng `System.currentTimeMillis()`).
* `approach_used`: Ghi rõ câu này được xử lý bằng RAG hay Fine-tune.


* **RF-14: Kết xuất dữ liệu huấn luyện (Training Data Exporter):** Admin có thể kích hoạt tính năng quét bảng `chat_messages`, lọc ra các cặp câu hỏi-trả lời được sinh viên chấm 5 sao, tự động format thành cấu trúc JSON dạng: `{"messages": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}` và xuất ra file `.jsonl`.
* **RF-15: Dashboard đối sánh (A/B Testing Analytics):** Hệ thống xử lý các phép toán thống kê và trả về dữ liệu dạng đồ thị biểu diễn:
* Biểu đồ đường so sánh thời gian phản hồi trung bình (Average Latency) của RAG vs Fine-tuning.
* Biểu đồ cột so sánh điểm số hài lòng trung bình (User Satisfaction Rate).



---

## CHƯƠNG 3: YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS)

### 3.1. Tính Bảo mật & Toàn vẹn Dữ liệu (Security & Integrity)

* **NFR-01:** Toàn bộ mật khẩu người dùng phải được mã hóa một chiều bằng thuật toán **BCrypt** trước khi ghi vào cơ sở dữ liệu Supabase. Không chấp nhận lưu mật khẩu dạng văn bản thô (Plain text).
* **NFR-02:** Token JWT phải được cấu hình thời gian sống ngắn (ví dụ: 24 giờ) và được ký bằng một chuỗi Secret Key bảo mật cao lưu trữ trong biến môi trường (`Environment Variable`).

### 3.2. Hiệu năng & Khả năng chịu tải (Performance & Scalability)

* **NFR-03:** Thời gian thực thi các truy vấn quan hệ cơ bản (Lấy thông tin profile, danh sách lịch sử chat) phải nhỏ hơn **50ms**.
* **NFR-04:** Hệ thống sử dụng cơ chế **HikariCP Connection Pool** kết hợp với **PgBouncer** (được cung cấp bởi Supabase) để quản lý kết nối, đảm bảo không bị ngắt đột ngột (Timeout) hoặc cạn kiệt số lượng connection khi hệ thống chịu tải cao.

### 3.3. Tính Tương thích & Ngôn ngữ (Localization)

* **NFR-05:** Hệ thống hỗ trợ chuẩn mã hóa **UTF-8** ở mọi tầng xử lý.
* **NFR-06:** Giao diện, thông báo lỗi (`Exception Messages`), dữ liệu trả về từ Chatbot phải hiển thị chuẩn tiếng Việt, có dấu và đúng ngữ pháp.

---

## CHƯƠNG 4: SƠ ĐỒ KIẾN TRÚC & RÀNG BUỘC KỸ THUẬT

### 4.1. Kiến trúc Hệ thống Tổng thể (System Architecture Map)

Hệ thống hoạt động theo mô hình lai phân tán giữa hai nền tảng công nghệ Java và Python, kết nối thông qua Cloud Database:

```text
[ Giao diện Web Client (Thymeleaf/React) ]
                 │
                 │ (HTTP REST API + JWT Token)
                 ▼
 ┌────────────────────────────────────────────────────────┐
 │            BACKEND JAVA SPRING BOOT SERVER             │
 │                                                        │
 │ ┌──────────────────────┐    ┌────────────────────────┐ │
 │ │    Spring Security   │    │      LangChain4j       │ │
 │ │ (Bộ lọc JWT Filter)  │    │   (Điều phối RAG)      │ │
 │ └──────────┬───────────┘    └───────────┬────────────┘ │
 └────────────┼────────────────────────────┼──────────────┘
              │                            │
              │ (Đọc/Ghi SQL + Vector)     │ (Gọi REST API)
              ▼                            ▼
 ┌────────────────────────┐    ┌────────────────────────┐
 │ SUPABASE CLOUD DB      │    │ PYTHON FASTAPI BRIDGE  │
 │ (PostgreSQL + vector)  │    │ (Model Fine-tune Local)│
 └────────────────────────┘    └────────────────────────┘

```

### 4.2. Công nghệ Cứng của Dự án (Tech Stack Constraints)

* **Tầng Frontend (Web Client):** Thymeleaf (hoặc ReactJS) với Bootstrap/TailwindCSS để tối ưu hóa trải nghiệm người dùng (UX/UI).
* **Tầng Application:** Java 17+, Spring Boot 3.x, Spring Data JPA, Spring Security 6.x, LangChain4j `0.31.0` / Spring AI.
* **Tầng Database:** Supabase PostgreSQL Cloud (Extension `vector` và `PgBouncer` enabled).
* **Tầng AI Bridge:** Python 3.10+, FastAPI, PyTorch, thư viện Hugging Face (Transformers, PEFT/LoRA).
* **Tầng Triển khai (DevOps):** Docker, Docker Compose, GitHub Actions cho luồng CI/CD Pipeline.

---

## CHƯƠNG 5: MA TRẬN PHÂN CHIA VAI TRÒ CHI TIẾT (5 TUẦN)

*Lưu ý chung: Cả 6 thành viên đều có trách nhiệm viết Unit Test cho phân hệ của mình, tham gia rà soát mã nguồn (Code Review) và cùng nhau xây dựng giao diện Frontend cho các tính năng mà mình đảm nhiệm.*

Để đảm bảo khối lượng công việc được chia đều 100% về cả độ khó thuật toán và dung lượng code, 6 thành viên được phân bổ trách nhiệm cụ thể như sau:

* **Thành viên 1 (Leader - Core & DevOps):** Cấu hình kiến trúc Multi-module, kết nối Spring Boot với Supabase. Viết toàn bộ Base Class, Global Exception Handling. Phụ trách quản lý Git (Git Flow), thiết lập Docker và CI/CD Pipeline để tự động hóa triển khai (Deployment).
* **Thành viên 2 (Security Specialist):** Thiết kế bảng `users`, cấu hình Spring Security Filter Chain, viết logic mã hóa JWT Token. Xử lý phân quyền người dùng (RBAC) chi tiết cho `ROLE_STUDENT` và `ROLE_ADMIN` trên từng endpoint và luồng Frontend tương ứng.
* **Thành viên 3 (Data Ingestion Pipeline):** Cấu hình thư viện Apache Tika, viết thuật toán `VietnameseTextSplitter`, gọi Embedding model và insert vector vào Supabase. Xây dựng giao diện Upload và quản lý tài liệu dành cho Admin.
* **Thành viên 4 (RAG Orchestrator):** Viết câu lệnh SQL/JPA truy vấn vector tương đồng, tối ưu Prompt Template tiếng Việt. Đảm nhiệm chức năng quản lý Phiên chat (Session) và Bộ nhớ hội thoại (Chat Memory) để duy trì ngữ cảnh người dùng.
* **Thành viên 5 (AI Bridge & Python Engineer):** Viết script Python (QLoRA) huấn luyện mô hình trên Colab, dựng server FastAPI (đóng gói Docker) để load model. **Đồng thời phụ trách viết toàn bộ logic bên phía Java Backend cho luồng Fine-tuning:** Xây dựng `WebClient` gọi API sang Python, xử lý Controller/Service nhận request, ghép lịch sử chat và lưu kết quả trả về vào cơ sở dữ liệu.
* **Thành viên 6 (Analytics & Logging):** Thiết kế bảng lưu chỉ số đánh giá, viết hàm tự động xuất dữ liệu lịch sử chat sang file `.jsonl`. Phụ trách API thu thập phản hồi (Thumbs up/down, Rating), tính toán Latency và xây dựng Dashboard thống kê trực quan.

---

## CHƯƠNG 6: QUY ƯỚC LẬP TRÌNH VÀ BUSINESS LOGIC (CODING CONVENTIONS)

Để đảm bảo mã nguồn đồng nhất và dễ bảo trì, toàn bộ dự án cần tuân thủ các quy chuẩn sau:

### 6.1. Quy ước Đặt tên (Naming Conventions)

* **Biến & Phương thức (Variables & Methods):** Sử dụng `camelCase` (ví dụ: `studentId`, `getUserProfile()`). Các biến boolean nên bắt đầu bằng `is`, `has`, `can` (ví dụ: `isActive`).
* **Lớp & Interface (Classes & Interfaces):** Sử dụng `PascalCase` (ví dụ: `ChatController`, `UserService`, `DocumentRepository`). Interface không cần tiền tố `I`.
* **Hằng số (Constants):** Sử dụng `UPPER_SNAKE_CASE` và từ khóa `final` (ví dụ: `MAX_FILE_SIZE`, `DEFAULT_ROLE`).
* **Cơ sở dữ liệu (Database):** Tên bảng và tên cột sử dụng `snake_case` (ví dụ: `chat_messages`, `user_id`, `created_at`).

### 6.2. Quy ước Trả về & Xử lý Lỗi (Response & Exception Handling)

* **Định dạng Trả về (Standard Response):** Mọi API RESTful phải trả về dữ liệu qua một Wrapper Class chung là `ApiResponse<T>` chứa các trường tiêu chuẩn: `status` (success/error), `code` (HTTP Status Code), `message` (Mô tả), và `data` (Payload thực tế chứa đối tượng trả về).
* **Quản lý Ngoại lệ (Global Exception):** Hạn chế tối đa dùng `try-catch` lẻ tẻ ở Controller. Hệ thống sử dụng `@RestControllerAdvice` (Global Exception Handler) để bắt tất cả các Exception tập trung và chuẩn hóa thành định dạng `ApiResponse` kèm mã lỗi chuẩn (400, 401, 403, 404, 500).
* **Ngoại lệ Nghiệp vụ (Business Exception):** Phải tạo các lớp Custom Exception kế thừa từ `RuntimeException` (như `ResourceNotFoundException`, `InvalidTokenException`) để chủ động ném lỗi (throw) từ tầng Service.

### 6.3. Quy ước Tách biệt Trách nhiệm Nghiệp vụ (Business Flow)

* **Tầng Controller:** Chỉ nhận Request, gọi xuống tầng Service và bọc kết quả trả về Response. **Tuyệt đối không** viết các biểu thức tính toán logic (Business Logic) hay tương tác với DB tại đây.
* **Tầng Service:** Chứa 100% Business Logic. Các thao tác ghi (Insert/Update/Delete) phải được gắn Annotation `@Transactional` để đảm bảo tính toàn vẹn (ACID) của giao dịch.
* **Tầng Repository:** Chỉ chứa mã truy vấn (Spring Data JPA / Native SQL / Vector Query). Không xử lý logic nghiệp vụ.
* **DTO (Data Transfer Object) & Validation:** Mọi dữ liệu đi vào (Request) và đi ra (Response) đều phải thông qua DTO, tuyệt đối không trả trực tiếp `Entity` của database ra ngoài API để tránh rò rỉ dữ liệu nhạy cảm. Dữ liệu đầu vào phải được kiểm duyệt bằng Validation Annotation (`@NotNull`, `@Size`, `@Email`...) ngay tại DTO.