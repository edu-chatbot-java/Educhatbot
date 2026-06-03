# Lớp Nền Tảng (Core Common Module) - Quản lý bởi TV1 (Leader)

⚠️ **CẢNH BÁO: TẤT CẢ CÁC THÀNH VIÊN TRƯỚC KHI CODE PHẢI ĐỌC FILE NÀY!** ⚠️

Thư mục `common` chứa các quy ước toàn cục của hệ thống (Hiến pháp dự án). Việc tuân thủ các quy định dưới đây là **BẮT BUỘC**, nếu vi phạm code sẽ không thể compile hoặc bị reject khi pull request.

## 1. Quy định về Database Entity (JPA)
Bất kỳ khi nào tạo một bảng mới trong CSDL (User, Document, Message...):
- Entity **BẮT BUỘC BẮT BUỘC** phải `extends BaseEntity`.
- Không được tự khai báo các trường `id`, `created_at`, `updated_at`. Spring Data JPA sẽ tự động lo việc này.
- *Ví dụ:* `public class User extends BaseEntity { ... }`

## 2. Quy định về Dữ liệu Trả về (API Response)
Controller của các API **KHÔNG ĐƯỢC** trả về `String`, `List`, hay `Object` thô.
- Tất cả API đều phải trả về đối tượng `ResponseEntity<ApiResponse<T>>`.
- *Ví dụ:* 
  ```java
  return ResponseEntity.ok(ApiResponse.builder()
          .success(true)
          .message("Thành công")
          .data(yourData)
          .build());
  ```

## 3. Quy định về Xử lý Lỗi (Exception Handling)
- **Tuyệt đối không dùng `try-catch` để in log chay** rồi trả về giá trị null gây lỗi Frontend.
- Hãy cứ mạnh dạn văng lỗi bằng lệnh `throw new RuntimeException("Lỗi gì đó");`.
- `GlobalExceptionHandler` trong thư mục này đã được cài đặt để tự động "bắt" mọi lỗi bạn ném ra và chuyển nó thành cục JSON chuẩn với mã Code tương ứng (Ví dụ: 400 Bad Request, 500 Internal Server Error).

## 4. Quy định về Giao tiếp Qdrant (Hợp đồng giữa TV3 và TV4)
- Khi **TV3** đẩy (ingest) Vector lên Qdrant, phần payload **bắt buộc** phải dùng cấu trúc của `QdrantPayloadDTO`. Không được tự bịa ra trường mới. (Phải có `chunkId`, `subjectId`, `content`).
- Khi **TV4** đọc (retrieve) Vector từ Qdrant về, phải ép kiểu (parse) payload về đúng đối tượng `QdrantPayloadDTO` để lấy dữ liệu. Mọi thay đổi ở class này phải được sự đồng ý của cả 2 bên và Leader (TV1).
