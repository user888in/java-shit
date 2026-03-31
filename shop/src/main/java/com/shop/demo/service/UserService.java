package com.shop.demo.service;

import com.shop.demo.dto.ChangePasswordRequest;
import com.shop.demo.dto.RegisterUserRequest;
import com.shop.demo.dto.UpdateProfileRequest;
import com.shop.demo.dto.UserResponse;
import com.shop.demo.exception.BadRequestException;
import com.shop.demo.exception.ResourceNotFoundException;
import com.shop.demo.model.User;
import com.shop.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    @Transactional
    public UserResponse registerUser(RegisterUserRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BadRequestException("Email already registered :" + request.email());
        }
        String hashed = passwordEncoder.encode(request.password());
        User user = new User(request.name(), request.email(), hashed);
        return UserResponse.from( userRepository.save(user));
    }

    public UserResponse getUser(Long id) {
        User user = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found " + id));
        return UserResponse.from(user);
    }
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(UserResponse::from)
                .toList();
    }
    public User findUserEntityById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }
    @Transactional
    public UserResponse updateProfile(UpdateProfileRequest request, User currentUser) {
        if (request.email() != null && !request.email().equals(currentUser.getEmail())) {
            if (userRepository.existsByEmail(request.email())) {
                throw new BadRequestException("Email already in use");
            }
            currentUser.setEmail(request.email());
        }
        currentUser.setName(request.name());
        return UserResponse.from(userRepository.save(currentUser));
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request, User currentUser) {
        if (!passwordEncoder.matches(request.currentPassword(), currentUser.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }
        if (request.newPassword() == null || request.newPassword().length() < 6) {
            throw new BadRequestException("New password must be at least 6 characters ");
        }
        currentUser.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(currentUser);
    }
}
