package com.shop.demo.dto;

public record CreateAddressRequest(
        String fullName,
        String phone,
        String street,
        String city,
        String state,
        String pincode,
        String landmark,
        boolean isDefault

) {

}
