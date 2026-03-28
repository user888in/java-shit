package com.shop.demo.dto;

import java.math.BigDecimal;
import java.util.List;

public record CreateOrderRequest(
        List<OrderItemRequest> items,
        String deliveryAddress
) {
}
