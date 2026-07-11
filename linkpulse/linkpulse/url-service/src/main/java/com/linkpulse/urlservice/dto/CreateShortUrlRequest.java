package com.linkpulse.urlservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record CreateShortUrlRequest(

        @NotBlank(message = "longUrl is required")
        @Pattern(regexp = "^https?://.+", message = "longUrl must start with http:// or https://")
        String longUrl,

        // Optional - user can request a custom slug like linkpulse.io/my-brand
        @Pattern(regexp = "^[a-zA-Z0-9_-]{4,12}$", message = "customCode must be 4-12 alphanumeric/dash/underscore chars")
        String customCode
) {}
