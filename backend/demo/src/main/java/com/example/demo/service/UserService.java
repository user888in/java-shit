package com.example.demo.service;

import com.example.demo.dto.request.RegisterRequest;
import com.example.demo.dto.response.AuthResponse;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;
    private final JwtService jwtService;

    public UserService(UserRepository userRepository, BCryptPasswordEncoder bCryptPasswordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.bCryptPasswordEncoder = bCryptPasswordEncoder;
        this.jwtService = jwtService;
    }

    public User register(RegisterRequest request) {
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setRole("USER");
        user.setActive(true);
        user.setPassword(bCryptPasswordEncoder.encode(request.getPassword()));
        return userRepository.save(user);
    }

    public AuthResponse login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found..."));
        boolean isPasswordValid = bCryptPasswordEncoder.matches(password, user.getPassword());
        if (!isPasswordValid) {
            throw new RuntimeException("Invalid credentials...");
        }
        String accessToken = jwtService.generateAccessToken(user.getEmail());
        String refreshToken = jwtService.generateRefreshToken(user.getEmail());
        return new AuthResponse(accessToken, refreshToken, user.getEmail());
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found: " + email));
    }

    public User findOrCreateSocialUser(String email, String name, String provider, String providerId) {
        // Try to find existing user by email (for account linking)
        Optional<User> optionalUser = userRepository.findByEmail(email);
        User user;
        if (optionalUser.isPresent()) {
            user = optionalUser.get();
            // If the user is not already linked to a provider, link it
            if (user.getProvider() == null) {
                user.setProvider(provider);
                user.setProviderId(providerId);
                userRepository.save(user);
            }
            // If already linked, just use the existing user
        } else {
            // Check if a user with the same provider and providerId already exists (to avoid duplicates)
            Optional<User> optionalProviderUser = userRepository.findByProviderAndProviderId(provider, providerId);
            if (optionalProviderUser.isPresent()) {
                user = optionalProviderUser.get();
                // Optionally, update the email if it's different? But we found by email first, so this should not happen.
                // We'll just use the existing user.
            } else {
                // Create new user
                user = new User();
                user.setEmail(email);
                user.setName(name);
                user.setRole("USER");
                user.setActive(true);
                user.setProvider(provider);
                user.setProviderId(providerId);
                // Password remains null for social users
                user = userRepository.save(user);
            }
        }
        return user;
    }

    // Optional: method to save a social user (used in the above method)
    public User saveSocialUser(User user, String provider, String providerId) {
        user.setProvider(provider);
        user.setProviderId(providerId);
        // Password remains null
        return userRepository.save(user);
    }
}