package com.shop.demo.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // allowed origins
        config.setAllowedOrigins(List.of("http://localhost:3000",
                "http://localhost:5173"));
        // allowed Http methods
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        // allowed headers
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        // show response headers to the browser
        config.setExposedHeaders(List.of("Authorization"));
        // allow cookies/credentials
        config.setAllowCredentials(true);
        // cache preflight response time
        config.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
