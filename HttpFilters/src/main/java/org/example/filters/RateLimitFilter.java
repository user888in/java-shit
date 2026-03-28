package org.example.filters;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

public class RateLimitFilter extends OncePerRequestFilter {
    private static final int MAX_REQUEST_PER_MINUTE = 10;
    private final Map<String, RequestCount> requestCounts = new ConcurrentHashMap<>();
    // key : ip address
    // value : our RequestCount obj (count + timestamp)

    private static class RequestCount {
        // helper class
        AtomicInteger count = new AtomicInteger(0); // thread safe counter
        long windowStart = System.currentTimeMillis();

    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String ip = request.getRemoteAddr();
        String uri = request.getRequestURI();
        if (uri.startsWith("/api/auth/login")) {
            // only rate limit the login endpoint
            RequestCount requestCount = requestCounts.computeIfAbsent(ip, k -> new RequestCount());
            // if ip key exists return existing value otherwise run the function store new result return it
            long now = System.currentTimeMillis();
            long windowDuration = now - requestCount.windowStart;

            if (windowDuration > 60_000) {
                requestCount.count.set(0); // start a new window frame
            }
            int currentCount = requestCount.count.incrementAndGet(); // add 1 and return a new value in one atomic operation
            if (currentCount > MAX_REQUEST_PER_MINUTE) {
                response.setStatus(429); // too many request
                response.setContentType("application/json"); // sending json response
                response.getWriter().write(
                        "{\"error\": \"Rate limit exceeded. Try again in 1 minute\"}"
                );
                return;
            }
            filterChain.doFilter(request, response);

        }
    }


}
