package com.task.service;

import com.task.dto.ActivityReport;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.concurrent.ThreadLocalRandom;

@Service
public class AnalyticsService {
    public ActivityReport generateYesterdayReport() {
        LocalDate yesterday = LocalDate.now().minusDays(1);
        int logins = ThreadLocalRandom.current().nextInt(500, 1000);
        int registrations = ThreadLocalRandom.current().nextInt(20, 100);
        int active = ThreadLocalRandom.current().nextInt(300, 700);
        return new ActivityReport(yesterday, logins, registrations, active);
    }
}
