package com.linkpulse.redirectservice.client;

import com.linkpulse.redirectservice.dto.UrlLookupResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class UrlServiceClient {

    private final RestClient restClient;

    public UrlServiceClient(@Value("${linkpulse.url-service.base-url}") String urlServiceBaseUrl) {
        this.restClient = RestClient.builder()
                .baseUrl(urlServiceBaseUrl)
                // Fail fast - this is the hot redirect path, we cannot let a slow
                // upstream call degrade the whole redirect service's latency.
                .requestFactory(new org.springframework.http.client.SimpleClientHttpRequestFactory() {{
                    setConnectTimeout(1000);
                    setReadTimeout(1500);
                }})
                .build();
    }

    public UrlLookupResponse resolve(String shortCode) {
        return restClient.get()
                .uri("/api/v1/urls/{shortCode}", shortCode)
                .retrieve()
                .body(UrlLookupResponse.class);
    }
}
