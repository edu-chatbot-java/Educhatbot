# 🎓 TÀI LIỆU ÔN TẬP VẤN ĐÁP BẢO VỆ MÔN JAVA SPRING BOOT 
*(Phiên bản Ý chính & Phòng thủ câu hỏi xoáy)*

Tài liệu này cung cấp **các ý chính cần bám sát** để trả lời, kèm theo những **câu hỏi đào sâu (Follow-up)** mà Giảng viên có thể "vặn vẹo" để kiểm tra xem bạn có thực sự hiểu bản chất hay không.

---

## 👨‍💻 Thành viên 1 (Leader) - Core Architecture & Design

**1. Kiến trúc Microservices: Spring Boot + Python FastAPI**
* **Ý chính giải thích:** 
  * Tận dụng sức mạnh của 2 ngôn ngữ: Java (Bảo mật, JPA, OOP tốt) và Python (Hệ sinh thái AI, HuggingFace, PyTorch độc tôn).
  * Giảm rủi ro "chết chùm" (Single Point of Failure): Model AI chạy nặng không làm sập luồng API quản lý User/Document.
  * Giao tiếp qua HTTP/REST API.
* **🔥 Câu hỏi đào sâu (Bị hỏi thêm):** 
  * *Hỏi xoáy:* Gọi qua HTTP bị chậm (Network latency), vậy có cách nào tối ưu không? *(Đáp: Có thể dùng gRPC thay cho REST để gửi data dạng nhị phân nhanh hơn, hoặc dùng Message Queue).*
  * *Hỏi xoáy:* Nếu con Python bị sập thì Java xử lý thế nào? *(Đáp: Java WebClient sẽ bị Timeout, em dùng GlobalExceptionHandler để bắt lỗi này và trả về thông báo tử tế cho Frontend).*

**2. Global Exception Handling (`@ControllerAdvice`)**
* **Ý chính giải thích:**
  * Gom toàn bộ logic bắt lỗi (try-catch) về 1 nơi duy nhất.
  * Bọc lỗi vào một class `ApiResponse` để Frontend luôn nhận được JSON chuẩn (không bị trả về mã HTML rác khi có lỗi 500).
* **🔥 Câu hỏi đào sâu:** 
  * *Hỏi xoáy:* Làm sao `@ControllerAdvice` biết bắt đúng loại lỗi? *(Đáp: Nhờ `@ExceptionHandler(TenClassLoi.class)`, ví dụ bắt riêng `MethodArgumentNotValidException` cho lỗi DTO).*

**3. Mẫu thiết kế DTO (Data Transfer Object)**
* **Ý chính giải thích:**
  * Tính bảo mật: Che giấu các trường nhạy cảm của Entity (như `password` của User).
  * Tối ưu băng thông mạng.
  * Ngăn chặn lỗi vòng lặp vô hạn (Infinite Recursion) khi parse JSON của các bảng có quan hệ OneToMany/ManyToOne.
* **🔥 Câu hỏi đào sâu:**
  * *Hỏi xoáy:* Map dữ liệu từ Entity sang DTO bằng tay hay dùng thư viện? *(Đáp: Dùng thư viện như ModelMapper, MapStruct, hoặc viết hàm builder/getter setter thủ công tuỳ team).*

**4. Kế thừa JPA (`@MappedSuperclass`)**
* **Ý chính giải thích:**
  * Gom các cột chung (`createdAt`, `updatedAt`) vào lớp `BaseEntity`.
  * Các Entity khác `extends` lớp này thì Database sẽ tự động có các cột đó.
* **🔥 Câu hỏi đào sâu:**
  * *Hỏi xoáy:* Nếu quên gọi `setCreatedAt` thì data bị Null à? *(Đáp: Không, em dùng `@EntityListeners(AuditingEntityListener.class)` kết hợp `@CreatedDate` để Spring Boot tự điền thời gian lúc Insert).*

---

## 🛡️ Thành viên 2 - Security & User Management

**1. Luồng đi của Spring Security Filter Chain**
* **Ý chính giải thích:**
  * Mọi Request đi qua 1 chuỗi các Filter.
  * Tự custom `JwtAuthenticationFilter` (kế thừa `OncePerRequestFilter`).
  * Nhiệm vụ của Filter: Móc Token từ Header `Authorization` -> Giải mã -> Set quyền vào `SecurityContextHolder`.
* **🔥 Câu hỏi đào sâu:**
  * *Hỏi xoáy:* `OncePerRequestFilter` khác gì `Filter` thường? *(Đáp: Nó đảm bảo Filter chỉ chạy đúng 1 lần duy nhất cho mỗi Request, tránh bị vòng lặp khi forward bên trong Spring).*

**2. JWT (JSON Web Token) và cơ chế Stateless**
* **Ý chính giải thích:**
  * Cấu trúc 3 phần: Header, Payload, Signature.
  * Stateless (Không trạng thái): Server xác thực bằng cách lấy Header+Payload băm với `Secret Key` xem có khớp Signature không, KHÔNG CẦN chọc xuống Database.
* **🔥 Câu hỏi đào sâu:**
  * *Hỏi xoáy:* Nếu user bị lộ Token, làm sao để thu hồi (Revoke) ngay lập tức khi JWT là Stateless? *(Đáp: Khó thu hồi ngay. Giải pháp là đặt hạn sử dụng (Expire time) của Access Token thật ngắn (15 phút), kết hợp lưu Refresh Token ở Database để kiểm soát).*

**3. Mã hóa mật khẩu BCrypt**
* **Ý chính giải thích:**
  * Khác với MD5 (mã hóa tĩnh, dễ bị dò bằng từ điển Rainbow Table).
  * BCrypt tự động thêm chuỗi muối (Salt) ngẫu nhiên, nên cùng 1 mật khẩu mã hóa 10 lần ra 10 chuỗi khác nhau.
* **🔥 Câu hỏi đào sâu:**
  * *Hỏi xoáy:* Mã hóa ra chuỗi khác nhau thì lúc Login làm sao đối chiếu được? *(Đáp: BCrypt giấu thuật toán Salt bên trong chuỗi Hash. Hàm `matches()` của Spring tự biết cách bóc tách Salt ra để băm lại mật khẩu người dùng nhập và so sánh).*

---

## 📂 Thành viên 3 - Document Processing & Data Ingestion

**1. Giao tiếp API sang Python (WebClient/RestTemplate)**
* **Ý chính giải thích:**
  * Dùng WebClient gửi HTTP POST sang Python FastAPI kèm chuỗi text.
  * Python trả về mảng `float[]` (Vector), Java hứng và lưu.
* **🔥 Câu hỏi đào sâu:**
  * *Hỏi xoáy:* File tài liệu dài quá, lúc cắt (chunking) lỡ cắt giữa chừng một câu thì sao? *(Đáp: Cần cấu hình `overlap` (phần giao nhau) giữa các chunk, ví dụ chunk 200 từ, overlap 50 từ để không làm đứt mạch ngữ nghĩa).*

**2. Tương tác Qdrant Vector DB & Metadata (Payload)**
* **Ý chính giải thích:**
  * Gửi Vector lưu vào Qdrant.
  * Gắn kèm Payload (thông tin đi kèm) như `subject_id` (Mã môn học) và `chunk_id`.
* **🔥 Câu hỏi đào sâu:**
  * *Hỏi xoáy:* Tại sao phải lưu `chunk_id` vào Payload trên Qdrant trong khi Supabase đã có? *(Đáp: Qdrant chỉ để tìm kiếm Vector. Tìm xong nó trả về `chunk_id`. Từ `chunk_id` đó em mới chọc lại vào Supabase (Database chính) để lấy nội dung text hiển thị cho người dùng).*

---

## 🧠 Thành viên 4 - RAG Orchestrator (AI Integration)

**1. Truy vấn Vector Search với Qdrant Filter**
* **Ý chính giải thích:**
  * Dùng thuật toán ANN (Approximate Nearest Neighbor) tính khoảng cách Cosine.
  * Dùng `Filter` ép Qdrant chỉ tìm kiếm trên những chunk có `subject_id` khớp với môn học hiện tại.
* **🔥 Câu hỏi đào sâu:**
  * *Hỏi xoáy:* Tại sao không lấy hết tài liệu đưa cho AI đọc mà phải đi tìm Top K Vector? *(Đáp: Vì Prompt của AI (Context Window) có giới hạn số lượng Token. Nhét quá nhiều sẽ bị báo lỗi vượt quá giới hạn và cực kỳ tốn tiền/chậm).*

**2. Kỹ thuật Query Rewriting**
* **Ý chính giải thích:**
  * Dùng LLM nhỏ siêu tốc (Groq 8B) đọc lịch sử chat để viết lại câu hỏi trống không của User thành câu hoàn chỉnh. (VD: "Nó là gì?" -> "Interface là gì?").
  * Mang câu đã Rewrite đi Vector hóa thì Qdrant mới tìm đúng.
* **🔥 Câu hỏi đào sâu:**
  * *Hỏi xoáy:* Lịch sử chat lấy ở đâu? Lấy hết từ đầu đến cuối à? *(Đáp: Lấy từ bảng `CHAT_MESSAGES` trong DB, nhưng em chỉ lấy LIMIT 5 cặp hội thoại gần nhất để tránh tràn bộ nhớ Prompt).*

---

## 🐍 Thành viên 5 - AI Bridge & Fine-tuning

**1. Xử lý Timeout giữa Java và Python**
* **Ý chính giải thích:**
  * Quá trình Model Python sinh chữ có thể mất vài chục giây.
  * HTTP Client của Java mặc định sẽ ngắt kết nối (Timeout) quá sớm. Cần cấu hình `ReadTimeout` của WebClient/RestTemplate lên mức an toàn (60s).
* **🔥 Câu hỏi đào sâu:**
  * *Hỏi xoáy:* Nếu Java đã Timeout ngắt kết nối rồi, thì con Python bên kia có dừng sinh chữ không? *(Đáp: KHÔNG. Python vẫn chạy ngầm tốn tài nguyên trừ khi mình tự code bắt sự kiện Client Disconnect ở FastAPI).*

**2. Xử lý JSON (Jackson) trong giao tiếp**
* **Ý chính giải thích:**
  * Python trả về Text dạng JSON.
  * Java hứng bằng thư viện Jackson `ObjectMapper`, tự động phân tích và gán giá trị vào các thuộc tính (fields) của class DTO tương ứng.
* **🔥 Câu hỏi đào sâu:**
  * *Hỏi xoáy:* Nếu Python trả về thêm 1 trường dữ liệu mới mà DTO của Java không khai báo thì Spring Boot có báo lỗi sập không? *(Đáp: Mặc định là CÓ (UnrecognizedPropertyException). Phải gắn thêm annotation `@JsonIgnoreProperties(ignoreUnknown = true)` trên class DTO để nó lơ đi những trường không quen).*

---

## 📊 Thành viên 6 - Analytics & Evaluation

**1. Lấy số liệu vẽ biểu đồ (Spring Data JPA)**
* **Ý chính giải thích:**
  * Không dùng vòng lặp Java (`for`) để tính toán vì sẽ tràn RAM (OOM).
  * Viết câu `@Query` (JPQL hoặc Native) để cơ sở dữ liệu tự tính toán (Dùng hàm `AVG`, `COUNT`). Java chỉ việc nhận 1 con số kết quả.
* **🔥 Câu hỏi đào sâu:**
  * *Hỏi xoáy:* Bảng Message có 1 triệu dòng, câu lệnh `SELECT AVG(latency)` chạy quá lâu làm sập API thì tối ưu thế nào? *(Đáp: Cần đánh Index (Chỉ mục) cho cột `approach` và `latency`. Hoặc chuyển sang chạy Batch Job tính toán ngầm mỗi đêm rồi lưu ra 1 bảng thống kê riêng).*

**2. Auto Evaluation (Đánh giá tự động)**
* **Ý chính giải thích:**
  * Benchmark gọi Ragas rất lâu, dễ đứt gãy kết nối.
  * Chuyển logic tính toán sang chạy nền (Bất đồng bộ - Asynchronous).
* **🔥 Câu hỏi đào sâu:**
  * *Hỏi xoáy:* Cấu hình Bất đồng bộ trong Spring Boot bằng cách nào? *(Đáp: Thêm `@EnableAsync` ở class cấu hình chính, và đánh `@Async` lên phương thức thực thi Benchmark. Nó sẽ tự bóc ra một Thread (luồng) mới để chạy ngầm).*
