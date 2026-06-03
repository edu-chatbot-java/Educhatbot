# Security Module (Thành viên 2)

Package này chứa toàn bộ logic liên quan đến xác thực và phân quyền người dùng.

## Nhiệm vụ của TV2:
- Entity `User` (Kế thừa từ `BaseEntity`)
- Config Spring Security (`SecurityConfig`)
- JWT Filter (`JwtAuthenticationFilter`) và `JwtTokenProvider`
- Các Controller và Service cho Đăng ký, Đăng nhập, Refresh Token, Đăng xuất.
- Enum Role (`ROLE_STUDENT`, `ROLE_ADMIN`)
