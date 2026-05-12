package com.streambox.streaming;

import com.streambox.event.EventProducer;
import com.streambox.event.MovieWatchedEvent;
import com.streambox.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/stream")
@RequiredArgsConstructor
@Slf4j
public class StreamingController {
    private final EventProducer eventProducer;

    @PostMapping("/{movieId}/progress")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void updateProgress(@PathVariable Long movieId, @Valid @RequestBody WatchProgressRequest request, @AuthenticationPrincipal User currentUser) {
        eventProducer.publishMovieWatched(
                MovieWatchedEvent.builder()
                        .userId(currentUser.getId())
                        .movieId(movieId)
                        .progressSeconds(request.getProgressSeconds())
                        .completed(request.getCompleted())
                        .occurredAt(LocalDateTime.now())
                        .build()
        );

    }
}
