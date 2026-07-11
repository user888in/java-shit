package com.linkpulse.redirectservice.dto;

import java.time.Instant;

/**
 * This record IS the contract between redirect-service (producer) and
 * analytics-service (consumer). Changing its shape is a breaking change
 * across service boundaries - treat it like a versioned API.
 */
public record ClickEvent(
        String shortCode,
        Long urlId,
        Instant clickedAt,
        String referrer,
        String userAgent,
        String ipAddress
) {}
