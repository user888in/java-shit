package com.blog.service;

import com.blog.dto.PostRequest;
import com.blog.dto.PostResponse;
import com.blog.model.Post;
import com.blog.model.PostStatus;
import com.blog.model.User;
import com.blog.repository.PostRepository;
import com.blog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PostService {
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    // create
    public PostResponse createPost(PostRequest postRequest, String authorEmail) {
        User author = userRepository.findByEmail(authorEmail).orElseThrow(() -> new RuntimeException("user not found"));
        Post post = Post.builder()
                .title(postRequest.getTitle())
                .content(postRequest.getContent())
                .summary(postRequest.getSummary())
                .author(author)
                .status(PostStatus.DRAFT)
                .build();
        Post saved = postRepository.save(post);
        return mapToResponse(saved);
    }

    // get all published
    public List<PostResponse> getAllPublished() {
        return postRepository.findByStatus(PostStatus.PUBLISHED).stream().map(this::mapToResponse).toList();
    }

    // get one
    public PostResponse getPostById(Long id) {
        Post post = postRepository.findById(id).orElseThrow(() -> new RuntimeException("Post not found"));
        return mapToResponse(post);
    }

    // update
    public PostResponse updatePost(Long id, PostRequest postRequest, String authorEmail) {
        Post post = postRepository.findById(id).orElseThrow(() -> new RuntimeException("Post not found"));
        if (!post.getAuthor().getEmail().equals(authorEmail)) {
            throw new RuntimeException("Not authorized to update this post");
        }
        post.setTitle(postRequest.getTitle());
        post.setContent(postRequest.getContent());
        post.setSummary(postRequest.getSummary());

        return mapToResponse(postRepository.save(post));
    }

    public PostResponse publishPost(Long id, String authorEmail) {
        Post post = postRepository.findById(id).orElseThrow(() -> new RuntimeException("Post not found"));
        post.setStatus(PostStatus.PUBLISHED);
        return mapToResponse(postRepository.save(post));
    }

    public void deletePost(Long id, String requesterEmail) {
        Post post = postRepository.findById(id).orElseThrow(() -> new RuntimeException("Post not found"));
        if (!post.getAuthor().getEmail().equals(requesterEmail)) {
            throw new RuntimeException("Not authorized to delete the post");
        }
        postRepository.delete(post);
    }

    private PostResponse mapToResponse(Post post) {
        return PostResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .content(post.getContent())
                .summary(post.getSummary())
                .status(post.getStatus())
                .authorUsername(post.getAuthor().getUsername())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .commentCount(post.getComments() == null ? 0 : post.getComments().size())
                .build();
    }


}
