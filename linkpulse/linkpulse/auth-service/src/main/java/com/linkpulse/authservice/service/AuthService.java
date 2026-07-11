package com.linkpulse.authservice.service;

import com.linkpulse.authservice.dto.AuthDtos.*;
import com.linkpulse.authservice.entity.User;
import com.linkpulse.authservice.exception.AuthExceptions.*;
import com.linkpulse.authservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    @Transactional
    public TokenResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyRegisteredException(request.email());
        }

        User user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .role(User.Role.USER)
                .active(true)
                .build();

        User saved = userRepository.save(user);
        return issueTokenPair(saved);
    }

    @Transactional(readOnly = true)
    public TokenResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(InvalidCredentialsException::new);

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        if (!user.isActive()) {
            throw new InvalidCredentialsException();
        }

        return issueTokenPair(user);
    }

    @Transactional(readOnly = true)
    public TokenResponse refresh(RefreshRequest request) {
        String[] parts = request.refreshToken().split(":", 2);
        if (parts.length != 2) {
            throw new InvalidRefreshTokenException("Malformed refresh token");
        }
        String familyId = parts[0];
        String tokenId = parts[1];

        RefreshTokenService.IssuedToken rotated;
        try {
            rotated = refreshTokenService.rotate(familyId, tokenId);
        } catch (SecurityException | IllegalStateException e) {
            throw new InvalidRefreshTokenException(e.getMessage());
        }

        // Re-fetch user to embed current role/email in the new access token -
        // in case a role change happened since the last token was issued.
        // We stored userId as part of the family record; look up via that path
        // through a service-internal helper if needed. For simplicity here we
        // trust the token subject was validated at issuance and re-derive via DB.
        Long userId = extractUserIdFromFamily(familyId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new InvalidRefreshTokenException("User no longer exists"));

        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = rotated.familyId() + ":" + rotated.tokenId();

        return new TokenResponse(accessToken, refreshToken, jwtService.getAccessTokenTtlSeconds());
    }

    private TokenResponse issueTokenPair(User user) {
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        RefreshTokenService.IssuedToken issued = refreshTokenService.issueNewFamily(user.getId());
        String refreshToken = issued.familyId() + ":" + issued.tokenId();
        return new TokenResponse(accessToken, refreshToken, jwtService.getAccessTokenTtlSeconds());
    }

    private Long extractUserIdFromFamily(String familyId) {
        return refreshTokenService.getUserIdForFamily(familyId);
    }
}
