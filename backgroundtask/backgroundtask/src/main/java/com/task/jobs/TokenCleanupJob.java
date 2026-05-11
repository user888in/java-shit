package com.task.jobs;

import com.task.repository.ApiTokenRepository;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

@Component
@AllArgsConstructor
@Data
public class TokenCleanupJob {
    private static final Logger log = LoggerFactory.getLogger(TokenCleanupJob.class);
    private final ApiTokenRepository tokenRepository;
    private final MeterRegistry meterRegistry;

    @Scheduled(cron = "${jobs.token-cleanup.cron}")
    @Transactional
    public void deleteExpiryTokens() {
        log.info("Starting expired token cleanup");
        long start = System.currentTimeMillis();
        try {
            int deleted = tokenRepository.deleteByExpiryDateBefore(LocalDateTime.now());
            log.info("Deleted {} expired tokens", deleted);
            meterRegistry.counter("job.token_cleanup.success").increment();
            meterRegistry.gauge("job.token_cleanup.deleted", deleted);
        } catch (Exception e) {
            log.error("Token cleanup failed", e);
            meterRegistry.counter("job.token_cleanup.failure").increment();
            throw e;
        }finally {
            meterRegistry.timer("job.token_cleanup.duration").record(System.currentTimeMillis() - start, TimeUnit.MILLISECONDS);
        }
    }
}
