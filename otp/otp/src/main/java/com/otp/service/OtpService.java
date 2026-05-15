package com.otp.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.otp.enums.OtpChannel;
import com.otp.exception.OtpExpiredException;
import com.otp.exception.OtpInvalidException;
import com.otp.exception.OtpLockedException;
import com.otp.model.OtpRecord;
import com.otp.model.OtpRequest;
import com.otp.model.OtpVerifyRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {
    private static final int OTP_LENGTH = 6;
    private static final long OTP_TTL_SECONDS = 300;
    private static final long LOCK_TTL_SECONDS = 900;
    private static final int MAX_ATTEMPTS = 3;
    // SecureRandom is thread-safe and cryptographically strong
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final StringRedisTemplate redisTemplate;
    private final EmailService emailService;
    private final SmsService smsService;
    private final ObjectMapper objectMapper;

    public void sendOtp(OtpRequest request) {
        String identifier = sanitize(request.getIdentifier());
        String key = buildKey(request.getChannel(), identifier);

        OtpRecord existing = fetchRecord(key);
        if (existing != null && existing.isLocked()) {
            throw new OtpLockedException("Too many attempts. Try again in 15 minutes.");
        }

        String rawOtp = generateOtp();
        String hashOtp = hash(rawOtp);

        OtpRecord record = OtpRecord.builder()
                .hashOtp(hashOtp)
                .attemptCount(0)
                .createdAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(OTP_TTL_SECONDS))
                .locked(false)
                .build();
        persist(key, record, OTP_TTL_SECONDS);
        switch (request.getChannel()) {
            case EMAIL -> emailService.sendOtpEmail(identifier, rawOtp);
            case SMS -> smsService.sendOtpSms(identifier, rawOtp);
        }
        log.info("OTP dispatched via {} to {}", request.getChannel(), mask(identifier));
    }

    public int verifyOtp(OtpVerifyRequest request) {
        String identifier = request.getIdentifier();
        String key = buildKey(request.getChannel(), identifier);
        OtpRecord record = fetchRecord(key);

        if (record == null) {
            throw new OtpExpiredException("OTP has expired or was never sent.");
        }
        if (record.isLocked()) {
            throw new OtpLockedException("Account locked due to too many failed attempts.");
        }
        if (Instant.now().isAfter(record.getExpiresAt())) {
            redisTemplate.delete(key);
            throw new OtpExpiredException("Otp has expired");
        }
        String hashedInput = hash(request.getOtp());
        boolean valid = MessageDigest.isEqual(hashedInput.getBytes(StandardCharsets.UTF_8), record.getHashOtp().getBytes(StandardCharsets.UTF_8));
        if (valid) {
            redisTemplate.delete(key);
            return 0;
        }
        // wrong otp
        int attempts = record.getAttemptCount() + 1;
        int remaining = MAX_ATTEMPTS - attempts;
        if (attempts > MAX_ATTEMPTS) {
            record.setAttemptCount(attempts);
            record.setLocked(true);
            persist(key, record, LOCK_TTL_SECONDS);
            log.warn("OTP locked for {} after {} failed attempts", mask(identifier), attempts);
            throw new OtpLockedException("Too many failed attempts. Locked for 15 minutes.");
        }
        record.setAttemptCount(attempts);
        persist(key, record, OTP_TTL_SECONDS);
        log.warn("Wrong OTP for {}. {} attempt(s) remaining.", mask(identifier), remaining);
        throw new OtpInvalidException("Incorrect OTP. " + remaining + " attempt(s) remaining.",remaining  );

    }

    private String generateOtp() {
        int bound = (int) Math.pow(10, OTP_LENGTH);
        return String.format("%0" + OTP_LENGTH + "d", SECURE_RANDOM.nextInt(bound));

    }

    private String hash(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    private String buildKey(OtpChannel channel, String identifier) {
        return "otp:" + channel.name().toLowerCase() + ":" + identifier;
    }

    private String sanitize(String identifier) {
        return identifier.toLowerCase().trim();
    }

    private String mask(String identifier) {
        // Logs "use***@gmail.com" or "+91987***10" — identifier in logs
        if (identifier.contains("@")) {
            int at = identifier.indexOf("@");
            return identifier.substring(0, Math.min(3, at)) + "***" + identifier.substring(at);
        }
        return identifier.substring(0, 4) + "***" + identifier.substring(identifier.length() - 2);
    }

    private OtpRecord fetchRecord(String key) {
        String json = redisTemplate.opsForValue().get(key);
        if (json == null) return null;
        try {
            return objectMapper.readValue(json, OtpRecord.class);
        } catch (JsonProcessingException e) {
            log.error("Failed to parse OTP record from Redis for key {}", key, e);
            return null;
        }
    }

    private void persist(String key, OtpRecord record, long ttlSeconds) {
        try {
            String json = objectMapper.writeValueAsString(record);
            redisTemplate.opsForValue().set(key, json, Duration.ofSeconds(ttlSeconds));
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize OTP record", e);
        }
    }


}
