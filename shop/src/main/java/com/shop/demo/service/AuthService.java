package com.shop.demo.service;

import com.shop.demo.dto.AuthResponse;
import com.shop.demo.dto.LoginRequest;
import com.shop.demo.dto.RegisterUserRequest;
import com.shop.demo.exception.BadRequestException;
import com.shop.demo.model.User;
import com.shop.demo.repository.UserRepository;
import com.shop.demo.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public AuthResponse register(RegisterUserRequest request) {
        if (request.name() == null || request.name().isBlank()) {
            throw new BadRequestException("Name cannot be blank");
        }
        if (request.email() == null || request.email().isBlank()) {
            throw new BadRequestException("Email cannot be blank");
        }
        if (request.password() == null || request.password().length() < 6) {
            throw new BadRequestException("Password must be at least 6 characters");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new BadRequestException("Email already registered");
        }
        String hashedPassword = passwordEncoder.encode(request.password());
        User user = new User(request.name(), request.email(), hashedPassword);
        User saved = userRepository.save(user);

        String token = jwtService.generateToken(saved.getId(), saved.getEmail(), saved.getRole());
        return new AuthResponse(token, saved.getId(), saved.getName(), saved.getEmail());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email()).orElseThrow(() -> new BadRequestException("Invalid email or password"));
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BadRequestException("Invalid email or password");
        }
        String token = jwtService.generateToken(user.getId(), user.getEmail(),user.getRole());
        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail());
    }
}
