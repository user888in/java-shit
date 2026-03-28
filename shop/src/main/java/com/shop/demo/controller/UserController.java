package com.shop.demo.controller;

import com.shop.demo.dto.ChangePasswordRequest;
import com.shop.demo.dto.RegisterUserRequest;
import com.shop.demo.dto.UpdateProfileRequest;
import com.shop.demo.dto.UserResponse;
import com.shop.demo.model.User;
import com.shop.demo.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMyProfile(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(UserResponse.from(currentUser));
    }

    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateMyProfile(@RequestBody UpdateProfileRequest request, @AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(userService.updateProfile(request, currentUser));
    }

    @PatchMapping("/me/password")
    public ResponseEntity<Void> changePassword(@RequestBody ChangePasswordRequest request, @AuthenticationPrincipal User currentUser) {
        userService.changePassword(request, currentUser);
        return ResponseEntity.noContent().build();
    }
}
