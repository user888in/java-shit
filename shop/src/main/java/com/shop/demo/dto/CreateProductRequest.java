package com.shop.demo.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateProductRequest(
        @NotBlank(message = "product name cannot be blank")
        String name,
        @NotNull(message = "price is required")
        @Positive(message = "price must be greater than zero")
        Double price,
        @NotNull(message = "stock quantity is required")
        @Min(value = 0, message = "stock cannot be negative")
        Integer stockQuantity,
        String imageUrl, Long categoryId) {


}
