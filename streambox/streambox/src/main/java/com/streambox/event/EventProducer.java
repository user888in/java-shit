package com.streambox.event;

import com.streambox.config.KafkaTopics;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Slf4j
public class EventProducer {
    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publishMovieWatched(MovieWatchedEvent event) {
        String key = event.getUserId() + "-" + event.getMovieId();
        CompletableFuture<SendResult<String, Object>> future =
                kafkaTemplate.send(KafkaTopics.MOVIE_WATCHED, key, event);
        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to publish MovieWatchedEvent: userId={}, movieId={}", event.getUserId(), event.getMovieId());
            } else {
                log.debug("Published MovieWatchedEvent : partitions={}, offset={}", result.getRecordMetadata().partition(), result.getRecordMetadata().offset());
            }
        });
    }

    public void publishUserRegistered(UserRegisteredEvent event) {
        kafkaTemplate.send(KafkaTopics.USER_REGISTERED, event.getUserId().toString(), event).whenComplete(
                (result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish UserRegisteredEvent for userId = {}", event.getUserId(), ex);
                    }
                }
        );
    }
}
