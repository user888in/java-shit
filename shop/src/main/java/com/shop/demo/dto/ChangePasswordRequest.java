package com.shop.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank(message = "current password cannot be blank")
        String currentPassword,
        @NotBlank(message = "new password cannot be blank")
        @Size(message = "new password must be at least 6 characters")
        String newPassword) {

}
