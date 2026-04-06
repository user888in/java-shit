package com.shop.demo.service;

import com.shop.demo.exception.BadRequestException;
import com.shop.demo.model.RefreshToken;
import com.shop.demo.model.User;
import com.shop.demo.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenService {
    private final RefreshTokenRepository refreshTokenRepository;
    @Value("${jwt.refresh-expiration}")
    private long refreshExpiration;

    @Transactional
    public RefreshToken createRefreshToken(User user) {
        refreshTokenRepository.deleteByUser(user);
        refreshTokenRepository.flush(); // hibernate keeps the changes in memory but so to avoid conflict in the db flush sends the pending queries to the db instantly
        RefreshToken token = new RefreshToken(user,
                UUID.randomUUID().toString(), // radom unique string
                Instant.now().plusMillis(refreshExpiration));
        log.info("Refresh token created - userId: {}", user.getId());
        return refreshTokenRepository.save(token);
    }

    public RefreshToken verifyRefreshToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token).orElseThrow(() -> {
            log.warn("Invalid refresh token attempt");
            return new BadRequestException("Invalid refresh token");
        });
        if (refreshToken.isExpired()) {
            log.warn("Expired refresh token - userId: {}", refreshToken.getUser().getId());
            refreshTokenRepository.delete(refreshToken);
            throw new BadRequestException("Refresh token expired login again");
        }
        return refreshToken;
    }

    @Transactional
    public void deleteByUser(User user) {
        refreshTokenRepository.deleteByUser(user);
        log.info("Refresh token deleted: userId {}", user.getId());
    }

}
