# Tài Liệu Đặc Tả Bổ Sung (SR2) - Hướng Dẫn Tích Hợp Frontend

Tài liệu này (SR2) được sinh ra để hỗ trợ nhóm phát triển Frontend (Web React/Vue hoặc Mobile) nắm bắt cấu trúc API và tiến hành ghép nối giao diện với Backend Java đã được triển khai chính thức lên Đám mây (Google Cloud Run).

---

## 1. Thông Tin Môi Trường (Production)
Frontend không gọi vào `localhost` nữa. Các bạn phải đổi biến môi trường `BASE_URL` trong Frontend thành đường link sau:

- **Base URL Backend (Chính thức):** `https://backend-35971955178.asia-northeast3.run.app`

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
    const response = await fetch(`https://backend-35971955178.asia-northeast3.run.app/api/chat/sessions/${sessionId}/messages`, {
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
