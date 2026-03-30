package com.shop.demo.dto;

import com.shop.demo.model.Category;

public record CategoryResponse(
        Long id,
        String name,
        String description,
        String imageUrl,
        int productCount
) {
    public static CategoryResponse from(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getDescription(),
                category.getImageUrl(),
                category.getProducts().size()
        );
    }
}
