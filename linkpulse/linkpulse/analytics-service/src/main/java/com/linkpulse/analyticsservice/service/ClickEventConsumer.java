package com.linkpulse.analyticsservice.service;

import com.linkpulse.analyticsservice.dto.ClickEvent;
import com.linkpulse.analyticsservice.entity.ClickEventEntity;
import com.linkpulse.analyticsservice.repository.ClickEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;

@Service
@RequiredArgsConstructor
@Slf4j
public class ClickEventConsumer {

    private final ClickEventRepository repository;

    @KafkaListener(topics = "${linkpulse.kafka.click-events-topic}", containerFactory = "kafkaListenerContainerFactory")
    public void consume(ClickEvent event) {
        String dedupKey = buildDedupKey(event);

        // Idempotent consumer pattern: Kafka delivery is at-least-once, so this
        // exact event could arrive twice (e.g. after a consumer restart before
        // offset commit). Checking the dedup key before insert means a duplicate
        // delivery is a safe no-op instead of an inflated click count.
        if (repository.existsByDedupKey(dedupKey)) {
            log.debug("Duplicate click event ignored: {}", dedupKey);
            return;
        }

        ClickEventEntity entity = ClickEventEntity.builder()
                .shortCode(event.shortCode())
                .urlId(event.urlId())
                .clickedAt(event.clickedAt())
                .referrer(event.referrer())
                .userAgent(event.userAgent())
                .ipAddress(event.ipAddress())
                .dedupKey(dedupKey)
                .build();

        repository.save(entity);
    }

    private String buildDedupKey(ClickEvent event) {
        try {
            String raw = event.shortCode() + "|" + event.clickedAt() + "|" + event.ipAddress();
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) hex.append(String.format("%02x", b));
            return hex.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to compute dedup key", e);
        }
    }
}
