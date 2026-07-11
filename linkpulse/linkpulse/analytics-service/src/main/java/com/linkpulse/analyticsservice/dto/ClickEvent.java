package com.linkpulse.analyticsservice.dto;

import java.time.Instant;

// Must stay field-for-field identical to redirect-service's ClickEvent record -
// this IS the contract between the two services.
public record ClickEvent(
        String shortCode,
        Long urlId,
        Instant clickedAt,
        String referrer,
        String userAgent,
        String ipAddress
) {}
