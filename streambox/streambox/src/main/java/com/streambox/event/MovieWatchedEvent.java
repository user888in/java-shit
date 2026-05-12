package com.streambox.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovieWatchedEvent {
    private Long userId;
    private Long movieId;
    private int progressSeconds;
    private boolean completed;
    private LocalDateTime occurredAt;

}
