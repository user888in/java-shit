package com.otp.exception;

import lombok.Getter;

@Getter
public class OtpInvalidException extends RuntimeException {

    private final int attemptsRemaining;

    public OtpInvalidException(String message, int attemptsRemaining) {
        super(message);
        this.attemptsRemaining = attemptsRemaining;
    }
}