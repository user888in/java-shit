package com.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PostRequest {
    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 200, message = "Title must be 3-200 characters")
    private String title;

    @NotBlank(message = "content is required")
    private String content;

    @NotBlank(message = "summary is required")
    @Size(max = 500, message = "Summary max 500 characters")
    private String summary;

}
