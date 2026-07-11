package com.linkpulse.analyticsservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "click_events", indexes = {
        @Index(name = "idx_click_events_short_code", columnList = "short_code"),
        @Index(name = "idx_click_events_clicked_at", columnList = "clicked_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClickEventEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "short_code", nullable = false, length = 12)
    private String shortCode;

    @Column(name = "url_id")
    private Long urlId;

    @Column(name = "clicked_at", nullable = false)
    private Instant clickedAt;

    @Column(name = "referrer", columnDefinition = "TEXT")
    private String referrer;

    @Column(name = "user_agent", columnDefinition = "TEXT")
    private String userAgent;

    @Column(name = "ip_address", length = 64)
    private String ipAddress;

    // Idempotency guard: Kafka is at-least-once delivery, so the same click
    // event could theoretically be consumed twice after a consumer restart.
    // A unique constraint on this key (derived from the event content) lets
    // us safely ignore duplicate inserts instead of double-counting clicks.
    @Column(name = "dedup_key", nullable = false, unique = true, length = 128)
    private String dedupKey;
}
