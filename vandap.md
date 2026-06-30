# 🎓 ĐỀ CƯƠNG ÔN TẬP VẤN ĐÁP BẢO VỆ MÔN JAVA SPRING BOOT

Tài liệu này tổng hợp các câu hỏi trọng tâm mà Giảng viên chấm đồ án môn Java (Spring Boot) có thể "xoáy" sâu vào, được phân chia cụ thể theo đúng phần việc của từng thành viên trong nhóm. Các thành viên cần nắm vững lý thuyết và **chỉ được đúng đoạn code mình đã viết** khi bị hỏi.

---

### 👨‍💻 Thành viên 1 (Leader) - Core Architecture & Design
Giảng viên sẽ đánh giá tư duy thiết kế kiến trúc hệ thống của bạn:
1. **Kiến trúc Microservices:** Vì sao lại tách Spring Boot và Python FastAPI? Kết nối chúng bằng giao thức gì (HTTP/REST)?
2. **Global Exception Handling:** Nguyên lý hoạt động của `@ControllerAdvice` và `@ExceptionHandler`? Tại sao không dùng `try-catch` ở khắp nơi mà lại gom về 1 chỗ?
3. **Mẫu thiết kế DTO (Data Transfer Object):** Tại sao không trả thẳng `Entity` ra API mà phải map qua DTO? *(Gợi ý: Để bảo mật, giấu password, tránh đệ quy vô hạn `LazyInitializationException`)*.
4. **JPA BaseEntity:** Kế thừa (Inheritance) trong JPA hoạt động thế nào? Trình bày cách dùng `@MappedSuperclass` để tự sinh `created_at`, `updated_at`.

---

### 🛡️ Thành viên 2 - Security & User Management
Đây là phần Giảng viên rất thích hỏi vặn về cơ chế bảo mật:
1. **Spring Security Filter Chain:** Luồng đi của 1 Request từ ngoài vào hệ thống đi qua các Filter nào? (Trình bày `JwtAuthenticationFilter` hoạt động ra sao, kế thừa lớp nào - ví dụ `OncePerRequestFilter`).
2. **JWT (JSON Web Token):** JWT gồm mấy phần (Header, Payload, Signature)? Server xác thực JWT bằng cách nào mà không cần lưu vào Database (Stateless)? Access Token khác gì Refresh Token?
3. **Mã hóa BCrypt:** Tại sao dùng BCrypt thay vì MD5 hay SHA-256? *(Gợi ý: Vì BCrypt có cơ chế sinh chuỗi ngẫu nhiên `salt` chống tấn công Rainbow Table)*.
4. **Phân quyền RBAC:** Giải thích cách hoạt động của Annotation `@PreAuthorize("hasRole('ADMIN')")`.

---

### 📂 Thành viên 3 - Document Processing & Data Ingestion
Giảng viên sẽ hỏi về cách xử lý I/O File và tích hợp API ngoài:
1. **Xử lý File (MultipartFile):** Spring Boot nhận file PDF/TXT như thế nào? Cấu hình giới hạn dung lượng file upload (Max file size) ở đâu? (`application.properties`).
2. **Giao tiếp API (WebClient / RestTemplate):** Cách bạn gọi từ Java sang Python để lấy Vector hoạt động như thế nào? Xử lý bất đồng bộ (Async) hay đồng bộ (Sync)?
3. **Tương tác Qdrant Vector DB:** Bạn dùng thư viện nào (Qdrant Client hay HTTP REST)? Gắn Payload (metadata như `subject_id`) vào Vector như thế nào trước khi lưu để phục vụ tìm kiếm có điều kiện?

---

### 🧠 Thành viên 4 - RAG Orchestrator (AI Integration)
Người làm phần này phải vững về luồng xử lý AI tích hợp trong Java:
1. **Thư viện LangChain4j:** Cơ chế hoạt động của LangChain4j trong Spring Boot? (Cách cấu hình ChatModel, PromptTemplate).
2. **Query Qdrant (Vector Search):** Truy vấn Vector Search (ANN) hoạt động như thế nào? Giải thích cách dùng `Filter` trong Qdrant để ép nó chỉ tìm kiếm tài liệu trong đúng ngữ cảnh môn học (`subject_id`).
3. **Memory / Session Management:** Lịch sử chat được lưu trữ trong Database và bốc ngược lên nhét vào Prompt như thế nào?
4. **Query Rewriting:** Logic gọi Groq API phụ trợ để viết lại câu hỏi diễn ra ở tầng nào? Làm sao để không bị nghẽn (Block) toàn bộ hệ thống khi LLM trả lời chậm?

---

### 🐍 Thành viên 5 - AI Bridge & Fine-tuning
Mặc dù công việc chính là Python, nhưng trong môn Java, Giảng viên sẽ hỏi cách 2 ngôn ngữ nói chuyện với nhau:
1. **API Integration:** Giao thức RESTful là gì? Phân biệt sự khác nhau giữa `GET` và `POST`.
2. **Xử lý JSON (Jackson):** Khi Python trả về chuỗi JSON, Spring Boot dùng thư viện gì để parse (phân tích) chuỗi đó thành Java Object (`ObjectMapper` / DTO)?
3. **Xử lý Timeout:** Nếu model Python (LLaMA) sinh chữ quá chậm mất 30 giây, Spring Boot có thể bị lỗi Timeout. Bạn đã cấu hình thời gian Timeout cho `WebClient` của Java như thế nào để hệ thống không bị crash?

---

### 📊 Thành viên 6 - Analytics & Evaluation
Trọng tâm là thao tác với Database nâng cao, truy vấn thống kê và thao tác I/O xuất file:
1. **Spring Data JPA nâng cao:** Bạn lấy số liệu để vẽ biểu đồ bằng cách nào? *(Trình bày cách dùng `@Query` viết JPQL / Native Query để tính toán trung bình Latency (AVG), đếm (COUNT) số lượng tin nhắn)*.
2. **Xuất File (Export JSONL):** Cách tạo API trả về một File tải xuống thay vì chuỗi JSON thông thường? *(Gợi ý: Dùng `ResponseEntity<byte[]>` và cấu hình Header `Content-Disposition: attachment; filename="..."`)*.
3. **Auto Evaluation:** Chạy Benchmark đánh giá tự động tốn nhiều thời gian, logic này được xử lý đồng bộ hay bất đồng bộ? Có dùng `@Async` hoặc Queue nào không?

---
💡 **Lời khuyên chung cho toàn Team:** Khi trả lời vấn đáp, tuyệt đối không nói chung chung. Phải **MỞ SOURCE CODE RA**, chỉ tay vào đúng Class, đúng Dòng Code mà mình đã viết để chứng minh bản thân thật sự nắm rõ công nghệ Spring Boot. Chúc nhóm bảo vệ thành công! 🚀
