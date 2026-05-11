package com.task.controller;

import com.task.jobs.ActivityReportJob;
import com.task.jobs.TokenCleanupJob;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@AllArgsConstructor
@RequestMapping("/api/admin/jobs")
public class JobTriggerController {
    private final ActivityReportJob reportJob;
    private final TokenCleanupJob cleanupJob;

    @PostMapping("/activity-report")
    public ResponseEntity<String> triggerReport() {
        reportJob.generateDailyReport();
        return ResponseEntity.ok("Activity report job triggered successfully");
    }

    @PostMapping("/token-cleanup")
    public ResponseEntity<String> triggerCleanup() {
        cleanupJob.deleteExpiryTokens();
        return ResponseEntity.ok("Token cleanup job triggered successfully");
    }
}








