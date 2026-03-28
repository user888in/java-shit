package com.shop.demo.dto;

public record CreateReviewRequest(Long productId, Integer rating, String comment) {
}
