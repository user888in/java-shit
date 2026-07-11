package com.linkpulse.analyticsservice.controller;

import com.linkpulse.analyticsservice.dto.LinkStatsResponse;
import com.linkpulse.analyticsservice.service.AnalyticsQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsQueryService analyticsQueryService;

    @GetMapping("/{shortCode}")
    public LinkStatsResponse getStats(@PathVariable String shortCode) {
        return analyticsQueryService.getStats(shortCode);
    }
}
