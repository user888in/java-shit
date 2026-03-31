package com.shop.demo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UpdateProfileRequest(
        @NotBlank(message = "name cannot be blank")
        String name,
        @Email(message = "invalid email format")
        String email) {
}
