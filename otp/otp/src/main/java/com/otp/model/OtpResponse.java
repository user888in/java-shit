package com.otp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class OtpResponse {
    private boolean success;
    private String message;
    private int attemptsRemaining;
}
