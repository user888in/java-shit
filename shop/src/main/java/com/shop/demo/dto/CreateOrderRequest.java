package com.shop.demo.dto;

import com.shop.demo.model.Address;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.math.BigDecimal;
import java.util.List;

public record CreateOrderRequest(
        @NotEmpty(message = "order must have at least one item")
        @Valid // nested validation for each item
        List<OrderItemRequest> items,
        Address address
) {
}
