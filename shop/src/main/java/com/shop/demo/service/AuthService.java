package com.shop.demo.service;

import com.shop.demo.dto.AuthResponse;
import com.shop.demo.dto.LoginRequest;
import com.shop.demo.dto.RegisterUserRequest;
import com.shop.demo.exception.BadRequestException;
import com.shop.demo.model.RefreshToken;
import com.shop.demo.model.User;
import com.shop.demo.repository.UserRepository;
import com.shop.demo.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService implements UserDetailsService {
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;

    @Transactional
    public AuthResponse register(RegisterUserRequest request) {
        log.info("Registration attempt - email: {}", request.email());
        if (userRepository.existsByEmail(request.email())) {
            log.warn("Registration Failed - email already exists: {}", request.email());
            throw new BadRequestException("Email already registered");
        }
        String hashedPassword = passwordEncoder.encode(request.password());
        User user = new User(request.name(), request.email(), hashedPassword);
        User saved = userRepository.save(user);

        String accessToken = jwtService.generateToken(saved.getId(), saved.getEmail(), saved.getRole());
        String refreshToken = refreshTokenService.createRefreshToken(saved).getToken();

        log.info("user registered - userId: {}, email: {}", saved.getId(), saved.getEmail());
        return new AuthResponse(accessToken, refreshToken, saved.getId(), saved.getName(), saved.getEmail());
    }

    public AuthResponse login(LoginRequest request) {
        log.info("Login Attempt - email: {}", request.email());
        User user = userRepository.findByEmail(request.email()).orElseThrow(() -> {
                    log.warn("Login failed — email not found: {}", request.email());
                    return new BadRequestException("Invalid email or password");
                }
        );
        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            log.warn("Login failed — wrong password for: {}", request.email());
            throw new BadRequestException("Invalid email or password");
        }
        String accessToken = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = refreshTokenService.createRefreshToken(user).getToken();
        log.info("Login successful — userId: {}, email: {}", user.getId(), user.getEmail());
        return new AuthResponse(accessToken, refreshToken, user.getId(), user.getName(), user.getEmail());
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
    }

    public AuthResponse refreshAccessToken(String token) {
        RefreshToken refreshToken = refreshTokenService.verifyRefreshToken(token);
        User user = refreshToken.getUser();
        String newAccessToken = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole());
        log.info("Access token refreshed - userId {}", user.getId());
        return new AuthResponse(newAccessToken, token, user.getId(), user.getName(), user.getEmail());
    }

    @Transactional
    public void logout(User user) {
        refreshTokenService.deleteByUser(user);
        log.info("User logged out - userId: {}", user.getId());
    }
}
