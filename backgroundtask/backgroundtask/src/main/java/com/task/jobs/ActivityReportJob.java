package com.task.jobs;

import com.task.dto.ActivityReport;
import com.task.service.AnalyticsService;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;


@Component
@RequiredArgsConstructor
@Data
public class ActivityReportJob {
    private static final Logger log = LoggerFactory.getLogger(ActivityReportJob.class);
    private final AnalyticsService analyticsService;
    private final MeterRegistry meterRegistry;

    @Value("${jobs.activity-report.cron}")
    private String cronExpression;

    @Scheduled(cron = "${jobs.activity-report.cron}")
    public void generateDailyReport() {
        log.info("Starting daily activity report generation");
        long start = System.currentTimeMillis();
        try {
            ActivityReport report = analyticsService.generateYesterdayReport();
            log.info("Report generated: {}", report);
            meterRegistry.counter("job.activity_report.success").increment();
        } catch (Exception e) {
            log.error("Failed to generate activity report", e);
            meterRegistry.counter("job.activity_report.failure").increment();
        }finally {
            long duration = System.currentTimeMillis() - start;
            meterRegistry.timer("job.activity_report.duration").record(duration, TimeUnit.MILLISECONDS);
        }
    }
}













