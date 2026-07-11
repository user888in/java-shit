package com.linkpulse.apigateway.security;

import io.jsonwebtoken.Claims;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

/**
 * Applied per-route in application.yml as a filter named "JwtAuthentication".
 * On success, strips the incoming Authorization header and instead forwards
 * X-User-Id / X-User-Role as trusted internal headers - downstream services
 * trust these because they only ever come from the gateway (never expose
 * these services directly to the internet in a real deployment).
 */
@Component
public class JwtAuthenticationFilter extends AbstractGatewayFilterFactory<JwtAuthenticationFilter.Config> {

    private final JwtValidator jwtValidator;

    public JwtAuthenticationFilter(JwtValidator jwtValidator) {
        super(Config.class);
        this.jwtValidator = jwtValidator;
    }

    public static class Config {
        // marker config class - no fields needed for now, but keeping the
        // pattern in place makes it trivial to add per-route options later
        // (e.g. requiredRole) without changing the filter's structure.
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return unauthorized(exchange, "Missing or malformed Authorization header");
            }

            String token = authHeader.substring(7);

            try {
                Claims claims = jwtValidator.validate(token);

                ServerHttpRequest mutatedRequest = request.mutate()
                        .header("X-User-Id", claims.getSubject())
                        .header("X-User-Role", claims.get("role", String.class))
                        .headers(headers -> headers.remove(HttpHeaders.AUTHORIZATION))
                        .build();

                return chain.filter(exchange.mutate().request(mutatedRequest).build());
            } catch (JwtValidator.InvalidTokenException e) {
                return unauthorized(exchange, e.getMessage());
            }
        };
    }

    private Mono<Void> unauthorized(org.springframework.web.server.ServerWebExchange exchange, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().add("Content-Type", "application/json");
        byte[] bytes = ("{\"status\":401,\"message\":\"" + message + "\"}").getBytes(StandardCharsets.UTF_8);
        return response.writeWith(Mono.just(response.bufferFactory().wrap(bytes)));
    }
}
