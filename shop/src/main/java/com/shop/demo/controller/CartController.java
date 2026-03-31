package com.shop.demo.controller;

import com.shop.demo.dto.AddToCartRequest;
import com.shop.demo.dto.CartResponse;
import com.shop.demo.dto.OrderResponse;
import com.shop.demo.model.User;
import com.shop.demo.service.CartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {
    private final CartService cartService;

    @GetMapping
    public ResponseEntity<CartResponse> getCart(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(cartService.getCart(user));
    }

    @PostMapping("/add")
    public ResponseEntity<CartResponse> addToCart(@Valid @RequestBody AddToCartRequest request, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(cartService.addToCart(request, user));
    }

    @PatchMapping("items/{itemId}")
    public ResponseEntity<CartResponse> updateQuantity(@PathVariable Long itemId, @RequestParam Integer quantity, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(cartService.updateQuantity(itemId, quantity, user));
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<CartResponse> removeItem(@PathVariable Long itemId, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(cartService.removeItem(itemId, user));
    }

    @DeleteMapping("/clear")
    public ResponseEntity<Void> clearCart(@AuthenticationPrincipal User user) {
        cartService.clearCart(user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/checkout")
    public ResponseEntity<OrderResponse> checkout(@RequestParam Long addressId, @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(cartService.checkout(addressId, user));
    }
}
