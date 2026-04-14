package com.blog.repository;

import com.blog.model.Post;
import com.blog.model.PostStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByStatus(PostStatus status);
    List<Post> findByAuthorId(Long authorId);
    List<Post> findByTitleContainingIgnoreCase(String title);
}
