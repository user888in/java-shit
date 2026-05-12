package com.streambox.streaming;

import com.streambox.config.KafkaTopics;
import com.streambox.event.MovieWatchedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class AnalyticsConsumer {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final String VIEW_COUNT_KEY = "movie:views:";

    @KafkaListener(
            topics = KafkaTopics.MOVIE_WATCHED,
            groupId = "analytics-group",
            concurrency = "3"
    )
    public void handleMovieWatched(@Payload MovieWatchedEvent event) {
        // Atomic increment — no race condition, no DB touch
        redisTemplate.opsForValue()
                .increment(VIEW_COUNT_KEY + event.getMovieId());

        log.debug("Incremented Redis view count for movie={}", event.getMovieId());
    }
}