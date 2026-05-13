package com.streambox.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.streambox.exception.ErrorResponse;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {
    private final RateLimitService rateLimitService;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String path = request.getRequestURI();
        if (!path.startsWith("/api/")) {
            filterChain.doFilter(request, response);
            return;
        }
        try {
            ConsumptionProbe probe;
            String identifier;
            if (path.startsWith("/api/v1/auth/")) {
                identifier = getClientIp(request);
                probe = rateLimitService.tryAuthConsume(identifier);
            } else if (path.startsWith("/api/v1/stream/")) {
                identifier = getUserIdentifierOrIp(request);
                probe = rateLimitService.tryStreamConsume(identifier);
            } else {
                identifier = getUserIdentifierOrIp(request);
                probe = rateLimitService.tryApiConsume(identifier);
            }
            if (probe.isConsumed()) {
                response.addHeader("X-RateLimit-Remaining", String.valueOf(probe.getRemainingTokens()));
                filterChain.doFilter(request, response);
            } else {
                long retryAfterSeconds = probe.getNanosToWaitForRefill() / 1_000_000_000;
                log.warn("Rate limit exceeded for identifier = {}, path={}", identifier, path);
                rejectRequest(response, retryAfterSeconds);
            }
        } catch (Exception e) {
            log.error("Rate limiter unavailable — failing open. reason={}", e.getMessage());
            filterChain.doFilter(request, response);
        }
    }

    private String getUserIdentifierOrIp(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) {
            return auth.getName();
        }
        return getClientIp(request);
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For"); // proxy added header X-Forwarded-For: clientIP, proxy1, proxy2
        if (forwarded != null && !forwarded.isEmpty()) {
            return forwarded.split(",")[0].trim(); // first one is the real client's ip
        }
        return request.getRemoteAddr();
    }

    private void rejectRequest(HttpServletResponse response, long retryAfterSeconds) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.addHeader("Retry-After", String.valueOf(retryAfterSeconds));
        ErrorResponse errorResponse = ErrorResponse.builder()
                .status(429)
                .error("Too many request")
                .message("Rate limit exceeded. Retry after " + retryAfterSeconds + " seconds")
                .path("n/a")
                .build();
        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));

    }
}
