package com.sse.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sse.model.NotificationEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {
    private final ObjectMapper objectMapper;
    private final ConcurrentHashMap<String, CopyOnWriteArrayList<SseEmitter>> userEmitters = new ConcurrentHashMap<>();
    public SseEmitter subscribe(String userId) {
        SseEmitter emitter = new SseEmitter(-1L);

        // Guaranteed atomic — get existing list or create new, then add
        userEmitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        log.info("User [{}] subscribed. Active connections: {}", userId,
                userEmitters.get(userId).size()); // re-fetch after add

        Runnable cleanup = () -> removeEmitter(userId, emitter);
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> {
            log.warn("Emitter error for user [{}]: {}", userId, e.getMessage());
            cleanup.run();
        });

        try {
            emitter.send(SseEmitter.event().name("CONNECTED").data("connected"));
        } catch (IOException e) {
            log.warn("Failed to send initial event to [{}]", userId);
        }

        return emitter;
    }

    public void sendNotification(NotificationEvent event) {
        CopyOnWriteArrayList<SseEmitter> emitters = userEmitters.get(event.getUserId());

        if (emitters == null || emitters.isEmpty()) {
            log.info("No active connections for user [{}]", event.getUserId());
            return;
        }

        String payload;
        try {
            payload = objectMapper.writeValueAsString(event);
        } catch (Exception e) {
            log.error("Failed to serialize event", e);
            return;
        }

        for (SseEmitter emitter : new ArrayList<>(emitters)) {
            try {
                emitter.send(SseEmitter.event()
                        .name(event.getType())
                        .data(payload));
            } catch (Exception e) {
                log.warn("Dead emitter removed for user [{}]", event.getUserId());
                removeEmitter(event.getUserId(), emitter);
            }
        }
    }

    private void removeEmitter(String userId, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> emitters = userEmitters.get(userId);
        if (emitters != null) {
            emitters.remove(emitter);
            if (emitters.isEmpty()) {
                userEmitters.remove(userId);
                log.info("User [{}] fully disconnected", userId);
            }
        }
    }

}
