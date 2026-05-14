# StreamBox — Project Handoff Document
## Complete state of the project for new chat continuation

---

## Project Overview

**StreamBox** is a production-grade Netflix-like streaming platform backend built with Spring Boot.
Every decision is production-standard — no tutorial shortcuts.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Spring Boot 3.5.14, Java 17 |
| Database | PostgreSQL 16 (Docker port 5433) |
| Migrations | Flyway |
| Cache | Redis 7 (Docker port 6380) |
| Message Broker | Apache Kafka (Docker port 9092) |
| Auth | JWT (access 15min + refresh 7days in DB) |
| Rate Limiting | Bucket4j + Redis (token bucket algorithm) |
| Resilience | Resilience4j (Circuit Breaker, Retry, Bulkhead) |
| Metrics | Micrometer + Prometheus + Grafana |
| ORM | Spring Data JPA + Hibernate |
| Security | Spring Security 6 |

---

## Docker Setup

```powershell
# PostgreSQL (port 5433 — local PG already on 5432)
docker run --name streambox-db -e POSTGRES_DB=streamboxdb -e POSTGRES_USER=streambox -e POSTGRES_PASSWORD=streambox123 -p 5433:5432 -d postgres:16

# Redis (port 6380 — avoid local Redis conflicts)
docker run --name streambox-redis -p 6380:6379 -d redis:7-alpine

# Kafka
docker run --name streambox-kafka -p 9092:9092 -d apache/kafka:3.7.1
```

---

## Project Structure

```
streambox/
├── pom.xml
├── prometheus.yml
└── src/main/
    ├── java/com/streambox/
    │   ├── StreamboxApplication.java
    │   ├── auth/
    │   │   ├── AuthController.java
    │   │   ├── AuthService.java
    │   │   ├── JwtAuthFilter.java
    │   │   ├── JwtService.java
    │   │   ├── RefreshToken.java
    │   │   ├── RefreshTokenRepository.java
    │   │   └── dto/
    │   │       ├── AuthResponse.java
    │   │       ├── LoginRequest.java
    │   │       └── RegisterRequest.java
    │   ├── common/
    │   │   └── PageResponse.java
    │   ├── config/
    │   │   ├── CacheNames.java
    │   │   ├── KafkaTopics.java
    │   │   ├── RateLimitFilter.java
    │   │   ├── RateLimitService.java
    │   │   ├── RedisConfig.java
    │   │   ├── RateLimitConfig.java
    │   │   └── SecurityConfig.java
    │   ├── event/
    │   │   ├── EventProducer.java
    │   │   ├── MovieWatchedEvent.java
    │   │   └── UserRegisteredEvent.java
    │   ├── exception/
    │   │   ├── ErrorResponse.java
    │   │   ├── GlobalExceptionHandler.java
    │   │   └── ResourceNotFoundException.java
    │   ├── monitoring/
    │   │   ├── KafkaHealthIndicator.java
    │   │   ├── MetricsService.java
    │   │   └── StreamboxHealthIndicator.java
    │   ├── movie/
    │   │   ├── Movie.java
    │   │   ├── MovieController.java
    │   │   ├── MovieMapper.java
    │   │   ├── MovieRepository.java
    │   │   ├── MovieService.java
    │   │   └── dto/
    │   │       ├── MovieRequest.java
    │   │       ├── MovieResponse.java
    │   │       └── MovieStatsResponse.java
    │   ├── streaming/
    │   │   ├── AnalyticsConsumer.java
    │   │   ├── StreamingController.java
    │   │   ├── ViewCountSyncJob.java
    │   │   ├── WatchHistory.java
    │   │   ├── WatchHistoryConsumer.java
    │   │   ├── WatchHistoryRepository.java
    │   │   └── WatchProgressRequest.java
    │   └── user/
    │       ├── Role.java
    │       ├── User.java
    │       ├── UserDetailsServiceImpl.java
    │       ├── UserRepository.java
    │       ├── WatchlistController.java
    │       └── WatchlistService.java
    └── resources/
        ├── application.properties
        └── db/migration/
            ├── V1__create_movies_table.sql
            ├── V2__seed_movies.sql
            ├── V3__create_users_and_watchlist.sql
            ├── V4__create_refresh_tokens.sql
            └── V5__create_watch_history.sql
```

---

## `pom.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.5.14</version>
        <relativePath/>
    </parent>

    <groupId>com.streambox</groupId>
    <artifactId>streambox</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <properties>
        <java.version>17</java.version>
    </properties>

    <dependencies>
        <!-- Core -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-security</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-aop</artifactId>
        </dependency>

        <!-- Database -->
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-core</artifactId>
        </dependency>
        <dependency>
            <groupId>org.flywaydb</groupId>
            <artifactId>flyway-database-postgresql</artifactId>
        </dependency>

        <!-- Redis -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-redis</artifactId>
        </dependency>

        <!-- Kafka -->
        <dependency>
            <groupId>org.springframework.kafka</groupId>
            <artifactId>spring-kafka</artifactId>
        </dependency>

        <!-- JWT -->
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-api</artifactId>
            <version>0.12.6</version>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-impl</artifactId>
            <version>0.12.6</version>
            <scope>runtime</scope>
        </dependency>
        <dependency>
            <groupId>io.jsonwebtoken</groupId>
            <artifactId>jjwt-jackson</artifactId>
            <version>0.12.6</version>
            <scope>runtime</scope>
        </dependency>

        <!-- Rate Limiting -->
        <dependency>
            <groupId>com.bucket4j</groupId>
            <artifactId>bucket4j-core</artifactId>
            <version>8.10.1</version>
        </dependency>
        <dependency>
            <groupId>com.bucket4j</groupId>
            <artifactId>bucket4j-redis</artifactId>
            <version>8.10.1</version>
        </dependency>

        <!-- Resilience4j -->
        <dependency>
            <groupId>io.github.resilience4j</groupId>
            <artifactId>resilience4j-spring-boot3</artifactId>
            <version>2.2.0</version>
        </dependency>

        <!-- Monitoring -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <dependency>
            <groupId>io.micrometer</groupId>
            <artifactId>micrometer-registry-prometheus</artifactId>
        </dependency>

        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- Test -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
                <executions>
                    <execution>
                        <goals>
                            <goal>build-info</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <executions>
                    <execution>
                        <id>default-compile</id>
                        <phase>compile</phase>
                        <goals><goal>compile</goal></goals>
                        <configuration>
                            <annotationProcessorPaths>
                                <path>
                                    <groupId>org.projectlombok</groupId>
                                    <artifactId>lombok</artifactId>
                                </path>
                            </annotationProcessorPaths>
                        </configuration>
                    </execution>
                    <execution>
                        <id>default-testCompile</id>
                        <phase>test-compile</phase>
                        <goals><goal>testCompile</goal></goals>
                        <configuration>
                            <annotationProcessorPaths>
                                <path>
                                    <groupId>org.projectlombok</groupId>
                                    <artifactId>lombok</artifactId>
                                </path>
                            </annotationProcessorPaths>
                        </configuration>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

---

## `application.properties`

```properties
server.port=8080
spring.application.name=streambox

# Database
spring.datasource.url=jdbc:postgresql://localhost:5433/streamboxdb
spring.datasource.username=streambox
spring.datasource.password=streambox123
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=2
spring.datasource.connect-timeout=2s

# JPA
spring.jpa.hibernate.ddl-auto=validate
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.format_sql=true

# Flyway
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration
spring.flyway.baseline-on-migrate=true

# Jackson
spring.jackson.default-property-inclusion=non_null
spring.jackson.serialization.write-dates-as-timestamps=false

# JWT
app.jwt.secret=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
app.jwt.access-token-expiry=900000
app.jwt.refresh-token-expiry=604800000

# Redis
spring.data.redis.host=localhost
spring.data.redis.port=6380
spring.data.redis.timeout=2s
spring.data.redis.connect-timeout=2s

# Cache
spring.cache.type=redis
spring.cache.redis.time-to-live=600000
spring.cache.redis.cache-null-values=false

# Kafka Producer
spring.kafka.bootstrap-servers=localhost:9092
spring.kafka.producer.key-serializer=org.apache.kafka.common.serialization.StringSerializer
spring.kafka.producer.value-serializer=org.springframework.kafka.support.serializer.JsonSerializer
spring.kafka.producer.acks=all
spring.kafka.producer.retries=3
spring.kafka.producer.properties.enable.idempotence=true

# Kafka Consumer
spring.kafka.consumer.group-id=streambox-group
spring.kafka.consumer.auto-offset-reset=earliest
spring.kafka.consumer.key-deserializer=org.apache.kafka.common.serialization.StringDeserializer
spring.kafka.consumer.value-deserializer=org.springframework.kafka.support.serializer.JsonDeserializer
spring.kafka.consumer.properties.spring.json.trusted.packages=com.streambox.*

# Circuit Breakers
resilience4j.circuitbreaker.instances.redis-cache.sliding-window-type=COUNT_BASED
resilience4j.circuitbreaker.instances.redis-cache.sliding-window-size=10
resilience4j.circuitbreaker.instances.redis-cache.minimum-number-of-calls=5
resilience4j.circuitbreaker.instances.redis-cache.failure-rate-threshold=50
resilience4j.circuitbreaker.instances.redis-cache.slow-call-rate-threshold=80
resilience4j.circuitbreaker.instances.redis-cache.slow-call-duration-threshold=2s
resilience4j.circuitbreaker.instances.redis-cache.wait-duration-in-open-state=30s
resilience4j.circuitbreaker.instances.redis-cache.permitted-number-of-calls-in-half-open-state=3
resilience4j.circuitbreaker.instances.redis-cache.automatic-transition-from-open-to-half-open-enabled=true

resilience4j.circuitbreaker.instances.kafka-producer.sliding-window-type=COUNT_BASED
resilience4j.circuitbreaker.instances.kafka-producer.sliding-window-size=10
resilience4j.circuitbreaker.instances.kafka-producer.minimum-number-of-calls=5
resilience4j.circuitbreaker.instances.kafka-producer.failure-rate-threshold=60
resilience4j.circuitbreaker.instances.kafka-producer.wait-duration-in-open-state=60s
resilience4j.circuitbreaker.instances.kafka-producer.automatic-transition-from-open-to-half-open-enabled=true

# Retry
resilience4j.retry.instances.db-retry.max-attempts=3
resilience4j.retry.instances.db-retry.wait-duration=500ms
resilience4j.retry.instances.db-retry.retry-exceptions=org.springframework.dao.TransientDataAccessException

# Bulkhead
resilience4j.bulkhead.instances.streaming.max-concurrent-calls=50
resilience4j.bulkhead.instances.streaming.max-wait-duration=100ms

# Actuator
management.endpoints.web.exposure.include=health,info,metrics,prometheus,circuitbreakers
management.endpoint.health.show-details=always
management.endpoint.health.show-components=always
management.health.circuitbreakers.enabled=true
management.health.ratelimiters.enabled=true
management.prometheus.metrics.export.enabled=true
management.metrics.distribution.percentiles-histogram.http.server.requests=true
management.metrics.distribution.percentiles.http.server.requests=0.5,0.90,0.95,0.99
management.info.env.enabled=true
management.info.java.enabled=true
management.info.os.enabled=true
management.info.build.enabled=true

# Info
info.app.name=StreamBox API
info.app.version=1.0.0
info.app.description=Production-grade streaming platform backend

# Logging
logging.level.com.streambox=DEBUG
logging.level.org.hibernate.SQL=WARN
logging.level.org.springframework.security=WARN

# Scheduling
spring.task.scheduling.pool.size=5
```

---

## Database Migrations

### `V1__create_movies_table.sql`
```sql
CREATE TABLE movies (
    id           BIGSERIAL PRIMARY KEY,
    title        VARCHAR(255)   NOT NULL,
    genre        VARCHAR(100)   NOT NULL,
    rating       NUMERIC(3,1),
    release_year INT,
    view_count   BIGINT         NOT NULL DEFAULT 0,
    created_at   TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_movies_genre  ON movies(genre);
CREATE INDEX idx_movies_rating ON movies(rating);
```

### `V2__seed_movies.sql`
```sql
INSERT INTO movies (title, genre, rating, release_year) VALUES
('Inception',       'Sci-Fi',   8.8, 2010),
('The Dark Knight', 'Action',   9.0, 2008),
('Interstellar',    'Sci-Fi',   8.6, 2014),
('Parasite',        'Thriller', 8.6, 2019),
('The Godfather',   'Drama',    9.2, 1972);
```

### `V3__create_users_and_watchlist.sql`
```sql
CREATE TABLE users (
    id         BIGSERIAL    PRIMARY KEY,
    email      VARCHAR(255) NOT NULL UNIQUE,
    username   VARCHAR(100) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    role       VARCHAR(20)  NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE watchlist (
    user_id  BIGINT NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    movie_id BIGINT NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    added_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, movie_id)
);

CREATE INDEX idx_watchlist_user ON watchlist(user_id);
```

### `V4__create_refresh_tokens.sql`
```sql
CREATE TABLE refresh_tokens (
    id          BIGSERIAL    PRIMARY KEY,
    token       VARCHAR(512) NOT NULL UNIQUE,
    user_id     BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expiry_date TIMESTAMP    NOT NULL,
    revoked     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_token   ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
```

### `V5__create_watch_history.sql`
```sql
CREATE TABLE watch_history (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT    NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
    movie_id     BIGINT    NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    progress_sec INT       NOT NULL DEFAULT 0,
    completed    BOOLEAN   NOT NULL DEFAULT FALSE,
    watched_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_watch_history_user  ON watch_history(user_id);
CREATE INDEX idx_watch_history_movie ON watch_history(movie_id);
CREATE UNIQUE INDEX idx_watch_history_user_movie ON watch_history(user_id, movie_id);
```

---

## All Source Files — Current Correct State

### `StreamboxApplication.java`
```java
package com.streambox;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.web.config.EnableSpringDataWebSupport;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableSpringDataWebSupport(
    pageSerializationMode = EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO
)
public class StreamboxApplication {
    public static void main(String[] args) {
        SpringApplication.run(StreamboxApplication.class, args);
    }
}
```

---

### `common/PageResponse.java`
```java
package com.streambox.common;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.domain.Page;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class PageResponse<T> {
    private List<T> content;
    private int     pageNumber;
    private int     pageSize;
    private long    totalElements;
    private int     totalPages;
    private boolean last;
    private boolean first;

    public static <T> PageResponse<T> from(Page<T> page) {
        return PageResponse.<T>builder()
                .content(page.getContent())
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .first(page.isFirst())
                .build();
    }
}
```

---

### `exception/ResourceNotFoundException.java`
```java
package com.streambox.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String resource, Long id) {
        super(String.format("%s not found with id: %d", resource, id));
    }
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
```

### `exception/ErrorResponse.java`
```java
package com.streambox.exception;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ErrorResponse {
    private int                 status;
    private String              error;
    private String              message;
    private String              path;
    @Builder.Default
    private LocalDateTime       timestamp = LocalDateTime.now();
    private Map<String, String> validationErrors;
}
```

### `exception/GlobalExceptionHandler.java`
```java
package com.streambox.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorResponse handleNotFound(ResourceNotFoundException ex,
                                        HttpServletRequest request) {
        log.warn("Resource not found: {}", ex.getMessage());
        return ErrorResponse.builder()
                .status(404).error("Not Found")
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .build();
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleBadRequest(IllegalArgumentException ex,
                                          HttpServletRequest request) {
        return ErrorResponse.builder()
                .status(400).error("Bad Request")
                .message(ex.getMessage())
                .path(request.getRequestURI())
                .build();
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleValidation(MethodArgumentNotValidException ex,
                                          HttpServletRequest request) {
        Map<String, String> errors = ex.getBindingResult().getFieldErrors()
                .stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        f -> f.getDefaultMessage() != null ? f.getDefaultMessage() : "Invalid"
                ));
        log.warn("Validation failed: {}", errors);
        return ErrorResponse.builder()
                .status(400).error("Validation Failed")
                .message("One or more fields are invalid")
                .path(request.getRequestURI())
                .validationErrors(errors)
                .build();
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleGeneric(Exception ex, HttpServletRequest request) {
        log.error("Unhandled exception at {}: {}", request.getRequestURI(), ex.getMessage(), ex);
        return ErrorResponse.builder()
                .status(500).error("Internal Server Error")
                .message("An unexpected error occurred")
                .path(request.getRequestURI())
                .build();
    }
}
```

---

### `config/CacheNames.java`
```java
package com.streambox.config;

public final class CacheNames {
    public static final String MOVIES    = "movies";
    public static final String MOVIE     = "movie";
    public static final String TOP_RATED = "top-rated";
    public static final String WATCHLIST = "watchlist";
    private CacheNames() {}
}
```

### `config/KafkaTopics.java`
```java
package com.streambox.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopics {
    public static final String MOVIE_WATCHED   = "movie.watched";
    public static final String USER_REGISTERED = "user.registered";

    @Bean
    public NewTopic movieWatchedTopic() {
        return TopicBuilder.name(MOVIE_WATCHED).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic userRegisteredTopic() {
        return TopicBuilder.name(USER_REGISTERED).partitions(1).replicas(1).build();
    }
}
```

### `config/RedisConfig.java`
```java
package com.streambox.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import io.lettuce.core.ClientOptions;
import io.lettuce.core.SocketOptions;
import io.lettuce.core.TimeoutOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableCaching
public class RedisConfig {

    @Value("${spring.data.redis.host}")
    private String redisHost;

    @Value("${spring.data.redis.port}")
    private int redisPort;

    @Bean
    public RedisConnectionFactory redisConnectionFactory() {
        RedisStandaloneConfiguration server =
                new RedisStandaloneConfiguration(redisHost, redisPort);

        LettuceClientConfiguration client = LettuceClientConfiguration.builder()
                .commandTimeout(Duration.ofSeconds(2))
                .shutdownTimeout(Duration.ofSeconds(2))
                .clientOptions(ClientOptions.builder()
                        .socketOptions(SocketOptions.builder()
                                .connectTimeout(Duration.ofSeconds(2))
                                .build())
                        .timeoutOptions(TimeoutOptions.enabled())
                        .disconnectedBehavior(
                                ClientOptions.DisconnectedBehavior.REJECT_COMMANDS)
                        .autoReconnect(true)
                        .build())
                .build();

        return new LettuceConnectionFactory(server, client);
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(
            RedisConnectionFactory redisConnectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(redisConnectionFactory);
        GenericJackson2JsonRedisSerializer serializer =
                new GenericJackson2JsonRedisSerializer(objectMapper());
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(serializer);
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(serializer);
        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public RedisCacheManager cacheManager(
            RedisConnectionFactory redisConnectionFactory) {
        GenericJackson2JsonRedisSerializer serializer =
                new GenericJackson2JsonRedisSerializer(objectMapper());
        RedisCacheConfiguration defaults = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(10))
                .disableCachingNullValues()
                .serializeKeysWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair
                        .fromSerializer(serializer));

        Map<String, RedisCacheConfiguration> configs = new HashMap<>();
        configs.put(CacheNames.MOVIES,    defaults.entryTtl(Duration.ofMinutes(10)));
        configs.put(CacheNames.MOVIE,     defaults.entryTtl(Duration.ofMinutes(10)));
        configs.put(CacheNames.TOP_RATED, defaults.entryTtl(Duration.ofMinutes(5)));
        configs.put(CacheNames.WATCHLIST, defaults.entryTtl(Duration.ofMinutes(2)));

        return RedisCacheManager.builder(redisConnectionFactory)
                .cacheDefaults(defaults)
                .withInitialCacheConfigurations(configs)
                .build();
    }

    private ObjectMapper objectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY);
        return mapper;
    }
}
```

### `config/RateLimitConfig.java`
```java
package com.streambox.config;

import io.github.bucket4j.distributed.proxy.ProxyManager;
import io.github.bucket4j.redis.lettuce.cas.LettuceBasedProxyManager;
import io.lettuce.core.api.StatefulRedisConnection;
import io.lettuce.core.codec.ByteArrayCodec;
import io.lettuce.core.codec.RedisCodec;
import io.lettuce.core.codec.StringCodec;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;

@Configuration
public class RateLimitConfig {

    @Bean
    public StatefulRedisConnection<String, byte[]> rateLimitRedisConnection(
            LettuceConnectionFactory lettuceConnectionFactory) {
        return lettuceConnectionFactory.getNativeClient()
                .connect(RedisCodec.of(StringCodec.UTF8, ByteArrayCodec.INSTANCE));
    }

    @Bean
    public ProxyManager<String> bucketProxyManager(
            StatefulRedisConnection<String, byte[]> rateLimitRedisConnection) {
        return LettuceBasedProxyManager.builderFor(rateLimitRedisConnection).build();
    }
}
```

### `config/RateLimitService.java`
```java
package com.streambox.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.ConsumptionProbe;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.function.Supplier;

@Service
@RequiredArgsConstructor
public class RateLimitService {

    private final ProxyManager<String> bucketProxyManager;

    private static final Supplier<BucketConfiguration> API_CONFIG = () ->
            BucketConfiguration.builder()
                    .addLimit(Bandwidth.builder()
                            .capacity(60)
                            .refillIntervally(60, Duration.ofMinutes(1))
                            .build())
                    .build();

    private static final Supplier<BucketConfiguration> STREAM_CONFIG = () ->
            BucketConfiguration.builder()
                    .addLimit(Bandwidth.builder()
                            .capacity(200)
                            .refillIntervally(200, Duration.ofMinutes(1))
                            .build())
                    .build();

    private static final Supplier<BucketConfiguration> AUTH_CONFIG = () ->
            BucketConfiguration.builder()
                    .addLimit(Bandwidth.builder()
                            .capacity(5)
                            .refillIntervally(5, Duration.ofMinutes(15))
                            .build())
                    .build();

    public ConsumptionProbe tryApiConsume(String userId) {
        return bucketProxyManager.builder()
                .build("rate:api:" + userId, API_CONFIG)
                .tryConsumeAndReturnRemaining(1);
    }

    public ConsumptionProbe tryStreamConsume(String userId) {
        return bucketProxyManager.builder()
                .build("rate:stream:" + userId, STREAM_CONFIG)
                .tryConsumeAndReturnRemaining(1);
    }

    public ConsumptionProbe tryAuthConsume(String ip) {
        return bucketProxyManager.builder()
                .build("rate:auth:" + ip, AUTH_CONFIG)
                .tryConsumeAndReturnRemaining(1);
    }
}
```

### `config/RateLimitFilter.java`
```java
package com.streambox.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.streambox.exception.ErrorResponse;
import com.streambox.monitoring.MetricsService;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
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
    private final MetricsService   metricsService;
    private final ObjectMapper     objectMapper;

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        if (!path.startsWith("/api/")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            ConsumptionProbe probe;
            String identifier;
            String endpointType;

            if (path.startsWith("/api/v1/auth/")) {
                identifier   = getClientIp(request);
                probe        = rateLimitService.tryAuthConsume(identifier);
                endpointType = "auth";
            } else if (path.startsWith("/api/v1/stream/")) {
                identifier   = getUserIdentifier();
                probe        = rateLimitService.tryStreamConsume(identifier);
                endpointType = "stream";
            } else {
                identifier   = getUserIdentifier();
                probe        = rateLimitService.tryApiConsume(identifier);
                endpointType = "api";
            }

            if (probe.isConsumed()) {
                response.addHeader("X-RateLimit-Remaining",
                        String.valueOf(probe.getRemainingTokens()));
                filterChain.doFilter(request, response);
            } else {
                long retryAfter = probe.getNanosToWaitForRefill() / 1_000_000_000;
                metricsService.recordRateLimitRejection(endpointType);
                log.warn("Rate limit exceeded endpoint_type={} identifier={}",
                        endpointType, identifier);
                rejectRequest(response, retryAfter);
            }
        } catch (Exception e) {
            log.error("Rate limiter unavailable — failing open. reason={}", e.getMessage());
            filterChain.doFilter(request, response);
        }
    }

    private String getUserIdentifier() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()
                && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return "anonymous";
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isEmpty()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private void rejectRequest(HttpServletResponse response,
                                long retryAfterSeconds) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.addHeader("Retry-After", String.valueOf(retryAfterSeconds));
        ErrorResponse error = ErrorResponse.builder()
                .status(429).error("Too Many Requests")
                .message("Rate limit exceeded. Retry after "
                        + retryAfterSeconds + " seconds")
                .path("n/a")
                .build();
        response.getWriter().write(objectMapper.writeValueAsString(error));
    }
}
```

### `config/SecurityConfig.java`
```java
package com.streambox.config;

import com.streambox.auth.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter   jwtAuthFilter;
    private final RateLimitFilter rateLimitFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s ->
                        s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        .requestMatchers("/api/v1/movies/**").permitAll()
                        .requestMatchers("/actuator/**").permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthFilter, RateLimitFilter.class)
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
```

---

### `movie/Movie.java`
```java
package com.streambox.movie;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "movies")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Movie {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, length = 100)
    private String genre;

    @Column(columnDefinition = "numeric(3,1)")
    private Double rating;

    @Column(name = "release_year")
    private Integer releaseYear;

    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private Long viewCount = 0L;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Movie movie)) return false;
        return id != null && id.equals(movie.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
```

### `movie/dto/MovieRequest.java`
```java
package com.streambox.movie.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @NoArgsConstructor @AllArgsConstructor @Builder
public class MovieRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 255)
    private String title;

    @NotBlank(message = "Genre is required")
    @Size(max = 100)
    private String genre;

    @DecimalMin("0.0") @DecimalMax("10.0")
    private Double rating;

    @Min(1888) @Max(2100)
    private Integer releaseYear;
}
```

### `movie/dto/MovieResponse.java`
```java
package com.streambox.movie.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Builder @NoArgsConstructor @AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class MovieResponse {
    private Long          id;
    private String        title;
    private String        genre;
    private Double        rating;
    private Integer       releaseYear;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

### `movie/dto/MovieStatsResponse.java`
```java
package com.streambox.movie.dto;

import lombok.*;

@Getter @Builder @NoArgsConstructor @AllArgsConstructor
public class MovieStatsResponse {
    private Long movieId;
    private Long viewCount;
}
```

### `movie/MovieRepository.java`
```java
package com.streambox.movie;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MovieRepository extends JpaRepository<Movie, Long> {

    Page<Movie> findByGenreIgnoreCase(String genre, Pageable pageable);

    @Query("SELECT m FROM Movie m WHERE m.rating >= :minRating ORDER BY m.rating DESC")
    Page<Movie> findTopRated(@Param("minRating") Double minRating, Pageable pageable);

    boolean existsByTitleIgnoreCase(String title);

    @Modifying
    @Query("UPDATE Movie m SET m.viewCount = m.viewCount + :count WHERE m.id = :id")
    void incrementViewCount(@Param("id") Long id, @Param("count") Long count);
}
```

### `movie/MovieMapper.java`
```java
package com.streambox.movie;

import com.streambox.movie.dto.MovieRequest;
import com.streambox.movie.dto.MovieResponse;
import org.springframework.stereotype.Component;

@Component
public class MovieMapper {

    public Movie toEntity(MovieRequest request) {
        return Movie.builder()
                .title(request.getTitle())
                .genre(request.getGenre())
                .rating(request.getRating())
                .releaseYear(request.getReleaseYear())
                .build();
    }

    public MovieResponse toResponse(Movie movie) {
        return MovieResponse.builder()
                .id(movie.getId())
                .title(movie.getTitle())
                .genre(movie.getGenre())
                .rating(movie.getRating())
                .releaseYear(movie.getReleaseYear())
                .createdAt(movie.getCreatedAt())
                .updatedAt(movie.getUpdatedAt())
                .build();
    }
}
```

### `movie/MovieService.java`
```java
package com.streambox.movie;

import com.streambox.common.PageResponse;
import com.streambox.config.CacheNames;
import com.streambox.exception.ResourceNotFoundException;
import com.streambox.monitoring.MetricsService;
import com.streambox.movie.dto.MovieRequest;
import com.streambox.movie.dto.MovieResponse;
import com.streambox.movie.dto.MovieStatsResponse;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Pageable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class MovieService {

    private final MovieRepository               movieRepository;
    private final MovieMapper                   movieMapper;
    private final MetricsService                metricsService;
    private final RedisTemplate<String, Object> redisTemplate;

    @CircuitBreaker(name = "redis-cache", fallbackMethod = "getAllMoviesFallback")
    @Cacheable(value = CacheNames.MOVIES,
            key = "#pageable.pageNumber + '-' + #pageable.pageSize + '-' + #pageable.sort")
    public PageResponse<MovieResponse> getAllMovies(Pageable pageable) {
        log.debug("Cache MISS — fetching all movies from DB");
        metricsService.recordCacheMiss(CacheNames.MOVIES);
        Timer.Sample sample = metricsService.startDbQueryTimer();
        boolean success = false;
        try {
            PageResponse<MovieResponse> result = PageResponse.from(
                    movieRepository.findAll(pageable).map(movieMapper::toResponse));
            success = true;
            return result;
        } finally {
            metricsService.recordDbQueryDuration(sample, "findAll", success);
        }
    }

    public PageResponse<MovieResponse> getAllMoviesFallback(Pageable pageable, Throwable ex) {
        log.warn("Redis CB open — getAllMovies fallback to DB. reason={}", ex.getMessage());
        metricsService.recordCacheMiss(CacheNames.MOVIES);
        Timer.Sample sample = metricsService.startDbQueryTimer();
        boolean success = false;
        try {
            PageResponse<MovieResponse> result = PageResponse.from(
                    movieRepository.findAll(pageable).map(movieMapper::toResponse));
            success = true;
            return result;
        } finally {
            metricsService.recordDbQueryDuration(sample, "findAll_fallback", success);
        }
    }

    @CircuitBreaker(name = "redis-cache", fallbackMethod = "getByIdFallback")
    @Cacheable(value = CacheNames.MOVIE, key = "#id")
    public MovieResponse getById(Long id) {
        log.debug("Cache MISS — fetching movie {} from DB", id);
        metricsService.recordCacheMiss(CacheNames.MOVIE);
        Timer.Sample sample = metricsService.startDbQueryTimer();
        boolean success = false;
        try {
            MovieResponse result = movieRepository.findById(id)
                    .map(movieMapper::toResponse)
                    .orElseThrow(() -> new ResourceNotFoundException("Movie", id));
            success = true;
            return result;
        } finally {
            metricsService.recordDbQueryDuration(sample, "findById", success);
        }
    }

    public MovieResponse getByIdFallback(Long id, Throwable ex) {
        log.warn("Redis CB open — getById fallback to DB. movieId={}", id);
        metricsService.recordCacheMiss(CacheNames.MOVIE);
        Timer.Sample sample = metricsService.startDbQueryTimer();
        boolean success = false;
        try {
            MovieResponse result = movieRepository.findById(id)
                    .map(movieMapper::toResponse)
                    .orElseThrow(() -> new ResourceNotFoundException("Movie", id));
            success = true;
            return result;
        } finally {
            metricsService.recordDbQueryDuration(sample, "findById_fallback", success);
        }
    }

    @CircuitBreaker(name = "redis-cache", fallbackMethod = "getTopRatedFallback")
    @Cacheable(value = CacheNames.TOP_RATED,
            key = "#minRating + '-' + #pageable.pageNumber")
    public PageResponse<MovieResponse> getTopRated(Double minRating, Pageable pageable) {
        log.debug("Cache MISS — fetching top rated from DB");
        metricsService.recordCacheMiss(CacheNames.TOP_RATED);
        Timer.Sample sample = metricsService.startDbQueryTimer();
        boolean success = false;
        try {
            PageResponse<MovieResponse> result = PageResponse.from(
                    movieRepository.findTopRated(minRating, pageable).map(movieMapper::toResponse));
            success = true;
            return result;
        } finally {
            metricsService.recordDbQueryDuration(sample, "findTopRated", success);
        }
    }

    public PageResponse<MovieResponse> getTopRatedFallback(
            Double minRating, Pageable pageable, Throwable ex) {
        log.warn("Redis CB open — topRated fallback to DB.");
        metricsService.recordCacheMiss(CacheNames.TOP_RATED);
        Timer.Sample sample = metricsService.startDbQueryTimer();
        boolean success = false;
        try {
            PageResponse<MovieResponse> result = PageResponse.from(
                    movieRepository.findTopRated(minRating, pageable).map(movieMapper::toResponse));
            success = true;
            return result;
        } finally {
            metricsService.recordDbQueryDuration(sample, "findTopRated_fallback", success);
        }
    }

    @CircuitBreaker(name = "redis-cache", fallbackMethod = "getByGenreFallback")
    @Cacheable(value = CacheNames.MOVIES,
            key = "#genre + '-' + #pageable.pageNumber")
    public PageResponse<MovieResponse> getByGenre(String genre, Pageable pageable) {
        log.debug("Cache MISS — fetching genre {} from DB", genre);
        metricsService.recordCacheMiss(CacheNames.MOVIES);
        Timer.Sample sample = metricsService.startDbQueryTimer();
        boolean success = false;
        try {
            PageResponse<MovieResponse> result = PageResponse.from(
                    movieRepository.findByGenreIgnoreCase(genre, pageable).map(movieMapper::toResponse));
            success = true;
            return result;
        } finally {
            metricsService.recordDbQueryDuration(sample, "findByGenre", success);
        }
    }

    public PageResponse<MovieResponse> getByGenreFallback(
            String genre, Pageable pageable, Throwable ex) {
        log.warn("Redis CB open — getByGenre fallback to DB.");
        metricsService.recordCacheMiss(CacheNames.MOVIES);
        Timer.Sample sample = metricsService.startDbQueryTimer();
        boolean success = false;
        try {
            PageResponse<MovieResponse> result = PageResponse.from(
                    movieRepository.findByGenreIgnoreCase(genre, pageable).map(movieMapper::toResponse));
            success = true;
            return result;
        } finally {
            metricsService.recordDbQueryDuration(sample, "findByGenre_fallback", success);
        }
    }

    public MovieStatsResponse getStats(Long movieId) {
        Object count = redisTemplate.opsForValue().get("movie:views:" + movieId);
        long viewCount = 0L;
        if (count != null) {
            viewCount = Long.parseLong(count.toString());
        } else {
            viewCount = movieRepository.findById(movieId)
                    .map(Movie::getViewCount)
                    .orElseThrow(() -> new ResourceNotFoundException("Movie", movieId));
        }
        return MovieStatsResponse.builder()
                .movieId(movieId)
                .viewCount(viewCount)
                .build();
    }

    @Transactional
    @Retry(name = "db-retry")
    @Caching(evict = {
            @CacheEvict(value = CacheNames.MOVIES,    allEntries = true),
            @CacheEvict(value = CacheNames.TOP_RATED, allEntries = true)
    })
    public MovieResponse create(MovieRequest request) {
        if (movieRepository.existsByTitleIgnoreCase(request.getTitle())) {
            throw new IllegalArgumentException("Movie already exists: " + request.getTitle());
        }
        Movie saved = movieRepository.save(movieMapper.toEntity(request));
        log.info("Created movie id={}", saved.getId());
        return movieMapper.toResponse(saved);
    }

    @Transactional
    @Retry(name = "db-retry")
    @Caching(evict = {
            @CacheEvict(value = CacheNames.MOVIE,     key = "#id"),
            @CacheEvict(value = CacheNames.MOVIES,    allEntries = true),
            @CacheEvict(value = CacheNames.TOP_RATED, allEntries = true)
    })
    public MovieResponse update(Long id, MovieRequest request) {
        Movie movie = movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Movie", id));
        movie.setTitle(request.getTitle());
        movie.setGenre(request.getGenre());
        movie.setRating(request.getRating());
        movie.setReleaseYear(request.getReleaseYear());
        log.info("Updated movie id={}", id);
        return movieMapper.toResponse(movie);
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = CacheNames.MOVIE,     key = "#id"),
            @CacheEvict(value = CacheNames.MOVIES,    allEntries = true),
            @CacheEvict(value = CacheNames.TOP_RATED, allEntries = true)
    })
    public void delete(Long id) {
        if (!movieRepository.existsById(id)) {
            throw new ResourceNotFoundException("Movie", id);
        }
        movieRepository.deleteById(id);
        log.info("Deleted movie id={}", id);
    }
}
```

### `movie/MovieController.java`
```java
package com.streambox.movie;

import com.streambox.common.PageResponse;
import com.streambox.movie.dto.MovieRequest;
import com.streambox.movie.dto.MovieResponse;
import com.streambox.movie.dto.MovieStatsResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/movies")
@RequiredArgsConstructor
public class MovieController {

    private final MovieService movieService;

    @GetMapping
    public PageResponse<MovieResponse> getAll(
            @PageableDefault(size = 20, sort = "title") Pageable pageable) {
        return movieService.getAllMovies(pageable);
    }

    @GetMapping("/{id}")
    public MovieResponse getById(@PathVariable Long id) {
        return movieService.getById(id);
    }

    @GetMapping("/{id}/stats")
    public MovieStatsResponse getStats(@PathVariable Long id) {
        return movieService.getStats(id);
    }

    @GetMapping("/genre/{genre}")
    public PageResponse<MovieResponse> getByGenre(
            @PathVariable String genre,
            @PageableDefault(size = 20) Pageable pageable) {
        return movieService.getByGenre(genre, pageable);
    }

    @GetMapping("/top-rated")
    public PageResponse<MovieResponse> getTopRated(
            @RequestParam(defaultValue = "7.0") Double minRating,
            @PageableDefault(size = 20) Pageable pageable) {
        return movieService.getTopRated(minRating, pageable);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MovieResponse create(@Valid @RequestBody MovieRequest request) {
        return movieService.create(request);
    }

    @PutMapping("/{id}")
    public MovieResponse update(@PathVariable Long id,
                                @Valid @RequestBody MovieRequest request) {
        return movieService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        movieService.delete(id);
    }
}
```

---

### `monitoring/MetricsService.java`
```java
package com.streambox.monitoring;

import io.micrometer.core.instrument.*;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.atomic.AtomicLong;

@Service
@RequiredArgsConstructor
@Slf4j
public class MetricsService {

    private final MeterRegistry                 meterRegistry;
    private final RedisTemplate<String, Object> redisTemplate;

    private final AtomicLong activeStreams = new AtomicLong(0);

    @PostConstruct
    public void initMetrics() {
        Gauge.builder("streambox.streams.active", activeStreams, AtomicLong::get)
                .description("Currently active streaming sessions")
                .register(meterRegistry);

        Gauge.builder("streambox.redis.keys.total", this, MetricsService::getRedisKeyCount)
                .description("Total keys in Redis")
                .register(meterRegistry);
    }

    // ── Watch events ──────────────────────────────────────────────────
    public void recordMovieWatched() {
        Counter.builder("streambox.movie.watched.total")
                .description("Total watch progress events received")
                .register(meterRegistry)
                .increment();
    }

    // ── Kafka ─────────────────────────────────────────────────────────
    public void recordKafkaPublishSuccess(String topic) {
        Counter.builder("streambox.kafka.publish.total")
                .tag("topic", topic).tag("result", "success")
                .register(meterRegistry).increment();
    }

    public void recordKafkaPublishFailure(String topic) {
        Counter.builder("streambox.kafka.publish.total")
                .tag("topic", topic).tag("result", "failure")
                .register(meterRegistry).increment();
    }

    public Timer.Sample startKafkaPublishTimer() {
        return Timer.start(meterRegistry);
    }

    public void recordKafkaPublishDuration(Timer.Sample sample,
                                            String topic,
                                            boolean success) {
        sample.stop(Timer.builder("streambox.kafka.publish.duration")
                .description("Time taken to publish a Kafka message")
                .tag("topic", topic)
                .tag("success", String.valueOf(success))
                .publishPercentiles(0.5, 0.95, 0.99)
                .register(meterRegistry));
    }

    // ── Database ──────────────────────────────────────────────────────
    public Timer.Sample startDbQueryTimer() {
        return Timer.start(meterRegistry);
    }

    public void recordDbQueryDuration(Timer.Sample sample,
                                       String operation,
                                       boolean success) {
        sample.stop(Timer.builder("streambox.db.query.duration")
                .description("Time taken to execute a database query")
                .tag("operation", operation)
                .tag("success", String.valueOf(success))
                .publishPercentiles(0.5, 0.95, 0.99)
                .register(meterRegistry));
    }

    // ── Cache ─────────────────────────────────────────────────────────
    public void recordCacheHit(String cacheName) {
        Counter.builder("streambox.cache.operations.total")
                .tag("cache", cacheName).tag("result", "hit")
                .register(meterRegistry).increment();
    }

    public void recordCacheMiss(String cacheName) {
        Counter.builder("streambox.cache.operations.total")
                .tag("cache", cacheName).tag("result", "miss")
                .register(meterRegistry).increment();
    }

    // ── Rate limiting ─────────────────────────────────────────────────
    public void recordRateLimitRejection(String endpointType) {
        Counter.builder("streambox.ratelimit.rejected.total")
                .description("Requests rejected by rate limiter")
                .tag("endpoint_type", endpointType)
                .register(meterRegistry).increment();
    }

    // ── Streams ───────────────────────────────────────────────────────
    public void incrementActiveStreams() { activeStreams.incrementAndGet(); }
    public void decrementActiveStreams() { activeStreams.decrementAndGet(); }

    // ── Internal ──────────────────────────────────────────────────────
    private long getRedisKeyCount() {
        try {
            Long size = redisTemplate.getConnectionFactory()
                    .getConnection().serverCommands().dbSize();
            return size != null ? size : 0L;
        } catch (Exception e) {
            return -1L;
        }
    }
}
```

---

## Completed Phases

```
✅ Phase 1 — Movie CRUD (Entity, Repository, Service, Controller, DTOs, Mapper)
✅ Phase 2 — PostgreSQL + Flyway migrations
✅ Phase 3 — JWT Auth (register, login, refresh, logout, UserDetailsService)
✅ Phase 4 — Redis Caching (with circuit breaker fallback to DB)
✅ Phase 5 — Kafka Event Streaming (MovieWatched, UserRegistered, WatchHistory, Analytics)
✅ Phase 6 — Rate Limiting (Bucket4j token bucket, per-endpoint limits)
✅ Phase 7 — Circuit Breakers + Retry + Bulkhead (Resilience4j)
✅ Phase 8 — Actuator + Monitoring (Micrometer, Prometheus, custom metrics)
```

---

## Next Phases

```
→ Phase 9:  MinIO + File Upload
            S3-compatible object storage in Docker
            Upload videos, thumbnails, subtitles
            Presigned URLs for secure access

→ Phase 10: Video Streaming (HTTP Range Requests)
            Serve partial content — how video players actually work
            Range: bytes=0-1048576 header handling
            Stream 4GB files without loading into memory

→ Phase 11: HLS (HTTP Live Streaming)
            Chunk video into 6-second .ts segments
            Generate .m3u8 playlist
            Adaptive bitrate — FFmpeg integration via Kafka pipeline

→ Phase 12: Search
            PostgreSQL full-text search
            tsvector + tsquery
            Search "dark thriller 2019"

→ Phase 13: Testing
            Unit tests, integration tests
            TestContainers (real DB/Redis/Kafka in tests)
            Contract tests
```

---

## Key Rules Established (Don't Break These)

```
1. Never use @Data on JPA entities — use @Getter @Setter explicitly
2. Never expose entities directly — always use DTOs
3. Response DTOs need @JsonIgnoreProperties(ignoreUnknown = true) if cached in Redis
4. Cached DTOs need @NoArgsConstructor @AllArgsConstructor for Jackson deserialization
5. Cache evict on every write — split static cache (movies) from dynamic data (viewCount → Redis)
6. Prometheus tags must have bounded cardinality — never movie_id, user_id, request_id as tags
7. Fallback methods must have exact same params as original + Throwable at the end
8. @CircuitBreaker only works on public methods (Spring AOP limitation)
9. Rate limit filter runs BEFORE JWT filter in the chain
10. DisconnectedBehavior.REJECT_COMMANDS on Lettuce — fail fast, don't queue
11. Flyway owns the schema — ddl-auto=validate always
12. Per-movie stats (viewCount) → Redis INCR + DB sync job, NOT Prometheus metrics
```

---

## Guides Generated (in outputs folder)

```
kafka-production-guide.md
rate-limiting-resilience-redis-guide.md
monitoring-actuator-prometheus-grafana-guide.md
```