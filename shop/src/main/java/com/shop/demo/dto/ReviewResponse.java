package com.shop.demo.dto;

import com.shop.demo.model.Review;

import java.time.LocalDateTime;

public record ReviewResponse(Long id, String reviewerName, String productName, Integer rating, String comment,
                             LocalDateTime createdAt) {
    public static ReviewResponse from(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getUser().getName(),
                review.getProduct().getName(),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt()
        );
    }
}
