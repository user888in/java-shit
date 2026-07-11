package com.linkpulse.redirectservice.service;

import com.linkpulse.redirectservice.client.UrlServiceClient;
import com.linkpulse.redirectservice.dto.ClickEvent;
import com.linkpulse.redirectservice.dto.UrlLookupResponse;
import com.linkpulse.redirectservice.exception.ShortCodeNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;

import java.time.Duration;
import java.time.Instant;

@Service
@RequiredArgsConstructor
@Slf4j
public class RedirectService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final UrlServiceClient urlServiceClient;
    private final KafkaTemplate<String, ClickEvent> kafkaTemplate;

    @Value("${linkpulse.kafka.click-events-topic}")
    private String clickEventsTopic;

    private static final String CACHE_KEY_PREFIX = "redirect:url:";
    private static final Duration CACHE_TTL = Duration.ofHours(6);

    /**
     * Cache-aside pattern: check Redis first (the fast path, sub-millisecond),
     * fall back to url-service on a miss, then populate the cache for next time.
     * This is what lets redirect-service handle far more QPS than url-service's
     * own database could sustain directly.
     */
    public String resolveAndTrack(String shortCode, HttpServletRequest request) {
        String cacheKey = CACHE_KEY_PREFIX + shortCode;

        UrlLookupResponse cached = (UrlLookupResponse) redisTemplate.opsForValue().get(cacheKey);
        UrlLookupResponse resolved;

        if (cached != null) {
            resolved = cached;
        } else {
            resolved = fetchFromUrlService(shortCode);
            redisTemplate.opsForValue().set(cacheKey, resolved, CACHE_TTL);
        }

        publishClickEvent(resolved, request);
        return resolved.longUrl();
    }

    private UrlLookupResponse fetchFromUrlService(String shortCode) {
        try {
            return urlServiceClient.resolve(shortCode);
        } catch (HttpClientErrorException.NotFound ex) {
            throw new ShortCodeNotFoundException(shortCode);
        }
    }

    /**
     * Fire-and-forget: click tracking must NEVER slow down or fail the redirect
     * itself. If Kafka is down, we log and move on - a lost click event is an
     * acceptable trade-off, a slow redirect is not.
     */
    private void publishClickEvent(UrlLookupResponse url, HttpServletRequest request) {
        ClickEvent event = new ClickEvent(
                url.shortCode(),
                url.id(),
                Instant.now(),
                request.getHeader("Referer"),
                request.getHeader("User-Agent"),
                extractClientIp(request)
        );

        kafkaTemplate.send(clickEventsTopic, event.shortCode(), event)
                .exceptionally(ex -> {
                    log.warn("Failed to publish click event for shortCode={}: {}", event.shortCode(), ex.getMessage());
                    return null;
                });
    }

    private String extractClientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
