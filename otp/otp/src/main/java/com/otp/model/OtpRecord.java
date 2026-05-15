package com.otp.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtpRecord {
    private String hashOtp;
    private int attemptCount;
    private Instant createdAt;
    private Instant expiresAt;
    private boolean locked;
}
