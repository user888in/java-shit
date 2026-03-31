package com.shop.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CreateAddressRequest(
        @NotBlank(message = "Full name cannot be blank")
        String fullName,
        @NotBlank(message = "Phone cannot be blank")
        @Pattern(regexp = "^[0-9]{10}$", message = "Phone must be 10 digits")
        String phone,
        @NotBlank(message = "Street cannot be blank")
        String street,
        @NotBlank(message = "City cannot be blank")
        String city,
        @NotBlank(message = "State cannot be blank")
        String state,
        @NotBlank(message = "Pincode cannot be blank")
        @Pattern(regexp = "^[0-9]{6}$", message = "Pincode must be 6 digits")
        String pincode,
        String landmark,
        boolean isDefault

) {

}
