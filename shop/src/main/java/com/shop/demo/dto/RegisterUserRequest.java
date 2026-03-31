package com.shop.demo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterUserRequest(
        @NotBlank(message = "name cannot be blank")
        String name,
        @NotBlank(message = "email cannot be blank")
        @Email(message = "invalid email format")
        String email,
        @NotBlank(message = "password cannot be blank")
        @Size(min = 6, message = "password must be at least 6 characters")
        String password) {

}
