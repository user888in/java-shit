package com.linkpulse.authservice.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

/**
 * Refresh token rotation with family-based theft detection.
 *
 * How it works:
 * - Every refresh token belongs to a "family" (created at login, persists across
 *   rotations for that session).
 * - Each time a refresh token is used, it's invalidated and a NEW one is issued
 *   in the SAME family. Redis key: refresh:{familyId} -> current valid token id.
 * - If someone ever presents an OLD (already-rotated) token from a family, that's
 *   a strong signal the token was stolen and used by an attacker after the real
 *   user already rotated past it. In that case we kill the ENTIRE family -
 *   logging out that session everywhere - rather than just rejecting the one call.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenService {

    private final RedisTemplate<String, Object> redisTemplate;

    @Value("${linkpulse.jwt.refresh-token-ttl-seconds}")
    private long refreshTokenTtlSeconds;

    private static final String FAMILY_PREFIX = "refresh:family:";

    public record IssuedToken(String tokenId, String familyId) {}

    public IssuedToken issueNewFamily(Long userId) {
        String familyId = UUID.randomUUID().toString();
        String tokenId = UUID.randomUUID().toString();
        storeCurrentToken(familyId, tokenId, userId);
        return new IssuedToken(tokenId, familyId);
    }

    /**
     * Validates and rotates a refresh token. Returns the new token pair on success.
     * Throws if the token is invalid, expired, or (critically) reused - which
     * triggers full family revocation.
     */
    public IssuedToken rotate(String familyId, String presentedTokenId) {
        String key = FAMILY_PREFIX + familyId;
        Map<Object, Object> stored = redisTemplate.opsForHash().entries(key);

        if (stored.isEmpty()) {
            throw new IllegalStateException("Refresh token family not found or expired");
        }

        String currentTokenId = (String) stored.get("tokenId");

        if (!presentedTokenId.equals(currentTokenId)) {
            // Reuse of a rotated-out token detected - possible theft.
            // Kill the whole family immediately.
            log.warn("Refresh token reuse detected for family={} - revoking entire family", familyId);
            redisTemplate.delete(key);
            throw new SecurityException("Refresh token reuse detected - session revoked");
        }

        Long userId = Long.valueOf((String) stored.get("userId"));
        String newTokenId = UUID.randomUUID().toString();
        storeCurrentToken(familyId, newTokenId, userId);

        return new IssuedToken(newTokenId, familyId);
    }

    public void revokeFamily(String familyId) {
        redisTemplate.delete(FAMILY_PREFIX + familyId);
    }

    public Long getUserIdForFamily(String familyId) {
        Object userId = redisTemplate.opsForHash().get(FAMILY_PREFIX + familyId, "userId");
        if (userId == null) {
            throw new IllegalStateException("Refresh token family not found or expired");
        }
        return Long.valueOf((String) userId);
    }

    private void storeCurrentToken(String familyId, String tokenId, Long userId) {
        String key = FAMILY_PREFIX + familyId;
        redisTemplate.opsForHash().put(key, "tokenId", tokenId);
        redisTemplate.opsForHash().put(key, "userId", String.valueOf(userId));
        redisTemplate.expire(key, Duration.ofSeconds(refreshTokenTtlSeconds));
    }
}
