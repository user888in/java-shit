# Kafka Production Guide
### Build event streaming platforms the right way

---

## Table of Contents

1. [Core Mental Model](#1-core-mental-model)
2. [Topics, Partitions & Offsets](#2-topics-partitions--offsets)
3. [Consumer Groups](#3-consumer-groups)
4. [Delivery Guarantees](#4-delivery-guarantees)
5. [Producer Patterns](#5-producer-patterns)
6. [Consumer Patterns](#6-consumer-patterns)
7. [Error Handling & Dead Letter Queues](#7-error-handling--dead-letter-queues)
8. [Schema Design & Evolution](#8-schema-design--evolution)
9. [Exactly-Once Processing](#9-exactly-once-processing)
10. [Performance Tuning](#10-performance-tuning)
11. [Monitoring & Observability](#11-monitoring--observability)
12. [Real-World Patterns](#12-real-world-patterns)
13. [What NOT to Do](#13-what-not-to-do)

---

## 1. Core Mental Model

Forget everything you know about HTTP request/response. Kafka is a **distributed commit log**.

```
                    KAFKA BROKER
                 ┌──────────────────┐
Producer ──────► │   Topic          │ ◄────── Consumer Group A
                 │   ├─ Partition 0 │ ◄────── Consumer Group B
                 │   ├─ Partition 1 │ ◄────── Consumer Group C
                 │   └─ Partition 2 │
                 └──────────────────┘
```

**Key insight:** Messages are written once, read by as many consumer groups as you want.
Each group gets every message independently. Adding a new feature = adding a new consumer group. Zero changes to producers.

**Three guarantees Kafka gives you:**
- Messages are persisted to disk (not lost on crash)
- Messages are ordered within a partition
- Messages can be replayed (consumers track their own offset)

---

## 2. Topics, Partitions & Offsets

### Topics
A topic is a category. Think of it like a database table, but append-only.

```
Topic: movie.watched
Topic: user.registered
Topic: payment.completed
Topic: notification.send
```

### Partitions
Each topic is split into partitions. Partitions are the unit of parallelism.

```
movie.watched (3 partitions)
├── Partition 0: [msg0, msg3, msg6, msg9 ...]
├── Partition 1: [msg1, msg4, msg7, msg10 ...]
└── Partition 2: [msg2, msg5, msg8, msg11 ...]
```

**Partition count = max parallelism for consumers.**
3 partitions → max 3 consumers processing simultaneously.
10 consumers on 3 partitions → 7 consumers sit idle.

### Message Keys & Routing
The key determines which partition a message goes to:
```
hash(key) % partitionCount = partition number
```

```java
// All events for user 42 always go to the same partition
// Guarantees ordering for that user's events
kafkaTemplate.send("movie.watched", "user-42", event);

// No key = round-robin across partitions
// Use when ordering doesn't matter
kafkaTemplate.send("analytics.events", null, event);
```

**Rule:** Use a key when you need ordered processing for a specific entity.
No key when throughput matters more than order.

### Offsets
Each message in a partition has a sequential offset number. Consumers track their position.

```
Partition 0: [0][1][2][3][4][5][6]
                              ▲
                    Consumer offset (processed up to 5)
```

Consumers can:
- Read from latest (new messages only)
- Read from earliest (replay all history)
- Seek to a specific offset (replay from a point in time)

This is how you replay events after a bug fix — reset offset, reprocess.

---

## 3. Consumer Groups

The most important concept in Kafka.

```
Topic: movie.watched (3 partitions)

Consumer Group: watch-history-group
├── Consumer 1 → Partition 0
├── Consumer 2 → Partition 1
└── Consumer 3 → Partition 2

Consumer Group: analytics-group
├── Consumer 1 → Partition 0
├── Consumer 2 → Partition 1
└── Consumer 3 → Partition 2

Consumer Group: recommendation-group
└── Consumer 1 → Partition 0, 1, 2 (single consumer, slower)
```

Every group reads all messages independently. The groups never interfere.

### Rebalancing
When a consumer joins or leaves a group, Kafka redistributes partitions. During rebalance, consumption pauses. This is why you want consumers that process fast and commit often.

### Concurrency in Spring
```java
@KafkaListener(
    topics = "movie.watched",
    groupId = "watch-history-group",
    concurrency = "3"   // spawns 3 consumer threads, one per partition
)
public void handle(MovieWatchedEvent event) { ... }
```

`concurrency` must never exceed partition count — extra threads sit idle.

---

## 4. Delivery Guarantees

### At-Most-Once
Message delivered zero or one times. Possible loss. Fastest.
```
Commit offset → Process message
(if crash after commit, message lost)
```
Use for: metrics, analytics where occasional loss is acceptable.

### At-Least-Once (default)
Message delivered one or more times. No loss but possible duplicates.
```
Process message → Commit offset
(if crash after process but before commit, message redelivered)
```
Use for: most business events. Make your consumers idempotent.

### Exactly-Once
Message processed exactly once. No loss, no duplicates. Expensive.
Requires: idempotent producer + transactional consumer + same Kafka cluster for read and write.
Use for: financial transactions, billing events.

### Making At-Least-Once safe with idempotency
```java
// Instead of blindly inserting, upsert using a unique business key
watchHistoryRepository
    .findByUserIdAndMovieId(event.getUserId(), event.getMovieId())
    .ifPresentOrElse(
        existing -> {
            existing.setProgressSeconds(event.getProgressSeconds());
            watchHistoryRepository.save(existing);
        },
        () -> watchHistoryRepository.save(buildNewHistory(event))
    );
```

If the same event is delivered twice, the second delivery is a no-op. That's idempotency.

---

## 5. Producer Patterns

### Configuration for Production

```properties
# Reliability
spring.kafka.producer.acks=all
spring.kafka.producer.retries=3
spring.kafka.producer.properties.enable.idempotence=true

# Performance
spring.kafka.producer.batch-size=16384
spring.kafka.producer.properties.linger.ms=5
spring.kafka.producer.buffer-memory=33554432
spring.kafka.producer.compression-type=snappy
```

| Setting | Value | Meaning |
|---|---|---|
| `acks=all` | `all` | Wait for all in-sync replicas to acknowledge |
| `enable.idempotence` | `true` | No duplicate messages on retry |
| `linger.ms` | `5` | Wait 5ms to batch messages before sending |
| `compression.type` | `snappy` | Compress batches — less network, more CPU |

### Producer Service Pattern

```java
@Service
@RequiredArgsConstructor
@Slf4j
public class EventProducer {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    public void publish(String topic, String key, Object event) {
        kafkaTemplate.send(topic, key, event)
            .whenComplete((result, ex) -> {
                if (ex != null) {
                    log.error("PUBLISH FAILED topic={} key={} event={}",
                        topic, key, event, ex);
                    // Alert here — PagerDuty, Slack, whatever
                } else {
                    log.debug("Published topic={} partition={} offset={}",
                        topic,
                        result.getRecordMetadata().partition(),
                        result.getRecordMetadata().offset());
                }
            });
    }
}
```

**Never fire-and-forget without a `whenComplete` callback.**
Silent publish failures are the hardest bugs to find in production.

### Transactional Publishing (Exactly-Once)

```java
@Transactional
public void processOrderAndPublish(Order order) {
    // DB write and Kafka publish in one atomic operation
    orderRepository.save(order);

    kafkaTemplate.executeInTransaction(ops -> {
        ops.send("order.placed", order.getId().toString(), buildEvent(order));
        return true;
    });
    // Both commit or both rollback
}
```

---

## 6. Consumer Patterns

### Configuration for Production

```properties
spring.kafka.consumer.auto-offset-reset=earliest
spring.kafka.consumer.enable-auto-commit=false
spring.kafka.consumer.max-poll-records=100
spring.kafka.consumer.properties.max.poll.interval.ms=300000
spring.kafka.consumer.properties.session.timeout.ms=45000
spring.kafka.consumer.properties.heartbeat.interval.ms=15000
```

| Setting | Value | Why |
|---|---|---|
| `enable-auto-commit=false` | false | Never. Manual commit only — you control when offset advances |
| `max-poll-records` | 100 | Process 100 records per poll — tune based on processing time |
| `max.poll.interval.ms` | 300000 | If consumer takes longer than 5min, Kafka assumes it's dead |

### Manual Acknowledgement

```java
@KafkaListener(topics = "movie.watched", groupId = "watch-history-group")
public void handle(MovieWatchedEvent event, Acknowledgment ack) {
    try {
        watchHistoryService.save(event);
        ack.acknowledge();  // commit offset only after successful processing
    } catch (Exception e) {
        log.error("Failed to process event, not committing offset", e);
        // offset not committed — message will be redelivered
        // send to DLQ after max retries (see error handling section)
    }
}
```

### Batch Consumption

```java
@KafkaListener(topics = "analytics.events", groupId = "analytics-group")
public void handleBatch(List<MovieWatchedEvent> events, Acknowledgment ack) {
    // Process 100 events in one DB transaction instead of 100 separate writes
    analyticsRepository.saveAll(
        events.stream().map(this::toEntity).toList()
    );
    ack.acknowledge();
    log.info("Processed batch of {} analytics events", events.size());
}
```

Batch consumption is 10-50x faster for write-heavy consumers.

---

## 7. Error Handling & Dead Letter Queues

The most critical production concern that tutorials always skip.

### What happens when a consumer throws?

Without proper error handling:
- Consumer crashes → partition assignment lost → rebalance → redelivery → crash again
- **Poison pill**: one bad message blocks all subsequent messages on that partition forever

### The Solution: Dead Letter Queue (DLQ)

```java
@Configuration
public class KafkaErrorConfig {

    @Bean
    public DefaultErrorHandler errorHandler(KafkaTemplate<String, Object> template) {

        // Send to DLQ after 3 attempts with exponential backoff
        DeadLetterPublishingRecoverer recoverer =
            new DeadLetterPublishingRecoverer(template,
                (record, ex) -> {
                    log.error("Sending to DLQ after retries exhausted. " +
                        "topic={} key={} error={}",
                        record.topic(), record.key(), ex.getMessage());
                    // DLQ topic is auto-named: original-topic.DLT
                    return new TopicPartition(record.topic() + ".DLT", record.partition());
                });

        // Retry 3 times: 1s, 2s, 4s backoff
        ExponentialBackOffWithMaxRetries backOff =
            new ExponentialBackOffWithMaxRetries(3);
        backOff.setInitialInterval(1000L);
        backOff.setMultiplier(2.0);
        backOff.setMaxInterval(10000L);

        DefaultErrorHandler handler = new DefaultErrorHandler(recoverer, backOff);

        // Don't retry these — they'll never succeed
        handler.addNotRetryableExceptions(
            IllegalArgumentException.class,
            NullPointerException.class
        );

        return handler;
    }
}
```

Wire it into your listener factory:
```java
@Bean
public ConcurrentKafkaListenerContainerFactory<?, ?> kafkaListenerContainerFactory(
        ConsumerFactory<Object, Object> consumerFactory,
        DefaultErrorHandler errorHandler) {

    ConcurrentKafkaListenerContainerFactory<Object, Object> factory =
        new ConcurrentKafkaListenerContainerFactory<>();
    factory.setConsumerFactory(consumerFactory);
    factory.setCommonErrorHandler(errorHandler);
    factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL);
    return factory;
}
```

### DLQ Consumer — Handle Failed Messages

```java
@KafkaListener(topics = "movie.watched.DLT", groupId = "dlq-handler-group")
public void handleDlq(
        ConsumerRecord<String, MovieWatchedEvent> record,
        @Header(KafkaHeaders.EXCEPTION_MESSAGE) String errorMessage) {

    log.error("DLQ message received. key={} error={} payload={}",
        record.key(), errorMessage, record.value());

    // Options:
    // 1. Alert on-call engineer
    // 2. Save to DB for manual inspection
    // 3. Attempt different recovery logic
    dlqRepository.save(DeadLetterMessage.builder()
        .topic(record.topic())
        .key(record.key())
        .payload(record.value().toString())
        .errorMessage(errorMessage)
        .receivedAt(LocalDateTime.now())
        .build());
}
```

---

## 8. Schema Design & Evolution

### Event naming convention
```
{domain}.{entity}.{past-tense-action}

movie.watched
user.registered
payment.completed
order.placed
subscription.cancelled
```

### Event structure — always include metadata
```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MovieWatchedEvent {

    // Business data
    private Long    userId;
    private Long    movieId;
    private int     progressSeconds;
    private boolean completed;

    // Metadata — never skip these
    private String        eventId;      // UUID — for deduplication
    private String        eventVersion; // "v1" — for schema evolution
    private LocalDateTime occurredAt;   // when it happened, not when published
    private String        source;       // which service published this
}
```

### Schema Evolution Rules

```
✅ SAFE changes (backward compatible):
   - Add optional field with default value
   - Add new event type

❌ BREAKING changes (will crash consumers):
   - Remove a field
   - Rename a field
   - Change a field's type

✅ How to rename a field safely:
   1. Add new field alongside old field (both present)
   2. Deploy consumers that read both fields
   3. Deploy producers that write both fields
   4. After all consumers updated, remove old field from producers
   5. After confirming no consumer reads old field, remove it
```

### Versioning strategy
```java
// v1 — original
public class MovieWatchedEvent {
    private Long userId;
    private Long movieId;
    private String eventVersion = "v1";
}

// v2 — added quality field
public class MovieWatchedEvent {
    private Long    userId;
    private Long    movieId;
    private String  quality;       // new field
    private String  eventVersion = "v2";
}

// Consumer handles both
public void handle(MovieWatchedEvent event) {
    if ("v2".equals(event.getEventVersion())) {
        // use quality field
    } else {
        // default quality
    }
}
```

---

## 9. Exactly-Once Processing

Use only when the business requires it. Has performance cost (~30% throughput reduction).

### Transactional Producer
```java
@Bean
public KafkaTransactionManager<String, Object> kafkaTransactionManager(
        ProducerFactory<String, Object> producerFactory) {
    return new KafkaTransactionManager<>(producerFactory);
}
```

```properties
spring.kafka.producer.transaction-id-prefix=streambox-tx-
```

### Usage
```java
@Transactional("kafkaTransactionManager")
public void chargeAndPublish(PaymentRequest request) {
    Payment payment = paymentService.charge(request);
    kafkaTemplate.send("payment.completed",
        payment.getId().toString(),
        buildEvent(payment));
    // Both DB write and Kafka publish commit together
}
```

---

## 10. Performance Tuning

### Throughput vs Latency tradeoff

| Goal | Settings |
|---|---|
| High throughput (batch ETL) | `linger.ms=50`, `batch.size=65536`, `compression.type=snappy` |
| Low latency (real-time events) | `linger.ms=0`, `batch.size=16384`, `acks=1` |
| Balanced (most production) | `linger.ms=5`, `batch.size=32768`, `acks=all` |

### Partition count guidelines

```
Too few partitions → bottleneck, can't scale consumers
Too many partitions → overhead, slower rebalancing

Rule of thumb:
  partitions = max(target throughput / single partition throughput, consumer count)

For StreamBox:
  movie.watched     → 6 partitions  (high volume, many consumers)
  user.registered   → 2 partitions  (low volume)
  payment.completed → 3 partitions  (medium volume, needs ordering per user)
```

### Consumer throughput optimization

```java
// Slow: 1000 DB writes for 1000 events
@KafkaListener(topics = "movie.watched")
public void handle(MovieWatchedEvent event) {
    repository.save(buildEntity(event)); // 1000 round trips
}

// Fast: 1 DB write for 1000 events
@KafkaListener(topics = "movie.watched")
public void handleBatch(List<MovieWatchedEvent> events) {
    repository.saveAll(                  // 1 round trip
        events.stream().map(this::buildEntity).toList()
    );
}
```

---

## 11. Monitoring & Observability

### Critical metrics to watch

| Metric | Alert threshold | Meaning |
|---|---|---|
| `kafka.consumer.lag` | > 10,000 | Consumers falling behind producers |
| `kafka.producer.error-rate` | > 0 | Publish failures |
| `kafka.consumer.fetch-rate` | Sudden drop | Consumer died |
| DLQ topic message count | > 0 | Messages failing after retries |

### Consumer lag — the most important metric

```
Consumer lag = latest offset - consumer committed offset

Lag = 0:        consumers keeping up ✅
Lag = 1,000:    slight delay, monitor ⚠️
Lag = 100,000:  consumers drowning, add instances 🔴
```

### Spring Actuator Kafka metrics

```properties
management.endpoints.web.exposure.include=health,metrics,kafka
```

```bash
# Check consumer lag via actuator
curl http://localhost:8080/actuator/metrics/kafka.consumer.fetch-latency-avg
```

### Log what matters

```java
@KafkaListener(topics = "movie.watched", groupId = "watch-history-group")
public void handle(
        MovieWatchedEvent event,
        @Header(KafkaHeaders.RECEIVED_PARTITION) int partition,
        @Header(KafkaHeaders.OFFSET) long offset,
        Acknowledgment ack) {

    log.info("CONSUME partition={} offset={} userId={} movieId={} lag=approx",
        partition, offset, event.getUserId(), event.getMovieId());

    // process...
    ack.acknowledge();

    log.info("ACK partition={} offset={}", partition, offset);
}
```

---

## 12. Real-World Patterns

### Pattern 1: Event Sourcing
Store every state change as an event. Rebuild state by replaying events.

```
user.watchlist.updated  [add movie 5]
user.watchlist.updated  [add movie 12]
user.watchlist.updated  [remove movie 5]

Replay → current watchlist = [12]
```

### Pattern 2: CQRS with Kafka
Separate read and write models. Write side publishes events. Read side maintains optimized read models.

```
Write: POST /orders → save order → publish order.placed
Read:  Consumer updates order_summary table optimized for queries
Query: GET /orders → reads from order_summary, not orders table
```

### Pattern 3: Saga Pattern (Distributed Transactions)
Coordinate transactions across services without 2-phase commit.

```
1. order-service publishes order.placed
2. inventory-service consumes → reserves stock → publishes inventory.reserved
3. payment-service consumes → charges card → publishes payment.completed
4. order-service consumes → confirms order → publishes order.confirmed

If any step fails → publish compensating event → rollback previous steps
```

### Pattern 4: Fan-out
One event, many independent consumers — exactly what StreamBox uses.

```
movie.watched
    ├── watch-history-group    → saves progress to DB
    ├── analytics-group        → increments view count
    ├── recommendation-group   → refreshes user recommendations
    ├── notification-group     → sends "still watching?" after 2hrs
    └── billing-group          → tracks usage for premium tier
```

Each group is independent. They scale separately. They fail independently.

---

## 13. What NOT to Do

```
❌ Don't use Kafka as a job queue for tasks that need responses
   → Use HTTP or gRPC for request/response

❌ Don't store large payloads in Kafka messages (>1MB)
   → Store payload in S3/DB, put only the reference ID in the message

❌ Don't create topics with 1 partition
   → You can never scale consumers beyond 1, and can't increase partition
      count later without losing ordering guarantees

❌ Don't use auto-commit
   → You lose control of exactly when offsets advance
   → Messages can be lost or double-processed unexpectedly

❌ Don't put sensitive data in events (passwords, credit card numbers)
   → Kafka retains messages for days/weeks. Events are logs, not secrets.

❌ Don't ignore consumer lag
   → Lag = backpressure = your consumers are slower than producers
   → Left unchecked, you run out of disk on the broker

❌ Don't skip the DLQ
   → One bad message will block that partition forever
   → The most common cause of mysterious consumer stalls in production

❌ Don't share consumer groups across different logical operations
   → watch-history and analytics should have separate group IDs
   → Shared groups split partitions between them, breaking processing logic
```

---

## Quick Reference

```
# List topics
kafka-topics.sh --bootstrap-server localhost:9092 --list

# Describe topic (partitions, replication)
kafka-topics.sh --bootstrap-server localhost:9092 --describe --topic movie.watched

# Watch messages live
kafka-console-consumer.sh --bootstrap-server localhost:9092 \
  --topic movie.watched --from-beginning

# Check consumer lag
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --describe --group watch-history-group

# Reset consumer offset (replay from beginning)
kafka-consumer-groups.sh --bootstrap-server localhost:9092 \
  --group watch-history-group --topic movie.watched \
  --reset-offsets --to-earliest --execute
```

---

*Built for StreamBox — applicable to any event-driven platform at any scale.*
