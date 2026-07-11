package com.linkpulse.analyticsservice.dto;

import java.util.List;
import java.util.Map;

public record LinkStatsResponse(
        String shortCode,
        long totalClicks,
        List<DailyClicks> clicksByDay,
        List<ReferrerCount> topReferrers
) {
    public record DailyClicks(String day, long count) {}
    public record ReferrerCount(String referrer, long count) {}
}
