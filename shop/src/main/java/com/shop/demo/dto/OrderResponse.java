package com.shop.demo.dto;

import com.shop.demo.model.Order;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(Long id, UserResponse user, List<OrderItemResponse> items, BigDecimal totalPrice,
                            String status, String deliveryAddress, LocalDateTime createdAt) {
    public static OrderResponse from(Order order) { // from method converts Entity -> DTO
        return new OrderResponse(order.getId(),
                UserResponse.from(order.getUser()),
                order.getItems().stream().map(OrderItemResponse::from).toList(),
                order.getTotalPrice(),
                order.getStatus().name(),
                order.getDeliveryAddressSnapshot(),
                order.getCreatedAt());
    }

}
