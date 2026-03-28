package com.shop.demo.exception;

import java.time.LocalDateTime;

public record ErrorResponse(int status, String error, String path, LocalDateTime timestamp) {
    public static ErrorResponse of(int status, String error, String path) {
        return new ErrorResponse(status, error, path, LocalDateTime.now());
    }
}
