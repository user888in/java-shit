package com.shop.demo.controller;

import com.shop.demo.dto.AddressResponse;
import com.shop.demo.dto.CreateAddressRequest;
import com.shop.demo.model.User;
import com.shop.demo.service.AddressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/addresses")
@RequiredArgsConstructor
public class AddressController {
    private final AddressService addressService;

    @GetMapping
    public ResponseEntity<List<AddressResponse>> getMyAddresses(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(addressService.getMyAddresses(user));
    }

    @PostMapping
    public ResponseEntity<AddressResponse> addAddress(@Valid @RequestBody CreateAddressRequest request, @AuthenticationPrincipal User user) {
        return ResponseEntity.status(HttpStatus.CREATED).body(addressService.addAddress(request, user));
    }

    @PatchMapping("/{id}/default")
    public ResponseEntity<AddressResponse> setDefault(@PathVariable Long id, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(addressService.setDefault(id, user));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAddress(@PathVariable Long id, @AuthenticationPrincipal User user) {
        addressService.deleteAddress(id, user);
        return ResponseEntity.noContent().build();
    }
}
