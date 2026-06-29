# Tài Liệu Đặc Tả Bổ Sung (SR2) - Hướng Dẫn Tích Hợp Frontend

Tài liệu này (SR2) được sinh ra để hỗ trợ nhóm phát triển Frontend (Web React/Vue hoặc Mobile) nắm bắt cấu trúc API và tiến hành ghép nối giao diện với Backend Java đã được triển khai chính thức lên Đám mây (Google Cloud Run).

---

## 1. Thông Tin Môi Trường (Production)
Frontend không gọi vào `localhost` nữa. Các bạn phải đổi biến môi trường `BASE_URL` trong Frontend thành đường link sau:

- **Base URL Backend (Chính thức):** `https://edu-backend-35971955178.asia-northeast3.run.app`

> ⚠️ **LƯU Ý CỰC KỲ QUAN TRỌNG:** Tất cả các API (ngoại trừ Đăng ký/Đăng nhập) đều yêu cầu đính kèm JWT Token vào Header của mọi request:
> `Authorization: Bearer <CHUỖI_TOKEN>`

---

## 2. Danh Sách Các API Cốt Lõi Frontend Cần Tích Hợp
*(Chi tiết các trường request/response các bạn Frontend có thể xem trong file `test-all.http` ở thư mục gốc)*

### 2.1. Phân hệ Xác Thực (Authentication)
*Nhiệm vụ Frontend: Làm màn hình Login/Register, lưu chuỗi JWT Token vào `LocalStorage` hoặc `SessionStorage` để xài cho các màn hình khác.*
- **Đăng ký (Sinh viên):** `POST /api/auth/register`
- **Đăng nhập:** `POST /api/auth/login` (Sẽ trả về chuỗi token).

### 2.2. Phân hệ Quản Lý Tài Liệu PDF (Dành riêng cho Màn hình Giảng viên/Admin)
*Nhiệm vụ Frontend: Làm màn hình Upload File PDF/Docx cho Giảng viên.*
- **Tải file lên hệ thống:** `POST /api/documents/upload`
  - **Body dạng `multipart/form-data`**: chứa `file` (File nhị phân) và `subjectId` (ID môn học).
  - **Lưu ý về UX (Trải nghiệm người dùng):** Vì quá trình nhai file PDF và băm vector trên Server diễn ra khá tốn thời gian (tùy dung lượng file), Frontend BẮT BUỘC phải làm màn hình Loading (vòng xoay hoặc thanh Progress) chờ khoảng 5-15 giây để báo cho Giảng viên không được tắt trình duyệt.

### 2.3. Phân hệ Chatbot AI (Giao diện chính của Sinh Viên)
*Nhiệm vụ Frontend: Làm giao diện khung chat giống giao diện của ChatGPT.*
- **Bước 1: Tạo phiên Chat mới:**
  `POST /api/chat/sessions` (Truyền `subjectId` môn học và `title`). Sẽ nhận về `sessionId`.
- **Bước 2: Gửi tin nhắn Chat & Nhận câu trả lời của AI:**
  `POST /api/chat/sessions/{sessionId}/messages`
  ```json
  {
    "sessionId": 1,
    "question": "ArrayList là gì?",
    "approach": "RAG" // Hoặc "FINETUNE"
  }
  ```
  - **Lưu ý CỰC KỲ QUAN TRỌNG về UI/UX (Fake Typewriter):** Backend hiện đang dùng cơ chế Block (Đồng bộ), tức là nó sẽ đợi AI sinh xong toàn bộ chữ (mất khoảng 2s - 4s) rồi mới gói thành 1 cục JSON ném về Frontend một lần duy nhất. **KHÔNG CÓ STREAMING TỪNG TOKEN**.
  - **Cách xử lý của Frontend:** Để tạo cảm giác AI đang nhả từng chữ giống ChatGPT, Frontend hãy dùng thủ thuật "Fake Typewriter": Nhận nguyên cục Text từ JSON, cắt thành mảng các từ (words), rồi dùng `setInterval` cứ mỗi 20ms nhả 1 từ ra màn hình. Lừa tình cực mạnh nhưng cực kỳ hiệu quả mà Backend không phải gánh luồng Streaming phức tạp!
- **Bước 3: Lấy lại Lịch sử Chat cũ:**
  `GET /api/chat/sessions/{sessionId}/messages` (Tải lại lịch sử tin nhắn khi F5 trang).

### 2.4. Phân hệ Đánh giá (Feedback)
*Nhiệm vụ Frontend: Thêm 2 nút Thích (👍) / Không thích (👎) dính sát dưới mỗi bóng bóng chat trả lời của BOT.*
- **Gửi Feedback:** `POST /api/feedback/submit`

---

## 3. Mã Nguồn Mẫu Dành Cho Frontend (Axios / Fetch)

**Ví dụ Gửi câu hỏi Chat bằng JavaScript (Hàm Fetch gốc):**
```javascript
const sendChatMessage = async (sessionId, question) => {
  // Lấy token đã lưu lúc Login
  const token = localStorage.getItem("jwt_token");
  
  // Hiển thị Icon Loading / Typing trên UI...
  setBotTyping(true);

  try {
    const response = await fetch(`https://edu-backend-35971955178.asia-northeast3.run.app/api/chat/sessions/${sessionId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` // Bắt buộc
      },
      body: JSON.stringify({
        sessionId: sessionId,
        question: question,
        approach: "RAG"
      })
    });

    const data = await response.json();
    if (data.success) {
      // In câu trả lời của BOT ra màn hình Chat
      console.log("BOT Answer:", data.data.message.content);
      
      // (Nâng cao) In ra Nguồn trích dẫn từ file PDF (để minh bạch)
      console.log("Sources:", data.data.sources); 
    }
  } catch (error) {
    console.error("Lỗi mất mạng hoặc Bot chết:", error);
  } finally {
    setBotTyping(false); // Tắt Icon Loading
  }
}
```

---

## 4. Luồng Chạy Backend (Frontend cần hiểu qua để xử lý UX)
- **Cách RAG hoạt động:** Khi người dùng gửi 1 câu hỏi lên, Backend không nhả câu trả lời ngay. Nó sẽ biến câu hỏi thành Vector -> Tìm trong Database Vector lấy 5 đoạn văn bản từ PDF khớp nhất -> Ném cả câu hỏi + văn bản đó sang Mỹ (Groq Llama 3.1) -> Groq đọc hiểu và nhả câu trả lời về cho Java -> Java nhả về cho Frontend.
- Tốc độ cực nhanh (trung bình 2-3s) nhờ kiến trúc Batching. Do đó Frontend chỉ cần gọi API duy nhất 1 lần, mọi kỹ thuật phức tạp ở giữa Java đã lo hết.

---

## 5. Phân Công Nhiệm Vụ Độc Lập Trên Frontend (Chống Merge Conflict)

Dựa theo bản Đặc tả Hệ thống (SRS), để đảm bảo các thành viên có thể code song song trên cùng 1 repo mà **không bao giờ bị lỗi Merge Conflict**, mỗi người sẽ được "khoanh vùng" sở hữu các file riêng biệt tương ứng với Module của mình.

### 5.1. TV2 - Nhóm Quản trị & Xác thực (Security & Identity)
- **Khu vực được phép sửa:**
  - File giao diện: `src/pages/AuthPage.jsx`, `src/App.jsx`, `src/index.css`, `tailwind.config.js`
- **Nhiệm vụ Frontend:**
  - Hoàn thiện và trang trí (Polish) giao diện Đăng nhập/Đăng ký cho đẹp mắt, hiện đại.
  - Quản lý State chung của ứng dụng (Dark/Light mode).
  - Có thể hỗ trợ các thành viên khác làm đẹp Component nhưng phải thông qua Pull Request.

### 5.2. TV3 - Nhóm Xử lý Tài liệu (Data Ingestion)
- **Khu vực được phép sửa:**
  - File giao diện: `src/pages/TeacherDashboard.jsx`
  - File gọi API: `src/services/document.service.js`
- **Nhiệm vụ Frontend:**
  - Thiết kế UI để Giảng viên quản lý môn học và tải lên file PDF/TXT.
  - Gọi API `POST /api/documents/upload`.
  - Hiển thị thanh Loading chờ Backend xử lý (Apache Tika, Chunking, Nhúng Vector).

### 5.3. TV4 - Nhóm Điều phối RAG (RAG Orchestrator)
- **Khu vực được phép sửa:**
  - File giao diện: `src/pages/StudentDashboard.jsx`
  - File CSS: Cập nhật component của mình nếu cần.
- **Nhiệm vụ Frontend:**
  - Bộ khung Chat cơ bản đã hoàn thành. TV4 chịu trách nhiệm làm bóng (Polish) UX/UI.
  - Cài đặt hiệu ứng "Fake Typewriter" (nhả từng chữ) cho tin nhắn của AI.
  - Tối ưu hiển thị Markdown và Code Snippet (phát hiện và highlight cú pháp lập trình).
  - Tinh chỉnh giao diện đánh giá A/B Testing trực quan hơn.

### 5.4. TV6 - Nhóm Thống kê & Đánh giá (Analytics)
- **Khu vực được phép sửa:**
  - File giao diện: `src/pages/AdminDashboard.jsx`
  - File gọi API: `src/services/admin.service.js` (Tự tạo mới file này)
- **Nhiệm vụ Frontend:**
  - Cài đặt thư viện vẽ biểu đồ (như Recharts hoặc Chart.js).
  - Thiết kế Dashboard vẽ biểu đồ so sánh Latency (RAG vs Fine-tuning) và Tỉ lệ thắng từ Blind Test.
  - Quản lý danh sách User và xem Audit Logs.

### 5.5. TV5 & Leader - Nhóm Mô hình AI (Fine-tuning & Đánh giá)
- **Khu vực làm việc:** Không yêu cầu viết code Web Frontend.
- **Nhiệm vụ tập trung:**
  - **TV5:** Chịu trách nhiệm hoàn toàn code Python (FastAPI). Huấn luyện (Fine-tune) mô hình, triển khai API cho Java gọi sang.
  - **Leader:** Chạy kịch bản Benchmark, thu thập kết quả vào Database. Dùng công cụ (như Postman hoặc `test-all.http`) để bắn hàng ngàn request đánh giá Faithfulness, Answer Relevancy, Recall/Precision.
  - **Cả hai:** Phối hợp phân tích dữ liệu, viết báo cáo so sánh kết luận cuối cùng giữa RAG và Finetune.

> 💡 **Quy tắc Vàng cho Team:** Luồng Routing và Đăng nhập (`App.jsx`, `AuthPage.jsx`) do TV2 phụ trách đã hoàn thiện. Các thành viên khác KHÔNG CẦN và KHÔNG ĐƯỢC đụng vào các file cấu hình gốc này để tránh phá vỡ luồng chung. Ai làm trang nào thì tạo Pull Request chỉ chứa file của trang đó!

---

## 6. Hướng Dẫn Bắt Đầu Dành Cho Team Frontend (Getting Started)

Đây là các bước cơ bản để các bạn (TV3, TV4, TV6) bắt đầu nhảy vào code phần việc của mình:

### 6.1. Khởi chạy dự án
1. Mở Terminal (Command Prompt / VS Code Terminal).
2. Di chuyển vào đúng thư mục frontend chính: `cd frontend` *(Lưu ý: Không dùng thư mục `frontend-demo` nữa).*
3. Cài đặt các gói thư viện (chỉ làm lần đầu): `npm install`
4. Khởi chạy server phát triển: `npm run dev`
5. Mở trình duyệt ở địa chỉ `http://localhost:5173`.

### 6.2. Hiểu luồng chạy (Cực kỳ quan trọng)
- **Đã dẹp bỏ lỗi CORS & Token:** Các bạn **KHÔNG CẦN** quan tâm đến việc đính kèm JWT Token hay lo lỗi CORS. File `src/services/api.js` đã tự động bắt và đính kèm Token vào Header cho mọi Request. Bạn chỉ việc gọi: `await api.get('/path')` hoặc `await api.post('/path', data)`.
- **Luồng Đăng nhập Mới:** TV2 đã thiết kế trang `AuthPage.jsx` có 2 tab rõ ràng "👨‍🎓 Sinh viên" và "👨‍🏫 Giảng viên". Nếu một tài khoản là Admin đăng nhập, nó sẽ tự đá vào `/admin`. Nếu không, nó sẽ ưu tiên đi theo Tab mà người dùng đang chọn. Điều này giúp các bạn dễ dàng test các màn hình Teacher/Student mà không sợ bị chặn.

### 6.3. Nguyên tắc khi Code Giao diện (UI/UX)
- Dự án sử dụng **Tailwind CSS**. Hạn chế viết CSS thuần (trừ khi bất khả kháng).
- Các icon trên giao diện được lấy từ thư viện **`lucide-react`** (Ví dụ: `<UploadCloud size={18} />`).
- Nếu muốn thêm màn hình loading, dùng các class có sẵn của Tailwind như `animate-pulse` hoặc `animate-spin`.
- **Luôn bọc Code trong Try/Catch:** Khi gọi API Backend, luôn dùng khối `try { ... } catch (error) { ... }` để hiển thị `alert()` thông báo lỗi, tránh tình trạng ứng dụng bị chết cứng (Crash) nếu mạng lag hoặc Backend lỗi.
