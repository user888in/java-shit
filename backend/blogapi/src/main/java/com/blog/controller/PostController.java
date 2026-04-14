package com.blog.controller;

import com.blog.dto.PostRequest;
import com.blog.dto.PostResponse;
import com.blog.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {
    private final PostService postService;

    @GetMapping
    public ResponseEntity<List<PostResponse>> getAllPublished() {
        return ResponseEntity.ok(postService.getAllPublished());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PostResponse> getPost(@PathVariable Long id) {
        return ResponseEntity.ok(postService.getPostById(id));
    }

    @PostMapping
    public ResponseEntity<PostResponse> createPost(@Valid @RequestBody PostRequest postRequest) {
        // hardcoded for now — Step 8 replaces this with real logged-in user
        String currentUserEmail = "test@blog.com";
        PostResponse response = postService.createPost(postRequest, currentUserEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PostResponse> updatePost(@PathVariable Long id, @Valid @RequestBody PostRequest postRequest) {
        String currentUserEmail = "test@blog.com";
        return ResponseEntity.ok(postService.updatePost(id, postRequest, currentUserEmail));
    }

    @PatchMapping("/{id}/publish")
    public ResponseEntity<PostResponse> publishPost(@PathVariable Long id) {
        String currentUserEmail = "test@blog.com";
        return ResponseEntity.ok(postService.publishPost(id, currentUserEmail));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable Long id) {
        String currentUserEmail = "test@blog.com";
        postService.deletePost(id, currentUserEmail);
        return ResponseEntity.noContent().build();
    }
}
