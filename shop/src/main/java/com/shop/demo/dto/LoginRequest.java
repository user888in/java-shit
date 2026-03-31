package com.shop.demo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record LoginRequest (
        @NotBlank(message = "email cannot be blank")
        @Email(message = "invalid email format")
        String email,
        @NotBlank(message = "password cannot be blank")
        String password){

}
