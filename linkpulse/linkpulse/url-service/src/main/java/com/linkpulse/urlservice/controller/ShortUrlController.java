package com.linkpulse.urlservice.controller;

import com.linkpulse.urlservice.dto.CreateShortUrlRequest;
import com.linkpulse.urlservice.dto.ShortUrlResponse;
import com.linkpulse.urlservice.service.ShortUrlService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/urls")
@RequiredArgsConstructor
public class ShortUrlController {

    private final ShortUrlService shortUrlService;

    @PostMapping
    public ResponseEntity<ShortUrlResponse> create(@Valid @RequestBody CreateShortUrlRequest request) {
        ShortUrlResponse response = shortUrlService.createShortUrl(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // This is the endpoint the Redirect Service calls internally to resolve
    // a short code when it's not in its Redis cache (cache miss fallback).
    @GetMapping("/{shortCode}")
    public ResponseEntity<ShortUrlResponse> getByShortCode(@PathVariable String shortCode) {
        return ResponseEntity.ok(shortUrlService.getByShortCode(shortCode));
    }
}
