package com.shop.demo.service;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class RateLimitService {
    // bucket for each ip
    private final Map<String, Bucket> loginBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> generalBuckets = new ConcurrentHashMap<>();

    public Bucket getLoginBucket(String ipAddress) {
        return loginBuckets.computeIfAbsent(ipAddress, ip->{
            Bandwidth limit = Bandwidth.builder().capacity(5).refillGreedy(5, Duration.ofMinutes(1)).build();
            return Bucket.builder().addLimit(limit).build();
        });
    }
    public Bucket getGeneralBucket(String ipAddress) {
        return generalBuckets.computeIfAbsent(ipAddress, ip->{
            Bandwidth limit = Bandwidth.builder().capacity(100).refillGreedy(100,Duration.ofMinutes(1)).build();
            return Bucket.builder().addLimit(limit).build();
        });
    }

    public boolean tryConsumeLogin(String ipAddress) {
        boolean allowed = getLoginBucket(ipAddress).tryConsume(1);
        if (!allowed) {
            log.warn("Rate limit exceed for login - IP: {}", ipAddress);
        }
        return allowed;
    }

    public boolean tryConsumeGeneral(String ipAddress) {
        boolean allowed = getGeneralBucket(ipAddress).tryConsume(1);
        if (!allowed) {
            log.warn("Rate limit exceed - IP: {}", ipAddress);
        }
        return allowed;
    }

    public long getRemainingLoginAttempts(String ipAddress) {
        return getLoginBucket(ipAddress).getAvailableTokens();
    }

}
