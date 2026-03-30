package com.shop.demo.dto;

public record CreateProductRequest(String name, Double price, Integer stockQuantity, String imageUrl, Long categoryId) {

}
