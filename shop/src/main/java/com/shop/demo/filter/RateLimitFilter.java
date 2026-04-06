package com.shop.demo.filter;

import com.shop.demo.exception.ErrorResponse;
import com.shop.demo.service.RateLimitService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;

@Component
@Slf4j
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {
    private final RateLimitService rateLimitService;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String ip = getClientIp(request);
        String uri = request.getRequestURI();
        boolean allowed;
        if (uri.equals("/api/auth/login") || uri.equals("/api/auth/register")) {
            allowed = rateLimitService.tryConsumeLogin(ip);
            if (!allowed) {
                response.addHeader("X-RateLimit-Remaining", "0");
                response.addHeader("Retry-After", "60");
                try {
                    sendRateLimitError(response, request, "Too many requests try after 1min");
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
                return;
            }
            long remaining = rateLimitService.getRemainingLoginAttempts(ip);
            response.addHeader("X-RateLimit-Remaining", String.valueOf(remaining));
        } else {
            allowed = rateLimitService.tryConsumeGeneral(ip);
            if (!allowed) {
                try {
                    sendRateLimitError(response, request, "Too many request request after some seconds");
                } catch (Exception e) {
                    throw new RuntimeException(e);
                }
                return;
            }
        }
        filterChain.doFilter(request, response);
    }

    private void sendRateLimitError(HttpServletResponse response, HttpServletRequest request, String message) throws Exception {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        ErrorResponse error = ErrorResponse.of(429, message, request.getRequestURI());
        response.getWriter().write(objectMapper.writeValueAsString(error));
    }

    private String getClientIp(HttpServletRequest request) {
        // real ip if proxy is behind
        String ip = request.getHeader("X-Forwarded-For");
        if (ip != null && !ip.isEmpty()) {
            // first ip is real in case of multiple proxies
            return ip.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

}
