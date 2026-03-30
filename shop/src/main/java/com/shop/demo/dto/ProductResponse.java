package com.shop.demo.dto;

import com.shop.demo.model.Product;

import java.math.BigDecimal;

public record ProductResponse(Long id, String name, BigDecimal price, Integer stockQuantity, String imageUrl,
                              CategoryResponse categoryResponse) {
    public static ProductResponse from(Product product) {
        return new ProductResponse(product.getId(), product.getName(), product.getPrice(), product.getStockQuantity(), product.getImageUrl(), product.getCategory() != null ? CategoryResponse.from(product.getCategory()) : null);
    }

}
