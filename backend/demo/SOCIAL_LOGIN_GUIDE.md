# Social Login Integration Guide

This guide explains how social login (OAuth2) is integrated into the Spring Boot application with JWT-based authentication.

## Overview

The application supports:
- Traditional email/password authentication (using JWT)
- Social login via Google and GitHub (OAuth2)

After successful social authentication, the application issues its own JWT tokens (access and refresh) that are used for securing API endpoints. This ensures:
- Consistent token format regardless of authentication method
- Centralized token management (expiration, refresh, revocation)
- No exposure of third-party tokens to the client

## Flow

### Social Login Flow

1. User clicks "Login with Google/GitHub" on the frontend
2. Frontend redirects to `/oauth2/authorization/{provider}` (e.g., `/oauth2/authorization/google`)
3. Spring Security OAuth2 Client redirects user to the provider's login page
4. User authenticates with the provider and grants permission
5. Provider redirects back to `/login/oauth2/code/{provider}` with an authorization code
6. Spring Security exchanges the code for an access token from the provider
7. Spring Security fetches user profile from the provider using the access token
8. Spring Security creates an `OAuth2AuthenticationToken` with the user's details
9. Our `OAuth2LoginSuccessHandler` is invoked:
   - Extracts email, name, and provider-specific ID from the authentication
   - Delegates to `UserService.findOrCreateSocialUser()` to:
     - Find existing user by email (enabling account linking)
     - Create new user if not found
     - Link provider to existing user if not already linked
   - Uses `JwtService` to generate access and refresh tokens (same as email/password login)
   - Returns JSON response with tokens (same format as `/api/auth/login`)

### Token Usage

- The frontend stores the JWT access token (and refresh token) received from the social login endpoint
- For subsequent API calls, the frontend sends the access token in the `Authorization: Bearer <token>` header
- The backend validates the JWT using `JwtService` (same validation for tokens from email/password or social login)

## Database Schema

The `users` table includes:

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | BIGINT | NO | Primary key |
| name | VARCHAR | NO | User's full name |
| email | VARCHAR | NO (Unique) | User's email address |
| password | VARCHAR | YES | Hashed password (NULL for social users) |
| role | VARCHAR | NO | User role (e.g., "USER") |
| active | BOOLEAN | NO | Account status |
| provider | VARCHAR(20) | YES | OAuth2 provider ("google", "github", or NULL) |
| provider_id | VARCHAR(100) | YES | Unique ID from the provider |

## Key Classes

### 1. `OAuth2LoginSuccessHandler` (`src/main/java/com/example/demo/config/OAuth2LoginSuccessHandler.java`)

Handles successful OAuth2 authentication:
- Extracts standardized user information (email, name, provider ID)
- Delegates user lookup/creation to `UserService`
- Uses `JwtService` to generate tokens
- Returns JSON response matching `/api/auth/login` format

### 2. `UserService` (`src/main/java/com/example/demo/service/UserService.java`)

Contains `findOrCreateSocialUser()` method:
- Finds existing user by email (for account linking)
- Checks for existing provider ID to prevent duplicate social accounts
- Creates new social user with `provider` and `providerId` fields set
- Password remains `NULL` for social users

### 3. `User` Entity (`src/main/java/com/example/demo/model/User.java`)

Added fields:
- `provider`: OAuth2 provider name
- `providerId`: Unique identifier from the provider

### 4. `UserRepository` (`src/main/java/com/example/demo/repository/UserRepository.java`)

Added method:
- `findByProviderAndProviderId(String provider, String providerId)`

### 5. `JwtService` (`src/main/java/com/example/demo/service/JwtService.java`)

Unified JWT handling:
- Generates access and refresh tokens
- Validates tokens
- Extracts claims (email, etc.)
- Used by both email/password login and social login

### 6. `SecurityConfig` (`src/main/java/com/example/demo/config/SecurityConfig.java`)

Configures OAuth2 login:
- Permits access to `/oauth2/**` endpoints
- Uses `OAuth2LoginSuccessHandler` for successful authentication
- Configures `UserDetailsService` for JWT validation

## Configuration

### application.properties

```properties
# Google OAuth2
spring.security.oauth2.client.registration.google.client-id=YOUR_GOOGLE_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_GOOGU
spring.security.oauth2.client.registration.google.scope=profile,email

# GitHub OAuth2
spring.security.oauth2.client.registration.github.client-id=YOUR_GITHUB_CLIENT_ID
spring.security.oauth2.client.registration.github.client-secret=YOUR_GITHUB_CLIENT_SECRET
spring.security.oauth2.client.registration.github.scope=user:email
spring.security.oauth2.client.registration.github.client-name=GitHub

# JWT Configuration
jwt.secret=YOUR_SECRET_KEY_CHANGE_IN_PRODUCTION
jwt.access-token-expiration=86400000 # 24 hours
jwt.refresh-token-expiration=604800000 # 7 days
```

### pom.xml Dependencies

```xml
<!-- OAuth2 Client -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-oauth2-client</artifactId>
</dependency>

<!-- Lombok (for @RequiredArgsConstructor) -->
<dependency>
    <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
</dependency>
```

## Testing Social Login

1. Start the application
2. Navigate to the login page (if using a frontend) or directly access:
   - Google: `http://localhost:8080/oauth2/authorization/google`
   - GitHub: `http://localhost:8080/oauth2/authorization/github`
3. Complete the provider's login flow
4. Upon success, you should receive a JSON response:
   ```json
   {
     "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "email": "user@example.com"
   }
   ```
5. Use the `accessToken` to access protected endpoints (e.g., `GET /api/products`)

## Account Linking

The system supports account linking:
- If a user signs up with email/password first, they can later log in with Google/GitHub using the same email
- The social provider information (`provider` and `providerId`) will be linked to the existing account
- Subsequent logins via either method will access the same account

## Adding New Providers

To add a new OAuth2 provider (e.g., Facebook):

1. Add configuration to `application.properties`:
   ```properties
   spring.security.oauth2.client.registration.facebook.client-id=YOUR_FACEBOOK_CLIENT_ID
   spring.security.oauth2.client.registration.facebook.client-secret=YOUR_FACEBOOK_CLIENT_SECRET
   spring.security.oauth2.client.registration.facebook.scope=email,public_profile
   ```

2. Update the `extractProviderId` method in `OAuth2LoginSuccessHandler` to handle the new provider's user ID attribute:
   ```java
   case "facebook":
       return oAuth2User.getAttribute("id").toString();
   ```

3. No changes needed to `UserService`, `SecurityConfig`, or database schema.

## Security Considerations

- **Token Security**: The application's JWT secret must be kept secure and rotated periodically
- **State Parameter**: Spring Security OAuth2 Client automatically generates and validates the `state` parameter to prevent CSRF
- **HTTPS**: In production, ensure all OAuth2 flows occur over HTTPS
- **Provider Credentials**: Store client secrets securely (e.g., environment variables, vault)
- **Email Verification**: Consider verifying email addresses from providers if required by your security policy
- **Scope Limitation**: Request only necessary scopes from providers (minimize data exposure)

## Troubleshooting

### Common Issues

1. **"Email not provided by OAuth2 provider"**
   - Solution: Ensure the provider is configured to return the user's email (check scopes and provider settings)
   - For GitHub: Confirm `user:email` scope is included

2. **Invalid client credentials**
   - Solution: Verify the client ID and secret in `application.properties` match those in the provider's developer console

3. **Redirect URI mismatch**
   - Solution: Ensure the redirect URI registered with the provider matches `http://your-domain/login/oauth2/code/{provider}`

4. **JWT validation failures**
   - Solution: Ensure the same JWT secret is used for token generation and validation
   - Check token expiration and signature

## Further Reading

- [Spring Security OAuth2 Client Documentation](https://docs.spring.io/spring-security/reference/servlet/oauth2/login/)
- [Spring Boot OAuth2 Social Login Guide](https://spring.io/guides/tutorials/spring-boot-oauth2/)
- [JWT Best Practices](https://jwt.io/introduction/)
- [OAuth 2.0 Threat Model](https://tools.ietf.org/html/rfc6819)

---
*This guide is maintained as part of the project documentation. Update it when making changes to the authentication system.*