package com.linkpulse.analyticsservice.service;

import com.linkpulse.analyticsservice.dto.LinkStatsResponse;
import com.linkpulse.analyticsservice.repository.ClickEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnalyticsQueryService {

    private final ClickEventRepository repository;

    public LinkStatsResponse getStats(String shortCode) {
        long total = repository.countByShortCode(shortCode);

        Instant thirtyDaysAgo = Instant.now().minus(30, ChronoUnit.DAYS);

        List<LinkStatsResponse.DailyClicks> dailyClicks = repository
                .countClicksByDay(shortCode, thirtyDaysAgo).stream()
                .map(row -> new LinkStatsResponse.DailyClicks(row[0].toString(), (Long) row[1]))
                .toList();

        List<LinkStatsResponse.ReferrerCount> referrers = repository
                .topReferrers(shortCode).stream()
                .map(row -> new LinkStatsResponse.ReferrerCount((String) row[0], (Long) row[1]))
                .toList();

        return new LinkStatsResponse(shortCode, total, dailyClicks, referrers);
    }
}
