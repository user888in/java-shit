package com.streambox.streaming;

import com.streambox.movie.MovieRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Component
@Slf4j
@RequiredArgsConstructor
public class ViewCountSyncJob {
    private final RedisTemplate<String, Object> redisTemplate;
    private final MovieRepository movieRepository;

    private static final String VIEW_COUNT_PATTERN = "movie:views:*";
    private static final String VIEW_COUNT_PREFIX = "movie:views:";

    @Scheduled(fixedDelay = 300000)
    @Transactional
    public void syncViewCountsToDb() {
        Set<String> keys = redisTemplate.keys(VIEW_COUNT_PATTERN);
        if(keys == null || keys.isEmpty()) return;
        log.info("Syncing {} movie view counts from Redis to DB", keys.size());
        keys.forEach(key->{
            Object value = redisTemplate.opsForValue().getAndDelete(key);
            if(value == null) return;
            Long movieId = Long.parseLong(key.replace(VIEW_COUNT_PREFIX, ""));
            Long count = Long.parseLong(value.toString());
            movieRepository.incrementViewCount(movieId, count);
            log.debug("Synced movie={} views={} to DB", movieId, count);

        });
    }
}
