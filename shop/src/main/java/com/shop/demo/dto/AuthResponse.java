package com.shop.demo.dto;

public record AuthResponse(String token, String refreshToken, Long userId, String name, String email) {

}
