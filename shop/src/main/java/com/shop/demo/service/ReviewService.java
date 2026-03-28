package com.shop.demo.service;

import com.shop.demo.dto.CreateReviewRequest;
import com.shop.demo.dto.ReviewResponse;
import com.shop.demo.exception.BadRequestException;
import com.shop.demo.exception.ResourceNotFoundException;
import com.shop.demo.model.Product;
import com.shop.demo.model.Review;
import com.shop.demo.model.User;
import com.shop.demo.repository.ProductRepository;
import com.shop.demo.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {
    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;

    @Transactional
    public ReviewResponse createReview(CreateReviewRequest request, User currentUser) {
        Product product = productRepository.findById(request.productId()).orElseThrow(() -> new ResourceNotFoundException("No product found with the id: " + request.productId()));
        if (request.rating() == null || request.rating() < 1 || request.rating() > 5) {
            throw new BadRequestException("Invalid rating");
        }
        if (reviewRepository.existsByUser_IdAndProduct_Id(currentUser.getId(), product.getId())) {
            throw new BadRequestException("Review already exists");
        }
        Review review = new Review(currentUser, product, request.rating(), request.comment());
        return ReviewResponse.from(reviewRepository.save(review));
    }

    @Transactional
    public void deleteReview(Long id, User currentUser) {
        Review review = reviewRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Review not found: " + id));
        if (!review.getUser().getId().equals(currentUser.getId())) {
            throw new BadRequestException("You can only delete your own reviews");
        }
        reviewRepository.deleteById(id);
    }

    public List<ReviewResponse> getProductReviews(Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product Not found: " + productId);
        }
        return reviewRepository.findByProduct_Id(productId).stream().map(ReviewResponse::from).toList();
    }
}
