package com.streambox.monitoring;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicLong;

@Service
@Slf4j
@RequiredArgsConstructor
public class MetricsService {
    private final MeterRegistry meterRegistry;
    private final RedisTemplate<String, Object> redisTemplate;

    // only go up
    private Counter movieWatchedCounter;
    private Counter kafkaPublishSuccessCounter;
    private Counter kafkaPublishFailureCounter;
    private Counter cacheHitCounter;
    private Counter cacheMissCounter;
    private Counter rateLimitRejectionCounter;

    // current value (can go up and down)
    private final AtomicLong activeStreams = new AtomicLong(0);

    // duration + count
    private Timer dbQueryTimer;
    private Timer kafkaPublishTimer;

    @PostConstruct
    public void initMetrics() {
        movieWatchedCounter = Counter.builder("streambox.movie.watched.total")
                .description("Total number of movie watch event published")
                .register(meterRegistry);
        kafkaPublishSuccessCounter = Counter.builder("streambox.kafka.publish.success")
                .description("Successful kafka publishes")
                .tag("topic", "all")
                .register(meterRegistry);
        kafkaPublishFailureCounter = Counter.builder("streambox.kafka.publish.failure")
                .description("Failed kafka publishes")
                .tag("topic", "all")
                .register(meterRegistry);
        cacheHitCounter = Counter.builder("streambox.cache.hit.total")
                .description("Cache hits")
                .register(meterRegistry);
        cacheMissCounter = Counter.builder("streambox.cache.miss.total")
                .description("Cache misses")
                .register(meterRegistry);
        rateLimitRejectionCounter = Counter.builder("streambox.ratelimit.rejected.total")
                .description("Requests rejected by rate limiter")
                .register(meterRegistry);

        // reads activeStreams value on every scrape
        Gauge.builder("streambox.streams.active", activeStreams, AtomicLong::get)
                .description("Currently active streaming sessions")
                .register(meterRegistry);
        // reads from redis on every scrap
        Gauge.builder("streambox.redis.keys.total", this, MetricsService::getRedisKeyCount)
                .description("Total keys in redis")
                .register(meterRegistry);

        dbQueryTimer = Timer.builder("streambox.db.query.duration")
                .description("Database query execution time")
                .publishPercentiles(0.5, 0.95, 0.99)
                .register(meterRegistry);
        kafkaPublishTimer = Timer.builder("streambox.kafka.publish.duration")
                .description("Kafka publish duration")
                .publishPercentiles(0.5, 0.95, 0.99)
                .register(meterRegistry);

    }

    // methods
    public void recordMovieWatched(Long movieId, Long userId) {
        Counter.builder("streambox.movie.watched.total")
                .description("Movie watch events")
                .tag("movie_id", movieId.toString())
                .register(meterRegistry)
                .increment();
    }

    public void recordKafkaPublishSuccess(String topic) {
        Counter.builder("streambox.kafka.publish.success")
                .tag("topic", topic)
                .register(meterRegistry)
                .increment();
    }

    public void recordKafkaPublishFailure(String topic) {
        Counter.builder("streambox.kafka.publish.failure")
                .tag("topic", topic)
                .register(meterRegistry)
                .increment();
    }

    public void recordCacheHit(String cacheName) {
        Counter.builder("streambox.cache.hit.total")
                .tag("cache", cacheName)
                .register(meterRegistry)
                .increment();
    }

    public void recordCacheMiss(String cacheName) {
        Counter.builder("streambox.cache.miss.total")
                .tag("cache", cacheName)
                .register(meterRegistry)
                .increment();
    }

    public void recordRateLimitRejection(String endPoint, String identifier) {
        Counter.builder("streambox.ratelimit.rejected.total")
                .tag("endpoint", endPoint)
                .tag("identifier_type", identifier.startsWith("ip") ? "ip" : "user")
                .register(meterRegistry)
                .increment();
    }

    public void incrementActiveStreams() {
        activeStreams.incrementAndGet();
    }

    public void decrementActiveStreams() {
        activeStreams.decrementAndGet();
    }

    public Timer.Sample startTimer() {
        return Timer.start(meterRegistry);
    }

    public void recordDbQuery(Timer.Sample sample, String operation, boolean success) {
        sample.stop(Timer.builder("streambox.db.query.duration")
                .tag("operation", operation)
                .tag("success", String.valueOf(success))
                .publishPercentiles(0.5, 0.95, 0.99)
                .register(meterRegistry));
    }

    private long getRedisKeyCount() {
        try {
            Long size = redisTemplate.getConnectionFactory().getConnection().serverCommands().dbSize();
            return size != null ? size : 0L;
        } catch (Exception e) {
            return -1L; // redis unavailable
        }
    }


}
