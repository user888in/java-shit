package com.linkpulse.redirectservice.dto;

public record UrlLookupResponse(
        Long id,
        String shortCode,
        String shortUrl,
        String longUrl,
        boolean active
) {}
