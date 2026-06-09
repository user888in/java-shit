package com.sse.controller;

import com.sse.model.NotificationEvent;
import com.sse.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SseController {
    private final NotificationService notificationService;

    @GetMapping(value = "/stream/{userId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@PathVariable String userId) {
        return notificationService.subscribe(userId);
    }

    @PostMapping("/notify")
    public ResponseEntity<String> notify(@RequestBody NotificationEvent event) {
        notificationService.sendNotification(event);
        return ResponseEntity.ok("Sent");
    }
}
