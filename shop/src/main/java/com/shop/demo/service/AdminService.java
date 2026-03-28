package com.shop.demo.service;

import com.shop.demo.dto.*;
import com.shop.demo.exception.BadRequestException;
import com.shop.demo.exception.ResourceNotFoundException;
import com.shop.demo.model.Order;
import com.shop.demo.model.OrderStatus;
import com.shop.demo.repository.OrderRepository;
import com.shop.demo.repository.ReviewRepository;
import com.shop.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor


public class AdminService {
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final ProductService productService;
    private final ReviewRepository reviewRepository;

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream().map(UserResponse::from).toList();
    }

    public PageResponse<OrderResponse> getAllOrders(int page, int size) {
        var pageable = PageRequest.of(page, Math.min(size,100), Sort.by("createdAt").descending());
        return PageResponse.from(orderRepository.findAll(pageable), OrderResponse::from);
    }

    public ProductResponse createProduct(CreateProductRequest request) {
        return productService.createProduct(request);
    }

    public void deleteProduct(Long id) {
        productService.deleteProduct(id);
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, String status) {
        Order order = orderRepository.findById(orderId).orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));
        try {
            order.setStatus(OrderStatus.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid status: " + status);
        }
        return OrderResponse.from(orderRepository.save(order));
    }

    public List<ReviewResponse> getAllReviews() {
        return reviewRepository.findAll().stream().map(ReviewResponse::from).toList();
    }
    public void deleteReview(Long id) {
        if (!reviewRepository.existsById(id)) {
            throw new ResourceNotFoundException("Review not found: " + id);
        }
        reviewRepository.deleteById(id);
    }
}
