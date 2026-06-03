# Chiến Lược Quản Lý Nhánh (Git Flow & Branching Strategy)

Để đảm bảo 6 thành viên code cùng nhau trên 1 Repository (đặc biệt là trong cùng thư mục `core_backend`) mà không bị conflict hay ghi đè code của nhau, toàn team bắt buộc tuân thủ quy trình Git Flow dưới đây.

## 1. Cấu Trúc Nhánh (Branch Structure)

### 🌿 Nhánh Chính (Không ai được phép push thẳng code)
- **`main`**: Nhánh chứa code Production (Tuyệt đối ổn định). Chỉ Leader (TV1) mới được phép merge code vào đây khi chuẩn bị báo cáo/deploy.
- **`dev` (hoặc `develop`)**: Nhánh hội tụ (Integration Branch). Chứa code mới nhất của cả team. Mọi người sẽ lấy code từ nhánh này về để phát triển tiếp.

### 🌿 Nhánh Tính Năng (Feature Branches)
Khi một thành viên bắt tay vào làm một chức năng mới, bắt buộc phải tạo nhánh tính năng từ nhánh `dev`.
- **Cú pháp:** `feature/tên-thành-viên-tên-tính-năng`
- **Ví dụ:**
  - `feature/tv2-login-jwt` (TV2 làm luồng đăng nhập)
  - `feature/tv3-upload-document` (TV3 làm luồng upload tài liệu)
  - `feature/tv4-rag-chat` (TV4 làm luồng chat RAG)
  - `feature/tv5-finetune-api` (TV5 làm API FastAPI)
  - `feature/tv6-dashboard` (TV6 làm giao diện thống kê)

### 🌿 Nhánh Sửa Lỗi (Bugfix / Hotfix Branches)
- **Cú pháp:** `bugfix/tên-bug` hoặc `hotfix/tên-bug` (nếu lỗi khẩn cấp trên main).
- **Ví dụ:** `bugfix/tv4-fix-qdrant-filter`

---

## 2. Quy Trình Làm Việc Hằng Ngày (Daily Workflow)

⚠️ **Quy tắc Vàng:** Luôn luôn cập nhật nhánh `dev` trước khi tách nhánh mới!

### Bước 1: Lấy code mới nhất về
```bash
git checkout dev
git pull origin dev
```

### Bước 2: Tạo nhánh tính năng của riêng mình
```bash
git checkout -b feature/tv2-login-jwt
```
*(Bây giờ bạn có thể thoải mái code trong thư mục của mình)*

### Bước 3: Commit và đẩy code lên Github
```bash
git add .
git commit -m "feat(security): hoan thanh API login JWT"
git push origin feature/tv2-login-jwt
```

### Bước 4: Tạo Pull Request (PR)
1. Lên trang GitHub của dự án.
2. Bấm nút **Compare & pull request**.
3. Chọn Base branch là `dev` (Tuyệt đối KHÔNG chọn `main`).
4. Bấm Create Pull Request và tag Leader (TV1) vào review.

### Bước 5: Code Review & Merge
- TV1 (Leader) sẽ vào đọc code của bạn.
- Nếu thấy OKE, không làm gãy code của người khác, TV1 sẽ bấm **Merge pull request** để gộp code của bạn vào nhánh `dev`.
- Sau khi merge xong, bạn có thể xóa nhánh `feature/...` đó đi.

---

## 3. Quy Chuẩn Đặt Tên Commit (Commit Message Convention)
Mọi người cần thống nhất tiền tố khi ghi log commit để Leader dễ theo dõi:
- **`feat:`** Thêm tính năng mới (Vd: `feat: add User entity`)
- **`fix:`** Sửa một lỗi (bug) (Vd: `fix: jwt token expiration bug`)
- **`docs:`** Cập nhật tài liệu (Vd: `docs: update readme`)
- **`refactor:`** Sửa lại code nhưng không làm thay đổi tính năng (Vd: `refactor: clean up chat controller`)
- **`chore:`** Các công việc vặt (cấu hình pom.xml, docker...) (Vd: `chore: add langchain4j dependency`)
