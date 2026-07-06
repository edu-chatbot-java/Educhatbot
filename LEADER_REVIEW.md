# Ghi chú Cập nhật từ Leader (TV1) - Đợt Finalize System

Gửi các thành viên (TV2, TV3, TV4, TV6),
Trong phiên làm việc cuối cùng nhằm chuẩn bị hệ thống lên Production để bảo vệ đồ án, tôi đã trực tiếp vào review và **sửa/tái cấu trúc** một số phần code của các bạn để hệ thống đạt chuẩn Enterprise đúng như thiết kế trong `SR.md`. 

Dưới đây là chi tiết những gì tôi đã sửa trong code của từng người, yêu cầu mọi người pull nhánh `dev` mới nhất về và đọc kỹ:

### 1. Thành viên 2 (Auth)
- **Tình trạng cũ:** Giao diện ổn, nhưng chưa rõ luồng phân quyền cấp tài khoản.
- **Những gì tôi đã can thiệp:**
  - Giữ nguyên giao diện `AuthPage`, nhưng chốt lại luồng: Việc đăng ký ngoài web mặc định sẽ là `STUDENT`.
  - Tránh việc tự cấp quyền bừa bãi. Việc nâng cấp lên `TEACHER` hoặc `ADMIN` hiện tại sẽ do Admin thực hiện trực tiếp trong Dashboard quản trị.

### 2. Thành viên 3 (Document Management)
- **Tình trạng cũ:** `TeacherDashboard` vi phạm nghiệp vụ khi cho phép Giảng viên tự tạo môn học mới (sử dụng MOCK DATA). File `DocumentController` trên Backend bị khóa chặt quyền truy cập.
- **Những gì tôi đã can thiệp:**
  - **Frontend:** Xóa sổ hoàn toàn khối code "Thêm môn học mới" và các MOCK DATA liên quan. Giảng viên giờ đây chỉ được chọn môn học từ list thả xuống có sẵn. Căn chỉnh lại giao diện.
  - **Backend:** Cập nhật file `DocumentController.java` thành `@PreAuthorize("hasAnyRole('ADMIN', 'TEACHER')")` để Giảng viên có quyền lấy danh sách và upload file thành công.

### 3. Thành viên 4 (Chatbot / RAG)
- **Tình trạng cũ:** Code phần Chat RAG hoạt động tốt nhưng lại thiếu mất Repository Method, làm ảnh hưởng trực tiếp đến module Thống kê của TV6 (chặn data flow).
- **Những gì tôi đã can thiệp:**
  - Bổ sung thêm hàm `findByUserRating(Integer rating)` vào `ChatMessageRepository.java` để TV6 có thể lấy được danh sách các đoạn Chat 5 sao nhằm xuất file huấn luyện JSONL.

### 4. Thành viên 6 (Analytics & Admin Dashboard)
- **Tình trạng cũ:** Code chứa toàn Mock Data cứng trong Java (`AnalyticsServiceImpl`). Giao diện AdminDashboard chưa tối ưu UI/UX, và không có tính năng khóa/đổi quyền/xóa User.
- **Những gì tôi đã can thiệp:**
  - **Backend (Analytics):** 
    - Đập bỏ toàn bộ Mock Data. Gọi hàm `count()` từ Repository vào Dashboard.
    - Cấu hình kiến trúc Dual-LLM: Gắn API **OpenRouter (Gemma)** vào `LangChain4jConfig` để chạy Auto-Eval (LLM-as-a-judge) nhằm chấm điểm độ chính xác thực tế.
  - **Backend (Admin CRUD):** Khai báo cờ `isActive` vào `UserDTO`, bổ sung 3 API (Đổi quyền, Khóa tài khoản, Xóa tài khoản) vào `AdminController.java`.
  - **Frontend (AdminDashboard):** Lột xác toàn bộ giao diện thành hệ thống Tabs (Overview, Documents, Users) sang trọng. Tích hợp tính năng quản lý Users trực tiếp trên bảng (Dropdown đổi quyền, Icon Khóa/Xóa). Tích hợp đồ thị Recharts bằng dữ liệu thật.

---
**Nhiệm vụ tiếp theo của Team:**
1. Pull nhánh `dev` mới nhất về máy ngay lập tức.
2. Build và test luồng mới trên Local.
3. Xác nhận để tôi Deploy bản Gold này lên Google Cloud Run. 
4. Tập dượt kịch bản Demo theo đúng tiến độ báo cáo!
