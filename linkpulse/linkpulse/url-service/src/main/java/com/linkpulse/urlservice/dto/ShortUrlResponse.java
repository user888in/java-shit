package com.linkpulse.urlservice.dto;

import java.time.Instant;

public record ShortUrlResponse(
        Long id,
        String shortCode,
        String shortUrl,      // fully formed e.g. https://lnkp.se/abc123
        String longUrl,
        Instant createdAt,
        Instant expiresAt,
        boolean active,
        long clickCount
) {}
