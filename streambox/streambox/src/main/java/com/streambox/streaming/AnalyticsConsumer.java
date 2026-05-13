package com.streambox.streaming;

import com.streambox.config.KafkaTopics;
import com.streambox.event.MovieWatchedEvent;
import com.streambox.movie.MovieRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class AnalyticsConsumer {

    private final RedisTemplate<String, Object> redisTemplate;
    private final MovieRepository movieRepository;

    private static final String VIEW_COUNT_KEY = "movie:views:";

    @KafkaListener(
            topics = KafkaTopics.MOVIE_WATCHED,
            groupId = "analytics-group",
            concurrency = "3"
    )
    @Transactional
    public void handleMovieWatched(@Payload MovieWatchedEvent event) {
        try {
            // Atomic increment — no race condition, no DB touch
            redisTemplate.opsForValue()
                    .increment(VIEW_COUNT_KEY + event.getMovieId());

            log.debug("Incremented Redis view count for movie={}", event.getMovieId());
        } catch (Exception ex) {
            // Log and fallback to DB increment so we don't lose the view count.
            log.warn("Redis unavailable — falling back to DB increment for movie={}. reason={}",
                    event.getMovieId(), ex.getMessage());
            try {
                movieRepository.incrementViewCount(event.getMovieId(), 1L);
            } catch (Exception dbEx) {
                log.error("CRITICAL: Failed to increment view count in BOTH Redis and DB for movie={}",
                        event.getMovieId(), dbEx);
            }
        }
    }
}