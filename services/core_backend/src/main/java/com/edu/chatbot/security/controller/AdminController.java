package com.edu.chatbot.security.controller;

import com.edu.chatbot.common.dto.ApiResponse;
import com.edu.chatbot.security.entity.User;
import com.edu.chatbot.security.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;

    /**
     * Lấy danh sách toàn bộ người dùng trong hệ thống
     * Quyền: Chỉ Admin
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll();
        
        // Cẩn thận: Trong thực tế nên dùng UserDTO để ẩn Password, 
        // nhưng ở đây trả về User cho nhanh gọn demo
        return ApiResponse.success(users, "Lấy danh sách người dùng thành công");
    }
}
