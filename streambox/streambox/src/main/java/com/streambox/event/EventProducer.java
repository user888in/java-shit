package com.streambox.event;

import com.streambox.config.KafkaTopics;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
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

    @CircuitBreaker(name = "kafka-producer", fallbackMethod = "movieWatchedFallback")
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

    public void movieWatchedFallback(MovieWatchedEvent event, Throwable ex) {
        log.error("KAFKA CIRCUIT OPEN — MovieWatchedEvent lost. " +
                        "userId={} movieId={} progress={} reason={}",
                event.getUserId(), event.getMovieId(),
                event.getProgressSeconds(), ex.getMessage());
    }

    @CircuitBreaker(name = "kafka-producer", fallbackMethod = "userRegisteredFallback")
    public void publishUserRegistered(UserRegisteredEvent event) {
        kafkaTemplate.send(KafkaTopics.USER_REGISTERED, event.getUserId().toString(), event).whenComplete(
                (result, ex) -> {
                    if (ex != null) {
                        log.error("Failed to publish UserRegisteredEvent for userId = {}", event.getUserId(), ex);
                    }
                }
        );
    }

    public void userRegisteredFallback(UserRegisteredEvent event, Throwable ex) {
        log.error("KAFKA CIRCUIT OPEN — UserRegisteredEvent lost. " +
                        "userId={} email={} reason={}",
                event.getUserId(), event.getEmail(), ex.getMessage());
    }
}
