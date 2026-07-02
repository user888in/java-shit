package com.example.demo.config;

import com.example.demo.service.JwtService;
import com.example.demo.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserService userService;
    private final JwtService jwtService;
    private final ObjectMapper objectMapper;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        // Extract the OAuth2 user details
        var oAuth2User = (org.springframework.security.oauth2.core.user.OAuth2User) authentication.getPrincipal();
        var authenticationToken = (org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken) authentication;
        String registrationId = authenticationToken.getAuthorizedClientRegistrationId(); // e.g., "google", "github"

        // Extract email (must be provided by the OAuth2 provider)
        String email = oAuth2User.getAttribute("email");
        if (email == null || email.isBlank()) {
            throw new IllegalStateException("Email not provided by OAuth2 provider: " + registrationId);
        }

        // Extract name (with fallback)
        String name = oAuth2User.getAttribute("name");
        if (name == null || name.isBlank()) {
            name = email.split("@")[0]; // fallback to email prefix
        }

        // Extract provider-specific ID
        String providerId = extractProviderId(oAuth2User, registrationId);

        // Find or create user in our system
        User user = userService.findOrCreateSocialUser(email, name, registrationId, providerId);

        // Generate tokens using our JWT service (same as email/password login)
        String accessToken = jwtService.generateAccessToken(user.getEmail());
        String refreshToken = jwtService.generateRefreshToken(user.getEmail());

        // Build response (same format as /login endpoint)
        var authResponse = new com.example.demo.dto.response.AuthResponse(accessToken, refreshToken, user.getEmail());
        response.setContentType("application/json");
        response.getCharacterEncoding();
        objectMapper.writeValue(response.getWriter(), authResponse);
    }

    private String extractProviderId(org.springframework.security.oauth2.core.user.OAuth2User oAuth2User, String registrationId) {
        switch (registrationId) {
            case "google":
                return oAuth2User.getAttribute("sub");
            case "github":
                return oAuth2User.getAttribute("id").toString();
            // Add more providers as needed
            default:
                throw new IllegalArgumentException("Unsupported provider: " + registrationId);
        }
    }
}