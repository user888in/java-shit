package com.linkpulse.redirectservice.controller;

import com.linkpulse.redirectservice.service.RedirectService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class RedirectController {

    private final RedirectService redirectService;

    // Deliberately at the root path, not under /api/v1 - a short link should
    // look like https://lnkp.se/abc123, not https://lnkp.se/api/v1/redirect/abc123.
    @GetMapping("/{shortCode}")
    public ResponseEntity<Void> redirect(@PathVariable String shortCode, HttpServletRequest request) {
        String longUrl = redirectService.resolveAndTrack(shortCode, request);

        return ResponseEntity.status(HttpStatus.FOUND) // 302 - temporary redirect.
                // We use 302 not 301 deliberately: a permanent redirect would let
                // browsers cache the destination and skip calling us entirely next
                // time, which would break click tracking.
                .header(HttpHeaders.LOCATION, longUrl)
                .build();
    }
}
