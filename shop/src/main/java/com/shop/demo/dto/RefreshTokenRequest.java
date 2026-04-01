package com.shop.demo.dto;

import jakarta.validation.constraints.NotBlank;

public record RefreshTokenRequest(
        @NotBlank(message = "refresh token cannot be blank")
        String refreshToken
        ) {
}
