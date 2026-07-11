package com.linkpulse.urlservice.service;

import com.linkpulse.urlservice.dto.CreateShortUrlRequest;
import com.linkpulse.urlservice.dto.ShortUrlResponse;
import com.linkpulse.urlservice.entity.ShortUrl;
import com.linkpulse.urlservice.exception.CustomCodeTakenException;
import com.linkpulse.urlservice.exception.ShortUrlNotFoundException;
import com.linkpulse.urlservice.repository.ShortUrlRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ShortUrlService {

    private final ShortUrlRepository repository;
    private final RedisTemplate<String, Object> redisTemplate;
    private final Base62Encoder base62Encoder;

    @Value("${linkpulse.base-url}")
    private String baseUrl;

    // Redis key for the atomic counter. Starting the counter at an offset
    // (see redis INCRBY seed in docker init) means codes don't start as "1","2","3..."
    // which would be both guessable and look unprofessional.
    private static final String COUNTER_KEY = "url-service:short-code-counter";

    @Transactional
    public ShortUrlResponse createShortUrl(CreateShortUrlRequest request) {
        String shortCode;

        if (request.customCode() != null && !request.customCode().isBlank()) {
            // Custom slug path - must check + reserve. DB unique constraint is the
            // real safety net here (race condition between check and insert is possible,
            // so we rely on the unique index at the DB level, not this check alone).
            if (repository.existsByShortCode(request.customCode())) {
                throw new CustomCodeTakenException(request.customCode());
            }
            shortCode = request.customCode();
        } else {
            // Generated path - atomic Redis INCR guarantees no two requests
            // ever get the same counter value, so no collision is possible,
            // no retry loop needed (unlike random-string-then-check approaches).
            Long nextValue = redisTemplate.opsForValue().increment(COUNTER_KEY);
            shortCode = base62Encoder.encode(nextValue);
        }

        ShortUrl entity = ShortUrl.builder()
                .shortCode(shortCode)
                .longUrl(request.longUrl())
                .active(true)
                .clickCount(0L)
                .build();

        ShortUrl saved = repository.save(entity);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public ShortUrlResponse getByShortCode(String shortCode) {
        ShortUrl entity = repository.findByShortCodeAndActiveTrue(shortCode)
                .orElseThrow(() -> new ShortUrlNotFoundException(shortCode));
        return toResponse(entity);
    }

    private ShortUrlResponse toResponse(ShortUrl entity) {
        return new ShortUrlResponse(
                entity.getId(),
                entity.getShortCode(),
                baseUrl + "/" + entity.getShortCode(),
                entity.getLongUrl(),
                entity.getCreatedAt(),
                entity.getExpiresAt(),
                entity.isActive(),
                entity.getClickCount()
        );
    }
}
