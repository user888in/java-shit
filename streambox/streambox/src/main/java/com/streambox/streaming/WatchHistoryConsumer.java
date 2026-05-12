package com.streambox.streaming;

import com.streambox.config.KafkaTopics;
import com.streambox.event.MovieWatchedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class WatchHistoryConsumer {
    private final WatchHistoryRepository watchHistoryRepository;

    @KafkaListener(
            topics = KafkaTopics.MOVIE_WATCHED,
            groupId = "watch-history-group",
            concurrency = "3"
    )
    public void handleMovieWatched(@Payload MovieWatchedEvent event, @Header(KafkaHeaders.RECEIVED_PARTITION) int partition, @Header(KafkaHeaders.OFFSET) long offset) {
        log.debug("Consuming MovieWatchedEvent partition = {}, offset = {}, userId = {} movieId = {}", partition, offset, event.getUserId(), event.getMovieId());
        watchHistoryRepository.findByUserIdAndMovieId(event.getUserId(), event.getMovieId())
                .ifPresentOrElse(
                        history -> {
                            history.setProgressSeconds(event.getProgressSeconds());
                            history.setCompleted(event.isCompleted());
                            watchHistoryRepository.save(history);
                        },
                        () -> watchHistoryRepository.save(
                                WatchHistory.builder()
                                        .userId(event.getUserId())
                                        .movieId(event.getMovieId())
                                        .progressSeconds(event.getProgressSeconds())
                                        .completed(event.isCompleted()).build()
                        )
                );
    }

}
