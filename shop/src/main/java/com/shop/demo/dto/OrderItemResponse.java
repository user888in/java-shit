package com.shop.demo.dto;

import com.shop.demo.model.OrderItem;

import java.math.BigDecimal;

public record OrderItemResponse(
        Long id,
        Long productId,
        String productName,
        BigDecimal priceAtPurchase,
        Integer quantity,
        BigDecimal subtotal
) {
    public static OrderItemResponse from(OrderItem item) {
        return new OrderItemResponse(
                item.getId(),
                item.getProductId(),
                item.getProductName(),
                item.getPriceAtPurchase(),
                item.getQuantity(),
                item.getSubtotal()
        );
    }
}
