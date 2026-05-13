# The Complete Production Guide
## Rate Limiting · Circuit Breakers · Redis Resilience
### For Spring Boot Backend Engineers

---

## Table of Contents

1. [Rate Limiting — The Full Picture](#1-rate-limiting)
   - 1.1 Why Rate Limiting Exists
   - 1.2 The Five Algorithms
   - 1.3 Algorithm Comparison & When to Use Each
   - 1.4 Bucket4j Deep Dive
   - 1.5 Properties & Configuration Reference
   - 1.6 Redis-Based Rate Limiting
   - 1.7 Rate Limit Response Standards
   - 1.8 Common Patterns
   - 1.9 Common Mistakes & Gotchas
   - 1.10 Production Checklist

2. [Circuit Breakers — Resilience4j](#2-circuit-breakers)
   - 2.1 The Mental Model
   - 2.2 Circuit Breaker States
   - 2.3 Every Property Explained
   - 2.4 Sliding Window Types
   - 2.5 Retry Pattern
   - 2.6 Bulkhead Pattern
   - 2.7 Rate Limiter (Resilience4j)
   - 2.8 TimeLimiter
   - 2.9 Combining Patterns
   - 2.10 Fallback Design Patterns
   - 2.11 Events & Monitoring
   - 2.12 Common Mistakes & Gotchas
   - 2.13 Properties Reference

3. [Redis — Production Mastery](#3-redis)
   - 3.1 Data Structures & When to Use Each
   - 3.2 Key Naming Conventions
   - 3.3 TTL Strategies
   - 3.4 Connection Configuration
   - 3.5 Lettuce vs Jedis
   - 3.6 Timeout Hierarchy
   - 3.7 Disconnected Behavior
   - 3.8 Common Issues & How to Fix
   - 3.9 Memory Management
   - 3.10 Persistence Modes

4. [Integration Patterns](#4-integration-patterns)
5. [Decision Framework](#5-decision-framework)

---

# 1. Rate Limiting

## 1.1 Why Rate Limiting Exists

Rate limiting protects your system from:

```
Without rate limiting:
  One bad actor   → 100,000 req/sec → DB connection pool exhausted
                                     → All users affected
                                     → Service down

With rate limiting:
  One bad actor   → 100,000 req → blocked after limit
                                 → 429 returned
                                 → Other users unaffected
```

Three goals rate limiting serves:

**Availability** — one user can't starve resources from others.
**Cost control** — on pay-per-use infra, unlimited requests = unlimited bills.
**Security** — brute force, credential stuffing, scraping all require high request volume.

---

## 1.2 The Five Algorithms

### Algorithm 1: Fixed Window Counter

```
Window: 1 minute (reset at :00, :01, :02...)

:00 ─────────────────────────── :01
     req1 req2 req3 ... req60        ← allowed (within limit)
     req61 req62 ...                 ← blocked (429)

:01 ─────────────────────────── :02
     req1 req2 ...                   ← allowed again (window reset)
```

**Implementation:**
```java
// Redis implementation
String key = "ratelimit:" + userId + ":" + getCurrentMinute();
Long count = redis.incr(key);
if (count == 1) redis.expire(key, 60);
return count <= limit;
```

**Problem — Window Boundary Attack:**
```
Limit: 60/minute

:59 → user sends 60 requests  ← allowed (first window)
:01 → user sends 60 requests  ← allowed (second window)
→ 120 requests in 2 seconds. Your limit was useless.
```

**Use when:** Simple use cases, internal services, non-critical endpoints.

---

### Algorithm 2: Sliding Window Log

Stores timestamp of every request. Counts requests in the last N seconds.

```
Current time: 12:00:45
Window: 60 seconds → look back to 12:00:45 - 60s = 11:59:45

Timestamps in Redis sorted set:
  11:59:46 ← inside window, count it
  11:59:52 ← inside window, count it
  12:00:01 ← inside window, count it
  12:00:44 ← inside window, count it
  
  11:59:44 ← OUTSIDE window, remove it

Total in window: 4. Under limit? Allow.
```

**Implementation:**
```java
String key = "ratelimit:log:" + userId;
long now = System.currentTimeMillis();
long windowStart = now - windowMs;

redis.zremrangeByScore(key, 0, windowStart);  // remove old entries
long count = redis.zcard(key);                 // count current window

if (count < limit) {
    redis.zadd(key, now, UUID.randomUUID().toString());
    redis.expire(key, windowSeconds + 1);
    return true;
}
return false;
```

**Problem:** Memory intensive. Every request stored. 1000 req/sec × 60s = 60,000 entries per user.

**Use when:** You need perfect accuracy and memory isn't constrained.

---

### Algorithm 3: Sliding Window Counter

Hybrid of fixed window + log. Approximates sliding window using two fixed windows.

```
Current time: 12:00:45 (75% into the current minute)

Previous window (12:59:00–12:00:00): 40 requests
Current window  (12:00:00–12:01:00): 15 requests so far

Weighted count = (40 × 0.25) + (15 × 1.0)
               = 10 + 15
               = 25 ← use this as the count

Limit is 50 → allow
```

**Best balance of accuracy vs memory.** Used by Cloudflare, Nginx.

---

### Algorithm 4: Leaky Bucket

Requests enter a queue (the "bucket"). Processed at fixed rate. Queue overflow = rejected.

```
Requests → [BUCKET: max 100] → Process 10/sec → Response

Burst of 200 requests:
  100 enter bucket
  100 overflow → rejected immediately
  Bucket drains at 10/sec → smooth output
```

**Good for:** Protecting downstream services that can't handle bursts.
**Bad for:** APIs where users expect immediate response. Rejected = lost, not delayed.

---

### Algorithm 5: Token Bucket (Bucket4j uses this)

Bucket starts full. Each request costs 1 token. Tokens refill at a fixed rate.

```
Bucket capacity: 60 tokens
Refill rate: 1 token/second

Second 0: 60 tokens available
  User sends 30 requests → 30 tokens consumed, 30 remaining

Second 5: 5 tokens added → 35 remaining

User sends burst of 40 requests:
  35 allowed (uses remaining 35 tokens)
  5 rejected → 429
```

**Key property: burst is allowed up to capacity.**
This is critical — real users DO burst. Opening an app, loading a feed,
refreshing a page all cause legitimate bursts. Token bucket handles this gracefully.

**Refill strategies:**
```
Greedy refill:    Adds tokens as fast as possible up to capacity
Intervally:       Adds all tokens at once every N seconds
SmoothIntervally: Adds fractions of tokens continuously (most accurate)
```

---

## 1.3 Algorithm Comparison

| Algorithm | Memory | Accuracy | Burst Support | Complexity | Best For |
|---|---|---|---|---|---|
| Fixed Window | O(1) | Low | No | Simple | Internal APIs |
| Sliding Log | O(requests) | Perfect | No | Medium | Audit-critical |
| Sliding Counter | O(1) | ~99% | No | Medium | Public APIs |
| Leaky Bucket | O(capacity) | Perfect | No | Medium | Downstream protection |
| Token Bucket | O(1) | High | Yes | Medium | User-facing APIs |

**For a streaming platform like Netflix: Token Bucket.**
Users burst when they start watching, search, or load their feed.
Fixed window would rate-limit legitimate usage.

---

## 1.4 Bucket4j Deep Dive

### Core Concepts

```
Bucket = container of tokens
Bandwidth = the rule that governs how tokens are generated
BucketConfiguration = set of bandwidths applied to a bucket
ProxyManager = factory that creates/retrieves distributed buckets
```

### Bandwidth Builder — Every Option

```java
Bandwidth.builder()
    .capacity(100)                           // max tokens (burst ceiling)
    .refillGreedy(100, Duration.ofMinutes(1)) // add 100 every minute, greedily
    // OR
    .refillIntervally(100, Duration.ofMinutes(1)) // add 100 at once every minute
    // OR
    .refillIntervallyAligned(                // sync refill to clock time
        100,
        Duration.ofMinutes(1),
        Instant.now().truncatedTo(ChronoUnit.MINUTES)
    )
    .initialTokens(50)                       // start with 50, not full capacity
    .id("main-limit")                        // name for multiple bandwidths
    .build();
```

### Multiple Bandwidths (Tiered Limits)

```java
// 100/minute AND 1000/hour — both must pass
BucketConfiguration config = BucketConfiguration.builder()
    .addLimit(Bandwidth.builder()
        .capacity(100)
        .refillIntervally(100, Duration.ofMinutes(1))
        .id("per-minute")
        .build())
    .addLimit(Bandwidth.builder()
        .capacity(1000)
        .refillIntervally(1000, Duration.ofHours(1))
        .id("per-hour")
        .build())
    .build();
```

**This is how Stripe, GitHub, Twitter do tiered rate limits.**

### ConsumptionProbe — Understanding the Response

```java
ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);

probe.isConsumed()              // true if allowed
probe.getRemainingTokens()      // tokens left after this request
probe.getNanosToWaitForRefill() // nanoseconds until next token available
                                // use this for Retry-After header
probe.getNanosToWaitForRefill() / 1_000_000_000  // convert to seconds
```

### Distributed Bucket with Redis/Lettuce

```java
@Configuration
public class RateLimitConfig {

    // Reuse Spring's already-managed connection — no new connections
    @Bean
    public StatefulRedisConnection<String, byte[]> rateLimitConnection(
            LettuceConnectionFactory factory) {
        return factory.getNativeClient()
                .connect(RedisCodec.of(StringCodec.UTF8, ByteArrayCodec.INSTANCE));
    }

    @Bean
    public ProxyManager<String> bucketProxyManager(
            StatefulRedisConnection<String, byte[]> conn) {
        return LettuceBasedProxyManager.builderFor(conn).build();
    }
}
```

```java
@Service
public class RateLimitService {

    private final ProxyManager<String> proxyManager;

    private static final Supplier<BucketConfiguration> API_CONFIG = () ->
        BucketConfiguration.builder()
            .addLimit(Bandwidth.builder()
                .capacity(60)
                .refillIntervally(60, Duration.ofMinutes(1))
                .build())
            .build();

    public ConsumptionProbe tryConsume(String userId) {
        // Gets existing bucket or creates new one atomically in Redis
        return proxyManager
            .builder()
            .build("rl:api:" + userId, API_CONFIG)
            .tryConsumeAndReturnRemaining(1);
    }
}
```

**What happens in Redis:**
```
Key: rl:api:user@example.com
Value: binary-encoded bucket state (tokens, last refill time)
TTL: auto-managed by Bucket4j based on refill time

WATCH → GET → compute new state → SET (CAS — Compare and Swap)
Atomic. No race conditions. Multiple app instances share the same bucket.
```

---

## 1.5 Properties & Configuration Reference

### Bucket4j Properties (Spring Boot auto-config)

```properties
# Global defaults
bucket4j.enabled=true
bucket4j.filters[0].url=.*                       # regex to match URLs
bucket4j.filters[0].rate-limits[0].cache-name=buckets
bucket4j.filters[0].rate-limits[0].bandwidths[0].capacity=100
bucket4j.filters[0].rate-limits[0].bandwidths[0].time=1
bucket4j.filters[0].rate-limits[0].bandwidths[0].unit=minutes
bucket4j.filters[0].rate-limits[0].bandwidths[0].refill-speed=intervally
```

### Redis Rate Limiting Properties

```properties
# Connection
spring.data.redis.host=localhost
spring.data.redis.port=6379
spring.data.redis.password=                      # leave blank if none
spring.data.redis.database=0                     # DB index (0-15)
spring.data.redis.timeout=2s                     # command timeout
spring.data.redis.connect-timeout=2s             # initial connection timeout

# Lettuce pool (for high concurrency)
spring.data.redis.lettuce.pool.max-active=8      # max connections
spring.data.redis.lettuce.pool.max-idle=8        # max idle connections
spring.data.redis.lettuce.pool.min-idle=0        # min idle connections
spring.data.redis.lettuce.pool.max-wait=-1ms     # -1 = wait indefinitely

# SSL
spring.data.redis.ssl.enabled=false              # enable for production
```

---

## 1.6 Redis-Based Rate Limiting Patterns

### Pattern 1: Fixed Window (Simple Counter)

```java
private boolean isAllowed(String key, int limit, Duration window) {
    Long count = redisTemplate.opsForValue().increment(key);
    if (count == 1) redisTemplate.expire(key, window);
    return count <= limit;
}
```

**Redis commands:** `INCR` + `EXPIRE` — both O(1), atomically safe.

### Pattern 2: Sliding Window (Sorted Set)

```java
private boolean isAllowed(String key, int limit, long windowMs) {
    long now = System.currentTimeMillis();
    long windowStart = now - windowMs;

    // Pipeline for atomic execution
    redisTemplate.executePipelined((RedisCallback<Object>) connection -> {
        // Remove entries outside window
        connection.zSetCommands().zRemRangeByScore(
            key.getBytes(), 0, windowStart);
        // Add current request
        connection.zSetCommands().zAdd(
            key.getBytes(),
            now,
            UUID.randomUUID().toString().getBytes());
        // Count entries in window
        connection.zSetCommands().zCard(key.getBytes());
        // Set expiry
        connection.keyCommands().expire(
            key.getBytes(), windowMs / 1000 + 1);
        return null;
    });
    // Parse results...
}
```

### Pattern 3: Lua Script (True Atomicity)

For sliding window counter — the production way. Single round-trip, atomic.

```lua
-- sliding_window.lua
local key = KEYS[1]
local window = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

local clearBefore = now - window

redis.call('ZREMRANGEBYSCORE', key, 0, clearBefore)
local count = redis.call('ZCARD', key)

if count < limit then
    redis.call('ZADD', key, now, now)
    redis.call('EXPIRE', key, math.ceil(window / 1000))
    return 1  -- allowed
end

return 0  -- rejected
```

```java
private static final RedisScript<Long> SLIDING_WINDOW_SCRIPT =
    RedisScript.of(
        "<lua script above>",
        Long.class
    );

public boolean isAllowed(String key, int limit, long windowMs) {
    Long result = redisTemplate.execute(
        SLIDING_WINDOW_SCRIPT,
        Collections.singletonList(key),
        String.valueOf(windowMs),
        String.valueOf(limit),
        String.valueOf(System.currentTimeMillis())
    );
    return Long.valueOf(1).equals(result);
}
```

---

## 1.7 Rate Limit Response Standards (RFC 6585 + Industry)

### Required Headers

```
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 30                    ← seconds until limit resets (RFC 6585)
X-RateLimit-Limit: 60             ← your limit per window
X-RateLimit-Remaining: 0          ← tokens left this window
X-RateLimit-Reset: 1715000400     ← Unix timestamp when window resets
```

**Add these on every response, not just 429s:**

```java
// Add to every successful response too
response.addHeader("X-RateLimit-Limit", String.valueOf(limit));
response.addHeader("X-RateLimit-Remaining",
    String.valueOf(probe.getRemainingTokens()));
response.addHeader("X-RateLimit-Reset",
    String.valueOf(Instant.now()
        .plusNanos(probe.getNanosToWaitForRefill())
        .getEpochSecond()));

// Only on 429
response.addHeader("Retry-After",
    String.valueOf(probe.getNanosToWaitForRefill() / 1_000_000_000));
```

### Response Body

```json
{
  "status": 429,
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Limit: 60/minute. Retry after 30 seconds.",
  "retryAfter": 30,
  "limit": 60,
  "remaining": 0,
  "resetAt": "2026-05-13T14:30:00Z"
}
```

---

## 1.8 Common Rate Limiting Patterns

### Pattern: Tiered Limits by User Role

```java
public ConsumptionProbe tryConsume(User user, String endpoint) {
    int limit = switch (user.getRole()) {
        case FREE    -> 60;
        case PRO     -> 1000;
        case ADMIN   -> 10000;
        case SERVICE -> Integer.MAX_VALUE;  // internal services
    };

    Supplier<BucketConfiguration> config = () ->
        BucketConfiguration.builder()
            .addLimit(Bandwidth.builder()
                .capacity(limit)
                .refillIntervally(limit, Duration.ofMinutes(1))
                .build())
            .build();

    return proxyManager
        .builder()
        .build("rl:" + user.getRole() + ":" + user.getId(), config)
        .tryConsumeAndReturnRemaining(1);
}
```

### Pattern: Per-Endpoint Limits

```java
private static final Map<String, Supplier<BucketConfiguration>> ENDPOINT_CONFIGS = Map.of(
    "/api/v1/stream",    () -> buildConfig(200, Duration.ofMinutes(1)),
    "/api/v1/auth",      () -> buildConfig(5,   Duration.ofMinutes(15)),
    "/api/v1/search",    () -> buildConfig(30,  Duration.ofMinutes(1)),
    "/api/v1/movies",    () -> buildConfig(100, Duration.ofMinutes(1))
);

public ConsumptionProbe tryConsume(String userId, String endpoint) {
    Supplier<BucketConfiguration> config = ENDPOINT_CONFIGS
        .getOrDefault(endpoint, () -> buildConfig(60, Duration.ofMinutes(1)));

    String key = "rl:" + endpoint + ":" + userId;
    return proxyManager.builder().build(key, config)
            .tryConsumeAndReturnRemaining(1);
}
```

### Pattern: IP-Based for Unauthenticated

```java
// Authenticated users: rate limit by user ID
// Unauthenticated users: rate limit by IP
private String getIdentifier(HttpServletRequest request) {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();

    if (auth != null && auth.isAuthenticated()
            && !"anonymousUser".equals(auth.getPrincipal())) {
        return "user:" + auth.getName();
    }

    // Extract real IP behind load balancer/proxy
    String forwarded = request.getHeader("X-Forwarded-For");
    if (forwarded != null) {
        return "ip:" + forwarded.split(",")[0].trim();
    }
    return "ip:" + request.getRemoteAddr();
}
```

### Pattern: Cost-Based Rate Limiting

Not all requests cost the same. Search = 5 tokens. Simple GET = 1 token.

```java
private static final Map<String, Integer> ENDPOINT_COSTS = Map.of(
    "POST:/api/v1/search",   5,    // expensive — full-text search
    "POST:/api/v1/stream",   2,    // moderate — triggers Kafka event
    "GET:/api/v1/movies",    1,    // cheap — cache hit likely
    "POST:/api/v1/upload",   20    // very expensive — file processing
);

public boolean tryConsume(String userId, String method, String path) {
    int cost = ENDPOINT_COSTS
        .getOrDefault(method + ":" + path, 1);

    return bucket.tryConsume(cost);  // consume multiple tokens at once
}
```

### Pattern: Dynamic Limits from DB/Config

```java
@Service
public class DynamicRateLimitService {

    @Cacheable("rate-limit-configs")  // cache the config lookup
    public RateLimitConfig getConfig(Long userId) {
        return userRepository.findRateLimitConfig(userId)
            .orElse(RateLimitConfig.defaultConfig());
    }

    public ConsumptionProbe tryConsume(Long userId, String endpoint) {
        RateLimitConfig config = getConfig(userId);

        Supplier<BucketConfiguration> bucketConfig = () ->
            BucketConfiguration.builder()
                .addLimit(Bandwidth.builder()
                    .capacity(config.getLimit())
                    .refillIntervally(config.getLimit(),
                        Duration.ofSeconds(config.getWindowSeconds()))
                    .build())
                .build();

        return proxyManager.builder()
            .build("rl:" + userId + ":" + endpoint, bucketConfig)
            .tryConsumeAndReturnRemaining(1);
    }
}
```

---

## 1.9 Common Mistakes & Gotchas

### Mistake 1: In-Memory Rate Limiting with Multiple Instances

```
App Instance 1: user has 50/60 requests used
App Instance 2: user has 0/60 requests used (separate counter)

User hits instance 2 → gets 60 more requests
Real usage: 110 requests. Your limit was meaningless.
```

**Fix:** Always use Redis for distributed rate limiting.

### Mistake 2: Rate Limiting After Auth Check

```
Current order:  JWT Filter → Rate Limit Filter
Problem: JWT lookup happens on every request, even rate-limited ones.
         DB hit on every rejected request.

Correct order:  Rate Limit Filter → JWT Filter
Rate limit first. Save DB lookups for allowed requests.
```

### Mistake 3: Not Setting Key Expiry

```java
// WRONG — memory leak
redis.incr("rl:user:123");
// No expire! Key stays forever.

// CORRECT
Long count = redis.incr("rl:user:123");
if (count == 1) redis.expire("rl:user:123", 60);
```

### Mistake 4: Race Condition in INCR + EXPIRE

```
Thread A: INCR → count = 1
Thread B: INCR → count = 2
Thread B: EXPIRE (sets expiry)
Thread A: EXPIRE (resets expiry — window now wrong)
```

**Fix:** Use Lua script or SET with NX + EX for atomic operations.

### Mistake 5: Trusting X-Forwarded-For Blindly

```
Attacker sends: X-Forwarded-For: 1.2.3.4
Your code reads: getClientIp() → 1.2.3.4
Rate limit key:  rl:ip:1.2.3.4

Attacker rotates header → infinite fresh rate limit windows
```

**Fix:** Only trust X-Forwarded-For from known load balancers.
```java
private String getClientIp(HttpServletRequest request) {
    String trustedProxyIp = "10.0.0.1";  // your load balancer IP

    // Only trust the header if request came through your LB
    if (trustedProxyIp.equals(request.getRemoteAddr())) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null) {
            return forwarded.split(",")[0].trim();
        }
    }
    return request.getRemoteAddr();
}
```

### Mistake 6: Same Rate Limit for All Endpoints

```
Streaming progress:  called every 30 seconds → needs 200/min limit
Login:               should try max 5 times in 15 min → needs strict limit
Movie catalog:       lightweight read → 100/min fine

One limit for all = either too strict (breaks features) or too loose (no protection)
```

### Mistake 7: Fail Closed on Rate Limiter Down

```java
// WRONG — if Redis down, ALL users get 429
if (!rateLimitService.isAllowed(userId)) {
    throw new RateLimitException();  // also thrown when Redis times out
}

// CORRECT — if Redis down, fail open (let requests through)
try {
    if (!rateLimitService.isAllowed(userId)) {
        throw new RateLimitException();
    }
} catch (RedisException e) {
    log.error("Rate limiter down — failing open");
    // Let the request through
    // Alert your team
}
```

### Mistake 8: Forgot Retry-After Header

Without `Retry-After`, clients don't know when to retry. They retry immediately.
Immediate retry → more 429s → retry storm → worse than no rate limiting.

Always set `Retry-After`. Smart clients will back off. Dumb clients will retry.
You can't fix dumb clients but you can make them rate-limit themselves.

---

## 1.10 Production Checklist

```
[ ] Rate limiting is distributed (Redis, not in-memory)
[ ] Different limits per endpoint type
[ ] Different limits per user tier
[ ] Fail open when Redis is down
[ ] X-RateLimit-* headers on every response
[ ] Retry-After header on 429 responses
[ ] Rate limit filter runs BEFORE auth filter
[ ] IP-based for unauthenticated endpoints
[ ] User-ID-based for authenticated endpoints
[ ] Alerts when 429 rate exceeds threshold
[ ] Logs include identifier + endpoint on every rejection
[ ] Redis keys have TTL (never unbounded)
[ ] Tested with Redis down (fail-open confirmed)
[ ] Tested window boundary behavior
[ ] Load tested with concurrent users
```

---

# 2. Circuit Breakers

## 2.1 The Mental Model

A circuit breaker is an automatic switch that:
- Detects when a downstream service is failing
- Stops calling it (opens the circuit)
- Tests periodically if it recovered (half-open)
- Resumes calling if recovered (closes)

```
Electrical circuit breaker:
  Power surge → breaker trips → power stops → you fix the fault → reset breaker

Software circuit breaker:
  Redis fails → CB opens → fallback serves → Redis recovers → CB closes
```

**Why not just let it fail?**

```
Without CB:
  Redis down → every request waits for timeout (30s default)
              → thread pool exhausted
              → all users blocked
              → cascading failure to rest of system

With CB:
  Redis down → first 5 calls fail fast → CB opens
              → subsequent calls return fallback immediately (1ms)
              → thread pool free
              → other endpoints work fine
```

---

## 2.2 Circuit Breaker States

```
                  failure rate > threshold
         ┌─────────────────────────────────────────┐
         │                                         ▼
      CLOSED                                     OPEN
    (normal)                              (failing fast)
         ▲                                         │
         │                                wait-duration passes
         │                                         ▼
         │   all test calls succeed            HALF-OPEN
         └──────────────────────────────  (testing recovery)
                                              │
                                              │ test call fails
                                              ▼
                                            OPEN again
```

### CLOSED State (Normal)
- Calls pass through normally
- Failures tracked in sliding window
- When failure rate exceeds threshold → OPEN

### OPEN State (Failing Fast)
- All calls immediately rejected (CallNotPermittedException)
- Fallback method called instead
- Waits for `wait-duration-in-open-state`
- Then transitions to HALF_OPEN

### HALF_OPEN State (Testing)
- Allows `permitted-number-of-calls-in-half-open-state` calls through
- If enough succeed → CLOSED
- If any fail → OPEN again

### DISABLED State (Manual)
- All calls pass through. No state tracking.
- Use during maintenance.

### FORCED_OPEN State (Manual)
- All calls rejected. Regardless of success/failure.
- Use to manually isolate a dependency.

---

## 2.3 Every Property Explained

```properties
# ============================================================
# CIRCUIT BREAKER — COMPLETE PROPERTY REFERENCE
# ============================================================

resilience4j.circuitbreaker.instances.{name}.

# --- Sliding Window ---
sliding-window-type=COUNT_BASED
# COUNT_BASED: uses last N calls
# TIME_BASED:  uses calls in last N seconds

sliding-window-size=10
# COUNT_BASED: number of calls to track
# TIME_BASED:  seconds to track
# Minimum: 1. Recommended: 10-100

minimum-number-of-calls=5
# CB won't open until at least this many calls recorded
# Prevents tripping on first failure ever
# Should be <= sliding-window-size

# --- Failure Detection ---
failure-rate-threshold=50
# 0.0–100.0 (percent)
# Open when: (failures / total calls) >= threshold
# 50 = open when half of calls fail
# Stricter for critical services (30-40%)
# Looser for non-critical (60-70%)

slow-call-rate-threshold=80
# 0.0–100.0 (percent)
# Counts slow calls as failures for CB purposes
# 80 = open when 80% of calls are slow

slow-call-duration-threshold=2s
# Duration above which a call is considered "slow"
# Should match your SLA/expected response time
# Format: 2s, 500ms, 1m

# --- Recovery ---
wait-duration-in-open-state=30s
# How long CB stays OPEN before trying HALF_OPEN
# Too short: hammers recovering service
# Too long: users wait unnecessarily
# Recommended: 10s–60s depending on recovery time

automatic-transition-from-open-to-half-open-enabled=true
# true:  automatically transitions after wait-duration
# false: requires manual trigger
# Always set true in production

permitted-number-of-calls-in-half-open-state=3
# How many test calls in HALF_OPEN before deciding
# Too few: might close prematurely on a fluke success
# Too many: exposes partially-failed service to too many requests
# Recommended: 3-5

max-wait-duration-in-half-open-state=0
# 0 = wait forever in HALF_OPEN until permitted calls complete
# Set to limit time in HALF_OPEN: 5s, 10s

# --- Exception Handling ---
record-exceptions=
# List of exception classes to count as failures
# Default: all exceptions
# Example: org.springframework.dao.DataAccessException

ignore-exceptions=
# List of exception classes to NOT count as failures
# Useful for: business exceptions that aren't infra failures
# Example: com.streambox.exception.ResourceNotFoundException

record-failure-predicate=
# Custom predicate class for complex failure detection
# Must implement Predicate<Throwable>

ignore-exception-predicate=
# Custom predicate to ignore specific exceptions

# --- Metrics ---
register-health-indicator=true
# Exposes CB state in /actuator/health
# Always true in production

event-consumer-buffer-size=10
# Buffer for CB events (STATE_TRANSITION, SUCCESS, FAILURE, etc.)
# Increase if events are being dropped
```

### Complete Example — Three Different Services

```properties
# Redis cache — tolerate more failures (fallback available)
resilience4j.circuitbreaker.instances.redis-cache.sliding-window-type=COUNT_BASED
resilience4j.circuitbreaker.instances.redis-cache.sliding-window-size=10
resilience4j.circuitbreaker.instances.redis-cache.minimum-number-of-calls=5
resilience4j.circuitbreaker.instances.redis-cache.failure-rate-threshold=50
resilience4j.circuitbreaker.instances.redis-cache.slow-call-rate-threshold=80
resilience4j.circuitbreaker.instances.redis-cache.slow-call-duration-threshold=2s
resilience4j.circuitbreaker.instances.redis-cache.wait-duration-in-open-state=30s
resilience4j.circuitbreaker.instances.redis-cache.permitted-number-of-calls-in-half-open-state=3
resilience4j.circuitbreaker.instances.redis-cache.automatic-transition-from-open-to-half-open-enabled=true

# Payment service — very strict (no fallback possible)
resilience4j.circuitbreaker.instances.payment-service.sliding-window-size=20
resilience4j.circuitbreaker.instances.payment-service.minimum-number-of-calls=10
resilience4j.circuitbreaker.instances.payment-service.failure-rate-threshold=25
resilience4j.circuitbreaker.instances.payment-service.slow-call-duration-threshold=5s
resilience4j.circuitbreaker.instances.payment-service.wait-duration-in-open-state=60s
resilience4j.circuitbreaker.instances.payment-service.permitted-number-of-calls-in-half-open-state=5

# Recommendation service — loose (show popular content as fallback)
resilience4j.circuitbreaker.instances.recommendation-service.sliding-window-size=10
resilience4j.circuitbreaker.instances.recommendation-service.minimum-number-of-calls=5
resilience4j.circuitbreaker.instances.recommendation-service.failure-rate-threshold=70
resilience4j.circuitbreaker.instances.recommendation-service.wait-duration-in-open-state=15s
resilience4j.circuitbreaker.instances.recommendation-service.permitted-number-of-calls-in-half-open-state=3
```

---

## 2.4 Sliding Window Types

### COUNT_BASED
```
Window size: 10 calls
CB tracks the LAST 10 calls regardless of time

Timeline:
09:00:00 → call 1 (success)
09:00:30 → call 2 (success)
09:05:00 → call 3 (fail)
...
09:59:00 → call 10 (fail)

Window contains: all 10 calls regardless of when they happened
```

**Use when:** Call volume is consistent. You care about last N calls, not time period.

### TIME_BASED
```
Window size: 10 seconds
CB tracks ALL calls in the last 10 seconds

09:00:00.000 → 100 calls/sec → window has 1000 calls
vs
09:01:00.000 → 1 call/sec  → window has 10 calls

Same failure rate, very different sample sizes
```

**Use when:** Call volume is variable. Time-based sliding window is more accurate when traffic spikes.

---

## 2.5 Retry Pattern

```properties
# ============================================================
# RETRY — COMPLETE PROPERTY REFERENCE
# ============================================================

resilience4j.retry.instances.{name}.

max-attempts=3
# Total attempts including the first one
# 3 = 1 initial + 2 retries

wait-duration=500ms
# Fixed wait between retries
# Use exponential-backoff-multiplier for smarter backoff

exponential-backoff-multiplier=2
# Each retry waits: wait-duration * multiplier^attempt
# attempt 1: 500ms
# attempt 2: 1000ms
# attempt 3: 2000ms

exponential-max-wait-duration=10s
# Cap on exponential backoff
# Prevents wait from growing to infinity

enable-exponential-backoff=true
# Use exponential backoff instead of fixed wait

randomized-wait-factor=0.5
# Add randomness: actual wait = wait * (1 ± factor)
# Prevents thundering herd: all retries hitting at same time
# 0.5 = wait between 50% and 150% of calculated wait

retry-exceptions=
# Only retry these exceptions
# Example: org.springframework.dao.TransientDataAccessException

ignore-exceptions=
# Never retry these
# Example: com.streambox.exception.ResourceNotFoundException
#          → No point retrying — resource doesn't exist

result-predicate=
# Custom predicate to determine if response should trigger retry
# Example: retry on HTTP 503 but not 400
```

### Retry + Circuit Breaker Together

```java
// Retry wraps Circuit Breaker
// Retry: try up to 3 times
// Each try: Circuit Breaker checks if call is allowed
// If CB is open: retry immediately sees CallNotPermittedException
//               and retries against the fallback (faster)

@CircuitBreaker(name = "db", fallbackMethod = "dbFallback")
@Retry(name = "db-retry")
public Movie findMovie(Long id) {
    return movieRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Movie", id));
}
```

**Order matters:** Retry should be the outer decorator, CB the inner.

```
Request → Retry → CircuitBreaker → Actual Call
         ↑ if CB open or call fails, retry wraps and retries
```

### When NOT to Retry

```
✅ Retry: Connection timeout, transient network error
✅ Retry: Database deadlock, lock timeout
✅ Retry: HTTP 503 Service Unavailable
✅ Retry: HTTP 429 Too Many Requests (after Retry-After)

❌ Don't Retry: HTTP 400 Bad Request (your data is bad)
❌ Don't Retry: HTTP 401 Unauthorized (no point)
❌ Don't Retry: HTTP 404 Not Found (it doesn't exist)
❌ Don't Retry: Business logic exceptions
❌ Don't Retry: Payment/charge operations (duplicate charge risk)
```

---

## 2.6 Bulkhead Pattern

Limits concurrent calls. Like a ship's bulkhead — compartmentalize failures.

```
Without bulkhead:
  Streaming endpoint slow → threads pile up → all threads consumed
  → Auth endpoint starved → whole service down

With bulkhead:
  Streaming endpoint: max 50 concurrent → overflow rejected
  Auth endpoint:      max 20 concurrent → never starved
  DB operations:      max 100 concurrent → protected
```

### Semaphore Bulkhead (default)

```properties
resilience4j.bulkhead.instances.{name}.

max-concurrent-calls=50
# Max simultaneous calls allowed
# Excess calls: wait up to max-wait-duration, then rejected

max-wait-duration=100ms
# How long to wait for a permit before rejecting
# 0 = reject immediately if no permits available
# Balance between throughput and latency
```

### Thread Pool Bulkhead

```properties
resilience4j.thread-pool-bulkhead.instances.{name}.

max-thread-pool-size=10
# Max threads in the pool

core-thread-pool-size=5
# Core threads always alive even when idle

queue-capacity=100
# Request queue size when all threads busy
# Queue full → BulkheadFullException

keep-alive-duration=20ms
# How long idle threads above core size stay alive
```

**Semaphore vs Thread Pool:**
```
Semaphore: same thread, just limits concurrency. Simpler.
Thread Pool: executes on separate threads. Required for:
  - Blocking operations (JDBC, synchronous HTTP)
  - Isolating thread-local state
  - Timeout support per call
```

---

## 2.7 Rate Limiter (Resilience4j)

Different from Bucket4j rate limiting. This limits rate on the call side,
not protecting you from callers. Used when YOUR code calls an external service
that has its own rate limits.

```properties
resilience4j.ratelimiter.instances.{name}.

limit-for-period=10
# Max calls per refresh period

limit-refresh-period=1s
# How often the limit resets

timeout-duration=5s
# How long to wait for a permit before throwing RateLimiterException
# 0 = fail immediately if no permits
```

**Use case:**
```java
// You're calling a third-party API that allows 10 req/sec
// Without this: you get 429s from their API
// With this: you self-throttle before hitting their limit

@RateLimiter(name = "external-api")
public ApiResponse callExternalApi(String query) {
    return externalApiClient.search(query);
}
```

---

## 2.8 TimeLimiter

Adds timeout to async/reactive calls. Wraps `CompletableFuture` or reactive streams.

```properties
resilience4j.timelimiter.instances.{name}.

timeout-duration=3s
# Max time allowed for the call
# If exceeded: TimeoutException thrown

cancel-running-future=true
# Cancel the underlying CompletableFuture on timeout
# true: cleans up resources
# false: lets it run but ignores result
```

```java
@TimeLimiter(name = "external-service")
public CompletableFuture<RecommendationResponse> getRecommendations(Long userId) {
    return CompletableFuture.supplyAsync(() ->
        recommendationService.fetch(userId)
    );
}
```

**TimeLimiter requires async.** It doesn't work on synchronous methods.
For synchronous timeout, use `@CircuitBreaker` with `slow-call-duration-threshold`.

---

## 2.9 Combining Patterns — The Right Order

Resilience4j applies decorators from outermost to innermost:

```
Outermost
  @Bulkhead        ← first: limit concurrent calls
    @RateLimiter   ← second: limit rate of calls
      @CircuitBreaker ← third: fail fast if downstream broken
        @Retry        ← fourth: retry on transient failures
          @TimeLimiter ← fifth: timeout individual calls
            @Fallback  ← innermost: what to return on failure
```

```java
@Bulkhead(name = "streaming")
@CircuitBreaker(name = "kafka-producer", fallbackMethod = "publishFallback")
@Retry(name = "kafka-retry")
public void publishEvent(MovieWatchedEvent event) {
    kafkaTemplate.send(KafkaTopics.MOVIE_WATCHED, event.getUserId().toString(), event);
}

public void publishFallback(MovieWatchedEvent event, Throwable ex) {
    // Kafka is broken, store event for replay
    log.error("Kafka CB open — storing for replay: {}", event);
    fallbackStore.save(event);
}
```

---

## 2.10 Fallback Design Patterns

### Pattern 1: Serve Stale Data

```java
@CircuitBreaker(name = "product-service", fallbackMethod = "getProductFallback")
public Product getProduct(Long id) {
    return productServiceClient.getProduct(id);
}

public Product getProductFallback(Long id, Throwable ex) {
    // Try cache first
    Product cached = cacheManager.getCache("products").get(id, Product.class);
    if (cached != null) {
        log.warn("Serving stale product data from cache: id={}", id);
        return cached;
    }
    // Fall back to DB copy
    return productRepository.findById(id)
        .orElseThrow(() -> new ServiceUnavailableException("Product service down"));
}
```

### Pattern 2: Degrade Gracefully

```java
@CircuitBreaker(name = "recommendation-service", fallbackMethod = "getFallbackRecommendations")
public List<Movie> getRecommendations(Long userId) {
    return recommendationService.getPersonalized(userId);
}

public List<Movie> getFallbackRecommendations(Long userId, Throwable ex) {
    log.warn("Recommendation service down — serving popular content");
    // Not personalized, but still useful
    return movieRepository.findTopRated(7.0, PageRequest.of(0, 10)).getContent();
}
```

### Pattern 3: Queue for Later

```java
@CircuitBreaker(name = "email-service", fallbackMethod = "queueEmailFallback")
public void sendEmail(EmailRequest request) {
    emailService.send(request);
}

public void queueEmailFallback(EmailRequest request, Throwable ex) {
    log.warn("Email service down — queuing for retry");
    pendingEmailRepository.save(PendingEmail.from(request));
    // Scheduled job retries pending emails every 5 minutes
}
```

### Pattern 4: Return Empty / Default

```java
@CircuitBreaker(name = "analytics-service", fallbackMethod = "getEmptyAnalytics")
public AnalyticsData getAnalytics(Long userId) {
    return analyticsService.getForUser(userId);
}

public AnalyticsData getEmptyAnalytics(Long userId, Throwable ex) {
    // Analytics isn't critical — return empty rather than error
    return AnalyticsData.empty();
}
```

### What NOT to do in Fallbacks

```java
// WRONG — fallback that throws always defeats the purpose
public Movie getProductFallback(Long id, Throwable ex) {
    throw new ServiceUnavailableException("Service is down");
    // User gets 503. What did the CB buy you? Nothing.
}

// WRONG — fallback that calls the same failing service
public Movie getProductFallback(Long id, Throwable ex) {
    return productServiceClient.getProduct(id);  // will fail again
}

// WRONG — fallback that does expensive operations
public Movie getProductFallback(Long id, Throwable ex) {
    return computeExpensiveAlternative(id);  // adds latency on top of failure
}
```

---

## 2.11 Events & Monitoring

### Listening to Circuit Breaker Events

```java
@Component
@Slf4j
public class CircuitBreakerEventListener {

    @Autowired
    private CircuitBreakerRegistry registry;

    @EventListener(ApplicationReadyEvent.class)
    public void setupListeners() {
        registry.getAllCircuitBreakers().forEach(cb -> {
            cb.getEventPublisher()
                .onStateTransition(event -> {
                    log.warn("CB {} transitioned from {} to {}",
                        event.getCircuitBreakerName(),
                        event.getStateTransition().getFromState(),
                        event.getStateTransition().getToState());
                    // Alert your team here
                    alertService.notify("Circuit breaker opened: " + event.getCircuitBreakerName());
                })
                .onFailureRateExceeded(event ->
                    log.error("CB {} failure rate: {}%",
                        event.getCircuitBreakerName(),
                        event.getFailureRate()))
                .onSlowCallRateExceeded(event ->
                    log.warn("CB {} slow call rate: {}%",
                        event.getCircuitBreakerName(),
                        event.getSlowCallRate()));
        });
    }
}
```

### Actuator Endpoints

```
GET /actuator/health
→ Shows all CB states

GET /actuator/metrics/resilience4j.circuitbreaker.calls
→ Call counts by kind (successful, failed, rejected)

GET /actuator/metrics/resilience4j.circuitbreaker.state
→ Current state (0=CLOSED, 1=OPEN, 2=HALF_OPEN)

GET /actuator/metrics/resilience4j.circuitbreaker.failure.rate
→ Current failure rate percentage
```

### Prometheus Metrics (add micrometer dependency)

```xml
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

```
resilience4j_circuitbreaker_calls_total{kind="failed", name="redis-cache"}
resilience4j_circuitbreaker_calls_total{kind="successful", name="redis-cache"}
resilience4j_circuitbreaker_calls_total{kind="not_permitted", name="redis-cache"}
resilience4j_circuitbreaker_state{name="redis-cache"} 1.0  # 1 = OPEN
resilience4j_circuitbreaker_failure_rate{name="redis-cache"} 75.0
```

**Alert rules:**
```yaml
- alert: CircuitBreakerOpen
  expr: resilience4j_circuitbreaker_state == 1
  for: 30s
  annotations:
    summary: "Circuit breaker {{ $labels.name }} is OPEN"

- alert: HighFailureRate
  expr: resilience4j_circuitbreaker_failure_rate > 50
  for: 1m
  annotations:
    summary: "High failure rate on {{ $labels.name }}: {{ $value }}%"
```

---

## 2.12 Common Mistakes & Gotchas

### Mistake 1: @CircuitBreaker on private methods

```java
// WRONG — Spring AOP can't intercept private methods
@CircuitBreaker(name = "redis")
private MovieResponse fetchFromCache(Long id) { ... }

// CORRECT — must be public
@CircuitBreaker(name = "redis")
public MovieResponse fetchFromCache(Long id) { ... }
```

### Mistake 2: Calling decorated method from same class

```java
@Service
public class MovieService {

    @CircuitBreaker(name = "redis")
    public MovieResponse getById(Long id) { ... }

    public void doSomething(Long id) {
        getById(id);  // WRONG — calls the raw method, bypasses CB
        // Spring AOP proxy isn't in play for self-calls
    }
}
```

**Fix:** Inject self or extract to separate class.

```java
@Autowired
private MovieService self;  // injects the proxied version

public void doSomething(Long id) {
    self.getById(id);  // CORRECT — goes through proxy
}
```

### Mistake 3: Fallback method signature wrong

```java
@CircuitBreaker(name = "redis", fallbackMethod = "getFallback")
public MovieResponse getById(Long id) { ... }

// WRONG — missing Throwable parameter
public MovieResponse getFallback(Long id) { ... }

// CORRECT — must have same params + Throwable at the end
public MovieResponse getFallback(Long id, Throwable ex) { ... }
```

### Mistake 4: Wrong sliding window size

```
Window size: 100
Minimum calls: 5

After 5 calls, 4 failed → failure rate = 80% → CB opens
But 5 calls is statistically meaningless
You just opened the CB on a blip

Fix: minimum-number-of-calls should be a meaningful sample
     For low-traffic services: 5-10
     For high-traffic services: 20-50
```

### Mistake 5: Too short wait duration

```
wait-duration-in-open-state=5s

Dependency takes 60s to restart after crash
→ CB transitions to HALF_OPEN after 5s
→ Test calls fail (still restarting)
→ CB opens again
→ 5s later, HALF_OPEN again
→ Constant cycling, never recovers

Fix: wait-duration should match typical dependency recovery time
     Redis:         10-30s
     DB:            30-60s
     External API:  60-120s
```

### Mistake 6: Not recording the right exceptions

```java
// ResourceNotFoundException is thrown when user requests id=99999
// This is a BUSINESS exception, not an infrastructure failure
// Don't let it count toward CB failure rate

resilience4j.circuitbreaker.instances.db.ignore-exceptions=\
  com.streambox.exception.ResourceNotFoundException,\
  com.streambox.exception.DuplicateException
```

### Mistake 7: Missing spring-boot-starter-aop

```
@CircuitBreaker annotation does nothing
No errors thrown
Just silently doesn't work

Always add:
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-aop</artifactId>
</dependency>
```

---

## 2.13 Full Properties Reference (All Patterns)

```properties
# ============================================================
# RESILIENCE4J — COMPLETE REFERENCE
# ============================================================

# --- Circuit Breaker ---
resilience4j.circuitbreaker.instances.{name}.sliding-window-type=COUNT_BASED
resilience4j.circuitbreaker.instances.{name}.sliding-window-size=10
resilience4j.circuitbreaker.instances.{name}.minimum-number-of-calls=5
resilience4j.circuitbreaker.instances.{name}.failure-rate-threshold=50
resilience4j.circuitbreaker.instances.{name}.slow-call-rate-threshold=80
resilience4j.circuitbreaker.instances.{name}.slow-call-duration-threshold=2s
resilience4j.circuitbreaker.instances.{name}.wait-duration-in-open-state=30s
resilience4j.circuitbreaker.instances.{name}.automatic-transition-from-open-to-half-open-enabled=true
resilience4j.circuitbreaker.instances.{name}.permitted-number-of-calls-in-half-open-state=3
resilience4j.circuitbreaker.instances.{name}.max-wait-duration-in-half-open-state=0
resilience4j.circuitbreaker.instances.{name}.record-exceptions=
resilience4j.circuitbreaker.instances.{name}.ignore-exceptions=
resilience4j.circuitbreaker.instances.{name}.register-health-indicator=true
resilience4j.circuitbreaker.instances.{name}.event-consumer-buffer-size=10

# --- Retry ---
resilience4j.retry.instances.{name}.max-attempts=3
resilience4j.retry.instances.{name}.wait-duration=500ms
resilience4j.retry.instances.{name}.enable-exponential-backoff=false
resilience4j.retry.instances.{name}.exponential-backoff-multiplier=2
resilience4j.retry.instances.{name}.exponential-max-wait-duration=10s
resilience4j.retry.instances.{name}.randomized-wait-factor=0.5
resilience4j.retry.instances.{name}.retry-exceptions=
resilience4j.retry.instances.{name}.ignore-exceptions=

# --- Bulkhead (Semaphore) ---
resilience4j.bulkhead.instances.{name}.max-concurrent-calls=25
resilience4j.bulkhead.instances.{name}.max-wait-duration=0ms

# --- Bulkhead (Thread Pool) ---
resilience4j.thread-pool-bulkhead.instances.{name}.max-thread-pool-size=10
resilience4j.thread-pool-bulkhead.instances.{name}.core-thread-pool-size=5
resilience4j.thread-pool-bulkhead.instances.{name}.queue-capacity=100
resilience4j.thread-pool-bulkhead.instances.{name}.keep-alive-duration=20ms

# --- Rate Limiter ---
resilience4j.ratelimiter.instances.{name}.limit-for-period=10
resilience4j.ratelimiter.instances.{name}.limit-refresh-period=1s
resilience4j.ratelimiter.instances.{name}.timeout-duration=5s

# --- Time Limiter ---
resilience4j.timelimiter.instances.{name}.timeout-duration=3s
resilience4j.timelimiter.instances.{name}.cancel-running-future=true
```

---

# 3. Redis

## 3.1 Data Structures & When to Use Each

### String (most common)

```
Use for: Counters, cached values, session tokens, feature flags

SET key value EX 3600          # set with 60min TTL
GET key                         # get value
INCR key                        # atomic increment (rate limiting)
INCRBY key 5                    # increment by amount
SETNX key value                 # set only if not exists (locks)
GETDEL key                      # get and delete atomically
```

```java
// Counter
redisTemplate.opsForValue().increment("movie:views:1");

// Cache with TTL
redisTemplate.opsForValue().set("movie:1", movieJson, Duration.ofMinutes(10));

// Atomic set if not exists (distributed lock)
Boolean acquired = redisTemplate.opsForValue()
    .setIfAbsent("lock:job:cleanup", "locked", Duration.ofSeconds(30));
```

### Hash

```
Use for: Object fields, user sessions, config maps

HSET user:1 name "John" email "john@test.com" role "USER"
HGET user:1 email
HGETALL user:1
HDEL user:1 tempField
HINCRBYFLOAT user:1 balance 100.50
```

```java
// Store object fields separately (update single field without serialize/deserialize)
redisTemplate.opsForHash().put("user:1", "name", "John");
redisTemplate.opsForHash().put("user:1", "lastSeen", Instant.now().toString());

// Get all fields
Map<Object, Object> user = redisTemplate.opsForHash().entries("user:1");
```

**When Hash > String:**
If you frequently update single fields of an object,
Hash lets you update one field with HSET instead of GET → deserialize → modify → serialize → SET.

### List

```
Use for: Message queues, recent activity, notifications

LPUSH queue:emails email1 email2   # push to left (head)
RPOP queue:emails                   # pop from right (tail) = FIFO queue
LRANGE notifications:1 0 9          # get first 10 items
LLEN queue:emails                   # queue length
BRPOP queue:emails 30               # blocking pop (wait up to 30s)
```

```java
// Simple queue
redisTemplate.opsForList().leftPush("queue:emails", emailJson);
String next = (String) redisTemplate.opsForList().rightPop("queue:emails");

// Recent activity (cap at 100 items)
redisTemplate.opsForList().leftPush("activity:user:1", activityJson);
redisTemplate.opsForList().trim("activity:user:1", 0, 99);
```

### Set

```
Use for: Unique collections, tags, mutual friends, "seen" tracking

SADD tags:movie:1 "sci-fi" "action" "2010s"
SMEMBERS tags:movie:1
SISMEMBER tags:movie:1 "sci-fi"        # O(1) membership check
SINTERSTORE common friends:1 friends:2  # intersection
SUNION genres:1 genres:2                # union
SCARD tags:movie:1                      # count unique elements
```

```java
// Track unique viewers (sets automatically deduplicate)
redisTemplate.opsForSet().add("viewers:movie:1", userId);
Long uniqueViewers = redisTemplate.opsForSet().size("viewers:movie:1");
```

### Sorted Set (ZSet)

```
Use for: Leaderboards, sliding window rate limiting, priority queues,
         time-series data, range queries

ZADD leaderboard 1500 "user:1"       # add with score
ZRANGE leaderboard 0 9 REV WITHSCORES  # top 10 with scores
ZRANK leaderboard "user:1"             # rank (0-indexed)
ZRANGEBYSCORE timestamps 1000 2000     # elements in score range
ZREMRANGEBYSCORE timestamps 0 oldTime  # remove old entries (sliding window)
ZINCRBY leaderboard 100 "user:1"      # increment score
```

```java
// Leaderboard
redisTemplate.opsForZSet().add("leaderboard:global", userId, score);
Set<ZSetOperations.TypedTuple<Object>> top10 = 
    redisTemplate.opsForZSet()
        .reverseRangeWithScores("leaderboard:global", 0, 9);

// Sliding window rate limiting
long now = System.currentTimeMillis();
redisTemplate.opsForZSet().removeRangeByScore(key, 0, now - windowMs);
Long count = redisTemplate.opsForZSet().zCard(key);
redisTemplate.opsForZSet().add(key, UUID.randomUUID().toString(), now);
```

---

## 3.2 Key Naming Conventions

### Structure
```
{entity}:{id}:{attribute}

movie:1                          ← cached movie object
movie:1:views                   ← view counter
movie:views:1                   ← alternative (analytics namespace first)
user:42:watchlist               ← user's watchlist
user:42:session                 ← user session
```

### Namespacing by Feature
```
rate:api:user@example.com        ← rate limiting
rate:auth:192.168.1.1
lock:job:daily-cleanup           ← distributed locks
lock:resource:video-upload:1
cache:movies:page-0-size-20      ← cache entries
cache:movie:1
stream:progress:user:42:movie:1  ← streaming progress
queue:email:welcome              ← queues
queue:notification:push
```

### Rules

```
✅ Always lowercase
✅ Colon (:) as separator
✅ Descriptive namespaces
✅ Include relevant IDs
✅ Version if schema changes: cache:v2:movie:1

❌ No spaces in keys
❌ No special characters except : and -
❌ Don't use / or . (confusing with path/domain notation)
❌ Don't use generic names: "cache", "data", "temp"
❌ Don't make keys too long (>100 chars slows things down)
```

### Key Length vs Readability Trade-off

```
Long (readable):     user:profile:123456:preferences:theme
Short (efficient):   u:pref:123456:theme

For most apps: readability wins. Redis key memory is negligible
For hyper-scale: benchmark first, shorten if measurably necessary
```

---

## 3.3 TTL Strategies

### Never set TTL = Never expires

```
redis.set("movie:1", data)  // no TTL = lives forever

Problems:
- Memory grows unbounded
- Stale data never evicted
- Manual cleanup required
```

**Rule: Always set TTL unless you explicitly want persistent data.**

### TTL by Data Type

```
Static/reference data (rarely changes):
  Countries, currencies, genres → 24 hours
  
Application config:
  Feature flags, rate limit configs → 1 hour
  
Frequently updated data:
  Movie catalog → 10 minutes
  Trending content → 5 minutes
  
User-specific data:
  Watchlist → 2 minutes
  User profile → 30 minutes
  
Real-time data:
  Live view counts → no cache (read from Redis directly)
  Active sessions → JWT expiry time
  
Rate limiting:
  Fixed window counters → window duration
  Sliding window sorted sets → window duration + 1s
```

### Refreshing TTL on Access

```java
// TTL reset on every read — extends cache life for popular items
public MovieResponse getMovie(Long id) {
    String key = "cache:movie:" + id;
    MovieResponse cached = (MovieResponse) redisTemplate.opsForValue().get(key);
    
    if (cached != null) {
        redisTemplate.expire(key, Duration.ofMinutes(10));  // reset TTL
        return cached;
    }
    
    MovieResponse fresh = movieRepository.findById(id)
        .map(movieMapper::toResponse)
        .orElseThrow(() -> new ResourceNotFoundException("Movie", id));
    
    redisTemplate.opsForValue().set(key, fresh, Duration.ofMinutes(10));
    return fresh;
}
```

### TTL Jitter (Thundering Herd Prevention)

```java
// Without jitter: all keys expire at same time → DB hit storm
Duration ttl = Duration.ofMinutes(10);

// With jitter: randomize TTL ±20%
// Keys expire at different times → smooth DB load
private Duration withJitter(Duration base) {
    long jitter = (long)(base.toMillis() * 0.2 * (Math.random() * 2 - 1));
    return Duration.ofMillis(base.toMillis() + jitter);
}

redisTemplate.opsForValue().set(key, value, withJitter(Duration.ofMinutes(10)));
```

---

## 3.4 Connection Configuration

### Full Lettuce Configuration

```java
@Bean
public RedisConnectionFactory redisConnectionFactory() {
    RedisStandaloneConfiguration server =
        new RedisStandaloneConfiguration(host, port);
    server.setPassword(RedisPassword.of(password));  // if auth required
    server.setDatabase(0);

    LettuceClientConfiguration client = LettuceClientConfiguration.builder()
        .commandTimeout(Duration.ofSeconds(2))
        .shutdownTimeout(Duration.ofSeconds(2))
        .clientOptions(ClientOptions.builder()
            .socketOptions(SocketOptions.builder()
                .connectTimeout(Duration.ofSeconds(2))
                .keepAlive(SocketOptions.KeepAliveOptions.builder()
                    .enable(true)
                    .build())
                .build())
            .timeoutOptions(TimeoutOptions.enabled())
            .disconnectedBehavior(
                ClientOptions.DisconnectedBehavior.REJECT_COMMANDS)
            .autoReconnect(true)
            .build())
        .build();

    LettuceConnectionFactory factory =
        new LettuceConnectionFactory(server, client);
    factory.setShareNativeConnection(false);  // don't share for blocking ops
    return factory;
}
```

### Connection Pool (High Concurrency)

```java
LettucePoolingClientConfiguration poolConfig =
    LettucePoolingClientConfiguration.builder()
        .poolConfig(new GenericObjectPoolConfig<>() {{
            setMaxTotal(16);       // max connections
            setMaxIdle(8);         // max idle
            setMinIdle(2);         // min idle (always ready)
            setMaxWait(Duration.ofMillis(500));  // wait for connection
            setTestOnBorrow(true); // validate connection before use
        }})
        .commandTimeout(Duration.ofSeconds(2))
        .build();
```

---

## 3.5 Lettuce vs Jedis

| Feature | Lettuce | Jedis |
|---|---|---|
| Architecture | Async, non-blocking (Netty) | Synchronous, blocking |
| Thread Safety | Single connection shared | Connection per thread |
| Reactive Support | Yes (Reactor) | No |
| Connection Pool | Optional | Required |
| Spring Boot Default | ✅ Yes | No |
| Memory Usage | Lower | Higher (per-thread connections) |
| Cluster Support | Yes | Yes |
| Latency | Lower (pipelining) | Higher |

**Use Lettuce.** Spring Boot uses it by default. It's faster. No reason to switch to Jedis unless you have a specific legacy reason.

---

## 3.6 Timeout Hierarchy

Understanding which timeout does what:

```
1. TCP Connect Timeout (SocketOptions.connectTimeout)
   What: Time to establish TCP connection to Redis server
   When exceeded: ConnectException
   Typical: 2-5 seconds
   
2. Command Timeout (LettuceClientConfiguration.commandTimeout)
   What: Time to get response after sending command to Redis
   When exceeded: RedisCommandTimeoutException
   Typical: 1-3 seconds
   
3. Spring Data Timeout (spring.data.redis.timeout)
   What: Sets BOTH connect and command timeout as convenience property
   Note: Overridden by individual settings above
   
4. Application Timeout (Circuit Breaker slow-call-duration-threshold)
   What: Time above which a call is considered "slow" (not a hard timeout)
   Purpose: Counting slow calls for CB decisions
   Should match: Command timeout or slightly above

Rule: All timeouts should be equal or command < cb-slow-call-duration < circuit opens
```

---

## 3.7 Disconnected Behavior

```
ClientOptions.DisconnectedBehavior:

DEFAULT (REJECT_COMMANDS):
  Commands fail immediately when disconnected
  Redis exception thrown instantly
  Circuit breaker counts failure immediately
  ← Use this in production

ACCEPT_COMMANDS (legacy default):
  Commands queued in memory while disconnected
  Eventually processed when reconnected
  BUT: queue can grow unbounded → OOM
  BUT: commands execute out of order
  ← Never use in production

When to use ACCEPT_COMMANDS:
  Short disconnections during failover where you want buffering
  With proper queue size limits (AUTO_FLUSH_COMMANDS)
```

---

## 3.8 Common Issues & How to Fix

### Issue 1: Too Many Connections

```
Symptom: "max number of clients reached" error in Redis logs
Cause: Connection pool misconfigured, connections not returned

Check:
redis-cli INFO clients
→ connected_clients: 10000  ← problem

Fix:
1. Set pool size limit
2. Ensure connections returned after use (try-finally or auto-closeable)
3. Check for connection leaks with redis-cli CLIENT LIST
```

### Issue 2: Memory Full / OOM

```
Symptom: COMMAND error: OOM command not allowed when used memory > 'maxmemory'

Causes:
- No TTL on keys (unbounded growth)
- maxmemory not set
- Wrong eviction policy

Fix:
# In redis.conf or via CLI:
maxmemory 512mb
maxmemory-policy allkeys-lru

Eviction Policies:
  noeviction:       reject new writes when full (default, bad for caches)
  allkeys-lru:      evict any key LRU (best for caches)
  volatile-lru:     evict only keys with TTL using LRU
  allkeys-lfu:      evict any key LFU (keeps frequently used)
  volatile-lfu:     evict only keys with TTL using LFU
  allkeys-random:   evict any key randomly (don't use)
  volatile-ttl:     evict key closest to expiry

For caching: allkeys-lru or allkeys-lfu
For mixed (session + cache): volatile-lru
```

### Issue 3: Serialization Errors on Read

```
Symptom: Cannot deserialize class X — unknown field Y

Cause: Class changed but old serialized form in Redis

Fix:
1. FLUSHDB (nuclear option, clears everything)
2. @JsonIgnoreProperties(ignoreUnknown = true) on all cached DTOs
3. Versioned cache keys: cache:v2:movie:1 (increment on schema change)
4. Graceful fallback: try deserialize → if fail → fetch from DB
```

### Issue 4: Redis Blocking Operations Blocking All Requests

```
Symptom: All requests slow when one request does expensive Redis operation

Cause: KEYS * command, large SMEMBERS, expensive ZRANGE on huge set

KEYS * in production = 💀
Scans ALL keys in single-threaded Redis = blocks everything for seconds

Fix:
  Never use KEYS * in production
  Use SCAN with cursor instead:
  
  ScanOptions options = ScanOptions.scanOptions().match("cache:movie:*").count(100).build();
  Cursor<byte[]> cursor = connection.scan(options);
  while (cursor.hasNext()) {
      byte[] key = cursor.next();
      // process
  }
```

### Issue 5: Redis Reconnection Storm

```
Symptom: After Redis restart, massive spike in DB queries

Cause: Thousands of app instances all trying to reconnect simultaneously
       + all cache misses hit DB at same time (cache stampede)

Fix:
1. Lettuce handles reconnection with exponential backoff automatically
2. Cache stampede: use probabilistic early expiration
   → Don't wait for TTL to expire, probabilistically refresh early

// Probabilistic refresh (avoids stampede)
public MovieResponse getMovie(Long id) {
    String key = "cache:movie:" + id;
    CacheEntry entry = (CacheEntry) redisTemplate.opsForValue().get(key);
    
    if (entry != null) {
        // Probabilistic early refresh: if within 20% of expiry, sometimes refresh
        long ttl = redisTemplate.getExpire(key, TimeUnit.SECONDS);
        long totalTtl = 600; // 10 minutes
        
        if (ttl < totalTtl * 0.2 && Math.random() < 0.1) {
            // 10% chance of early refresh when within last 20% of TTL
            // This spreads refreshes over time instead of cliff-edge expiry
            refreshAsync(id);
        }
        return entry.getValue();
    }
    return fetchAndCache(id);
}
```

---

## 3.9 Memory Management

### Key Memory Usage

```
Estimate memory per key:
  String: overhead(~90 bytes) + key_length + value_length
  Hash:   overhead + all field/value lengths
  
Key naming impacts memory:
  "user:profile:123456:theme:dark" = 31 bytes key
  "u:p:123456:t:d"                = 15 bytes key
  
At 100M keys: 1.6GB saved from shorter keys
At 1M keys:   16MB — usually not worth sacrificing readability
```

### Monitoring Memory

```bash
redis-cli INFO memory

# Key metrics:
used_memory_human: 1.5G          # actual memory used
used_memory_peak_human: 2.1G     # peak since start
mem_fragmentation_ratio: 1.5     # > 1.5 = fragmentation problem
maxmemory_human: 4.0G            # configured max
maxmemory_policy: allkeys-lru    # eviction policy

# Key count
redis-cli DBSIZE

# Biggest keys
redis-cli --bigkeys

# Memory of specific key
redis-cli MEMORY USAGE movie:1
```

---

## 3.10 Persistence Modes

**For a rate limiting + caching use case:**

```
RDB (Snapshotting):
  Saves point-in-time snapshot every N minutes
  Fast restart, small files
  Risk: lose last N minutes of data on crash

AOF (Append Only File):
  Logs every write command
  Full durability (fsync every second = max 1 second data loss)
  Slower writes, larger files

No Persistence:
  Cache-only mode
  Fastest
  All data lost on restart → cold cache
  
For rate limiting + caching: NO PERSISTENCE
  Rate limit counters reset on restart (acceptable — fresh window)
  Cache is rebuilt from DB on misses (acceptable — just slower)
  
For session storage: AOF
  Losing sessions = users logged out = bad UX
  
In application.properties:
  (no special config needed — Redis defaults to RDB, which is fine for caching)
  
In redis.conf for true no-persistence:
  save ""              # disable RDB
  appendonly no        # disable AOF
```

---

# 4. Integration Patterns

## How Rate Limiting + CB + Redis Work Together

```
Request enters app
    ↓
RateLimitFilter
    ├── Redis available?
    │     YES → check bucket → tokens available? → continue
    │                        → no tokens → 429
    │     NO  → fail open → continue (log alert)
    ↓
JwtAuthFilter → validate token
    ↓
Controller
    ↓
Service method with @CircuitBreaker
    ├── CB CLOSED → try Redis cache
    │     Redis responds → return cached data
    │     Redis slow/fail → CB counts failure
    │                     → after 5 failures → CB OPENS
    │
    ├── CB OPEN → skip Redis entirely → fallback(DB)
    │     Fallback fetches from DB → return data
    │     After 30s → CB transitions to HALF_OPEN
    │
    └── CB HALF_OPEN → try Redis with 3 test calls
          Redis OK → CB CLOSES → back to normal
          Redis fail → CB OPENS again → wait 30s more
```

## StreamBox Full Resilience Stack

```java
// Streaming endpoint with full resilience:

@PostMapping("/{movieId}/progress")
@ResponseStatus(HttpStatus.NO_CONTENT)
@Bulkhead(name = "streaming")   // max 50 concurrent
public void updateProgress(...) {
    // RateLimitFilter already checked rate limit before this runs
    publishEvent(event);
}

@CircuitBreaker(name = "kafka-producer", fallbackMethod = "publishFallback")
@Retry(name = "kafka-retry")    // retry 3x with backoff
private void publishEvent(MovieWatchedEvent event) {
    kafkaTemplate.send(topic, key, event);
}

private void publishFallback(MovieWatchedEvent event, Throwable ex) {
    // Store for replay when Kafka recovers
    fallbackRepository.save(event);
}
```

---

# 5. Decision Framework

## Which Rate Limiting Algorithm?

```
User-facing API:                    Token Bucket (Bucket4j)
Public API with burst support:      Token Bucket
Internal service-to-service:        Fixed Window (simple counter)
Financial / billing operations:     Sliding Window Log (perfect accuracy)
General purpose:                    Sliding Window Counter
```

## Which Circuit Breaker Settings?

```
Has fallback data:
  failure-rate-threshold: 50
  wait-duration: 30s

No fallback (hard dependency):
  failure-rate-threshold: 25 (more sensitive)
  wait-duration: 60s (give more recovery time)

External slow API:
  slow-call-rate-threshold: 50
  slow-call-duration-threshold: match SLA

High-traffic service:
  sliding-window-size: 100 (more statistically meaningful)
  minimum-number-of-calls: 20
```

## Which Redis Data Structure?

```
Cache single object:          String (JSON serialized)
Cache object fields:          Hash (update individual fields)
Rate limit counter:           String with INCR
Rate limit sliding window:    ZSet (sorted set)
Leaderboard:                  ZSet
Unique visitor count:         HyperLogLog (approximate, very small memory)
Presence tracking:            Set
Queue:                        List
Pub/Sub:                      Redis Streams or Pub/Sub
Distributed lock:             String with NX + EX
Session storage:              Hash or String
```

## Fail Open vs Fail Closed?

```
Rate Limiter:     FAIL OPEN  (Redis down → let requests through)
Auth:             FAIL CLOSED (Redis down → reject)
Cache:            FAIL OPEN  (Redis down → serve from DB)
Feature flags:    FAIL OPEN  (Redis down → use defaults)
Distributed lock: FAIL CLOSED (Redis down → don't proceed)
```

---

## Common Property Mistakes Quick Reference

```
WRONG: resilience4j.circuitbreaker.failure-rate-threshold=50
RIGHT: resilience4j.circuitbreaker.instances.{name}.failure-rate-threshold=50

WRONG: @CacheEvict(key = "id")
RIGHT: @CacheEvict(key = "#id")

WRONG: public void fallback() { ... }
RIGHT: public void fallback(Throwable ex) { ... }
       public void fallback(Long id, Throwable ex) { ... }  // match original params

WRONG: @CircuitBreaker on private method
RIGHT: @CircuitBreaker on public method only

WRONG: spring.redis.host=localhost   (old Spring Data Redis)
RIGHT: spring.data.redis.host=localhost  (Spring Boot 3.x)

WRONG: redisTemplate.expire(key, 60)
RIGHT: redisTemplate.expire(key, Duration.ofSeconds(60))

WRONG: redis.set(key, value)  // no TTL
RIGHT: redis.set(key, value, Duration.ofMinutes(10))

WRONG: KEYS * in production
RIGHT: SCAN with cursor and count

WRONG: sliding-window-size=100, minimum-number-of-calls=100
RIGHT: minimum-number-of-calls should be <= sliding-window-size
       and represent a statistically meaningful sample
```

---

*Built for StreamBox. Applicable to any production Spring Boot backend.*
*Every property, every pattern, every gotcha documented from real production experience.*
