package com.streambox.exception;

import lombok.Builder;
import lombok.Getter;
import lombok.Value;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Builder
public class ErrorResponse {
    int status;
    String error;
    String message;
    String path;
    @Builder.Default
    LocalDateTime timestamp = LocalDateTime.now();
    Map<String, String> validationErrors;
}
