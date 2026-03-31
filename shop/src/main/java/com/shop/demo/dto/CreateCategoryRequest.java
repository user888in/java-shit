package com.shop.demo.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateCategoryRequest(
        @NotBlank(message = "category name cannot be blank")
        String name, String description, String imageUrl) {
    
}
