package com.streambox.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.function.Supplier;

@Service
@RequiredArgsConstructor
public class RateLimitService {
    private final ProxyManager<String> bucketProxyManager;
    // 60 request per minute per user - general api
    private static final Supplier<BucketConfiguration> API_CONFIG = () ->
            BucketConfiguration
                    .builder()
                    .addLimit(Bandwidth
                            .builder()
                            .capacity(60)
                            .refillIntervally(60, Duration.ofMinutes(1))
                            .build())
                    .build();
    // 200 requests per minute per user - streaming
    private static final Supplier<BucketConfiguration> STREAM_CONFIG = () ->
            BucketConfiguration
                    .builder()
                    .addLimit(Bandwidth
                            .builder()
                            .capacity(200)
                            .refillIntervally(200, Duration.ofMinutes(1))
                            .build())
                    .build();
    // 5 login requests per 15 minutes
    private static final Supplier<BucketConfiguration> AUTH_CONFIG = () ->
            BucketConfiguration
                    .builder()
                    .addLimit(Bandwidth
                            .builder()
                            .capacity(5)
                            .refillIntervally(5, Duration.ofMinutes(15))
                            .build())
                    .build();

    public ConsumptionProbe tryApiConsume(String userId) {
        return bucketProxyManager
                .builder()
                .build("rate:api:" + userId, API_CONFIG)
                .tryConsumeAndReturnRemaining(1);
    }

    public ConsumptionProbe tryStreamConsume(String userId) {
        return bucketProxyManager
                .builder()
                .build("rate:stream:" + userId, STREAM_CONFIG)
                .tryConsumeAndReturnRemaining(1);
    }

    public ConsumptionProbe tryAuthConsume(String ip) {
        return bucketProxyManager
                .builder()
                .build("rate:ip:" + ip, AUTH_CONFIG)
                .tryConsumeAndReturnRemaining(1);
    }
}
