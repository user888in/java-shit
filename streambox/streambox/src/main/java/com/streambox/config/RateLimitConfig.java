package com.streambox.config;

import io.github.bucket4j.distributed.proxy.ProxyManager;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.RedisClient;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.codec.ByteArrayCodec;
import io.lettuce.core.codec.RedisCodec;
import io.lettuce.core.codec.StringCodec;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;

@Configuration
public class RateLimitConfig {

    @Bean
    public StatefulRedisConnection<String, byte[]> rateLimitRedisConnection(
            LettuceConnectionFactory lettuceConnectionFactory) {
        // getNativeClient() returns AbstractRedisClient — must cast to RedisClient
        // to access connect(RedisCodec)
        RedisClient redisClient = (RedisClient) lettuceConnectionFactory.getNativeClient();
        return redisClient
                .connect(RedisCodec.of(StringCodec.UTF8, ByteArrayCodec.INSTANCE));
    }

    @Bean
    public ProxyManager<String> bucketProxyManager(
            StatefulRedisConnection<String, byte[]> rateLimitRedisConnection) {
        return LettuceBasedProxyManager
                .builderFor(rateLimitRedisConnection)
                .build();
    }
}