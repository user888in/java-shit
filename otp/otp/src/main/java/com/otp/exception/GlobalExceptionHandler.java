package com.otp.exception;

import com.otp.model.OtpResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<OtpResponse> handleValidationErrors(MethodArgumentNotValidException exception) {
        String errors = exception.getBindingResult().getFieldErrors().stream().map(FieldError::getDefaultMessage).collect(Collectors.joining(", "));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(OtpResponse.builder().success(false).message(errors).build());
    }

    @ExceptionHandler(OtpExpiredException.class)
    public ResponseEntity<OtpResponse> handleExpired(OtpExpiredException exception) {
        return ResponseEntity.status(HttpStatus.GONE)
                .body(OtpResponse.builder().success(false).message(exception.getMessage()).build());
    }

    @ExceptionHandler(OtpInvalidException.class)
    public ResponseEntity<OtpResponse> handleInvalid(OtpInvalidException ex) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY) // 422
                .body(OtpResponse.builder().success(false).message(ex.getMessage()).attemptsRemaining(ex.getAttemptsRemaining()).build());
    }
    @ExceptionHandler(OtpLockedException.class)
    public ResponseEntity<OtpResponse> handleLocked(OtpLockedException ex) {
        return ResponseEntity
                .status(HttpStatus.TOO_MANY_REQUESTS) // 429
                .body(OtpResponse.builder().success(false).message(ex.getMessage()).build());
    }
    @ExceptionHandler(Exception.class)
    public ResponseEntity<OtpResponse> handleGeneric(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(OtpResponse.builder().success(false).message("Something went wrong. Please try again.").build());
    }
}
