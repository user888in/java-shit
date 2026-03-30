package com.shop.demo.dto;

import com.shop.demo.model.Address;

public record AddressResponse(
        Long id,
        String fullName,
        String phone,
        String street,
        String city,
        String state,
        String pincode,
        String landmark,
        boolean isDefault
) {
    public static AddressResponse from(Address address) {
        return new AddressResponse(
                address.getId(),
                address.getFullName(),
                address.getPhone(),
                address.getStreet(),
                address.getCity(),
                address.getState(),
                address.getPincode(),
                address.getLandmark(),
                address.isDefault()
        );
    }
    // Snapshot string for order history
    public String toSnapshot() {
        return fullName + ", " + phone + ", " + street + ", " + city + ", " + state + " - " + pincode;
    }
}
