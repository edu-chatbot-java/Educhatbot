package com.edu.chatbot.chat.controller;

import com.edu.chatbot.common.dto.ApiResponse;
import com.edu.chatbot.common.entity.Subject;
import com.edu.chatbot.common.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectRepository subjectRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Subject>>> getAllSubjects() {
        return ResponseEntity.ok(ApiResponse.success(subjectRepository.findAll()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Subject>> getSubjectById(@PathVariable Long id) {
        return subjectRepository.findById(id)
                .map(subject -> ResponseEntity.ok(ApiResponse.success(subject)))
                .orElse(ResponseEntity.notFound().build());
    }
}
