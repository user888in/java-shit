package com.shop.demo.dto;

import com.shop.demo.model.Address;

import java.math.BigDecimal;
import java.util.List;

public record CreateOrderRequest(
        List<OrderItemRequest> items,
        Address address
) {
}
