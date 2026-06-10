# gRPC COMPLETE MASTERY GUIDE
## The Most Comprehensive Resource to Learn gRPC for Java Backend Developers

---

> **How to use this guide:** Read linearly the first time. Every concept builds on the previous one. After finishing, use it as a reference. The project at the end uses every single concept covered here.

---

# PART 1: FOUNDATIONS

---

## Chapter 1: What is gRPC and Why Does It Exist

### The problem gRPC solves

Before gRPC, services talked to each other over REST. REST works fine for public APIs — humans read JSON, browsers understand HTTP/1.1, and simplicity is a virtue.

But internal microservice communication is different. When your Payment Service calls your Fraud Service 10,000 times per second, you care about:
- **Speed** — how fast is the serialization/deserialization
- **Efficiency** — how many bytes go over the wire
- **Type safety** — does the compiler catch contract mismatches
- **Streaming** — can both sides push data continuously
- **Code generation** — do you write client code manually or auto-generate it

REST fails on most of these at scale. JSON is verbose. HTTP/1.1 is text-based. There is no enforced schema. Streaming is bolted on. Client libraries are written by hand.

gRPC solves all of them.

### What gRPC is

gRPC is an open-source, high-performance **Remote Procedure Call (RPC) framework** built by Google, released in 2016. It lets you call a method on a remote server as if it were a local function call.

```java
// This looks like a local method call
UserResponse user = userStub.getUser(
    GetUserRequest.newBuilder().setId(42).build()
);

// But the method actually ran on a server in a different datacenter
```

No HTTP clients. No JSON parsing. No URL construction. No response mapping. Just a method call.

### Who uses gRPC in production

- **Google** — internally for almost all service-to-service communication
- **Netflix** — inter-service communication at massive scale
- **Uber** — real-time location and dispatch systems
- **Cloudflare** — internal infrastructure
- **Docker** — container runtime API (containerd uses gRPC)
- **Kubernetes** — kubelet communicates over gRPC
- **Dropbox** — replaced their own RPC framework with gRPC
- **Square** — replaced REST with gRPC for mobile APIs

### gRPC vs REST — honest comparison

| Dimension | REST | gRPC |
|---|---|---|
| Protocol | HTTP/1.1 (usually) | HTTP/2 (always) |
| Data format | JSON (text) | Protocol Buffers (binary) |
| Schema | Optional (OpenAPI) | Mandatory (.proto) |
| Code generation | Manual or tools | Built-in, first-class |
| Streaming | Bolted on (SSE, WebSocket) | Native, 4 types |
| Browser support | Native | Needs grpc-web proxy |
| Payload size | ~3-10x larger | Compact binary |
| Speed | Baseline | ~5-10x faster |
| Type safety | No (runtime errors) | Yes (compile-time errors) |
| Human readable | Yes | No (binary) |
| Firewall friendly | Yes | Mostly yes (port 80/443) |
| Learning curve | Low | Medium |

**When to use gRPC:**
- Service-to-service communication inside your infrastructure
- When performance and efficiency matter
- When you need streaming (real-time data, live updates)
- Polyglot systems (Java backend, Go sidecar, Python ML service — one .proto, all clients generated)

**When to stick with REST:**
- Public APIs consumed by third parties
- Browser clients (unless you use grpc-web)
- Simple CRUD where performance is not a concern
- When the team is small and simplicity wins

---

## Chapter 2: HTTP/2 — The Foundation of gRPC

gRPC runs exclusively on HTTP/2. Understanding HTTP/2 makes gRPC make sense.

### What was wrong with HTTP/1.1

**Head-of-line blocking:** In HTTP/1.1, requests on a single connection must complete in order. Request 1 is slow → requests 2, 3, 4 wait. Browsers worked around this by opening 6 parallel connections per domain. Wasteful.

**Text-based headers:** Every HTTP/1.1 request sends headers as plain text. Headers like `Content-Type`, `Authorization`, `User-Agent` get sent repeatedly, verbatim, on every request.

**No server push:** Server can only respond to client requests. It cannot push data proactively.

**No multiplexing:** One request per connection at a time (without pipelining, which was broken in practice).

### What HTTP/2 fixes

**Binary framing:** All HTTP/2 data is sent as binary frames, not text. Faster to parse, more compact.

**Multiplexing:** Multiple streams over a single TCP connection simultaneously. Stream 1, 2, 3 all in-flight at the same time. No head-of-line blocking at the HTTP layer.

```
HTTP/1.1:
Connection: [req1] → [res1] → [req2] → [res2] → [req3] → [res3]

HTTP/2:
Connection: [req1] → [req2] → [req3]
            [res2] ← [res1] ← [res3]   ← any order, no waiting
```

**Header compression (HPACK):** Headers are compressed using a shared dictionary. Repeated headers (like `Authorization`) are referenced by index, not resent verbatim.

**Stream prioritization:** Clients can tell the server which requests are more important.

**Server push:** Server can push resources to the client before the client asks. gRPC uses this for streaming.

### How gRPC uses HTTP/2

Each gRPC call = one HTTP/2 stream. Since HTTP/2 multiplexes streams over one connection:
- Your service can have 1000 concurrent gRPC calls over one TCP connection
- No connection pool management like REST clients need
- Bidirectional streaming is naturally supported (both sides can write to the stream simultaneously)

gRPC headers map to HTTP/2 headers:
```
:method: POST
:path: /infra.health.v1.HealthService/RegisterService
:scheme: https
content-type: application/grpc
grpc-encoding: gzip    ← optional compression
authorization: Bearer <token>
```

The request body is the serialized Protobuf message, length-prefixed, sent as HTTP/2 DATA frames.

---

## Chapter 3: Protocol Buffers (Protobuf) — Deep Dive

Protobuf is the IDL (Interface Definition Language) and serialization format used by gRPC. You define your data and services in `.proto` files. The `protoc` compiler generates code in any language.

### Why not JSON

JSON is human-readable text. For `{"id": 42, "name": "Alice"}`:
- The field names `"id"` and `"name"` are sent on every message
- Numbers are sent as text: `42` is two ASCII characters
- No schema enforcement — anyone can send any field

Protobuf encodes the same data as binary:
- Field names are NOT sent — only field numbers (1, 2 bytes)
- Numbers use variable-length encoding — small numbers = fewer bytes
- Schema is enforced at compile time

Result: Protobuf messages are typically **3-10x smaller** than equivalent JSON, and **5-10x faster** to serialize/deserialize.

### Proto3 syntax — complete reference

```protobuf
syntax = "proto3";    // Always first line. Always proto3 (not proto2).

// Package — logical namespace. Used to avoid name collisions.
// Convention: company.domain.version
package infra.health.v1;

// Java-specific options
option java_package = "com.infra.health.v1";         // Generated Java package
option java_outer_classname = "HealthServiceProto";  // Wrapper class (ignored with multiple_files)
option java_multiple_files = true;                   // One .java file per message — ALWAYS use this
```

### Scalar field types — complete list

```protobuf
message ScalarExamples {
  // Numeric types
  double   price           = 1;   // 64-bit float. Use for monetary values needing precision.
  float    ratio           = 2;   // 32-bit float. Less precise. Avoid for money.
  int32    count           = 3;   // 32-bit signed int. Inefficient for negative numbers.
  int64    timestamp_ms    = 4;   // 64-bit signed int. For Unix timestamps in ms.
  uint32   port            = 5;   // 32-bit unsigned. For ports, counts that can't be negative.
  uint64   file_size       = 6;   // 64-bit unsigned. For byte counts, IDs.
  sint32   temperature     = 7;   // 32-bit signed. USE THIS for numbers that can be negative.
  sint64   balance_cents   = 8;   // 64-bit signed. USE THIS for negative 64-bit numbers.
  fixed32  flags           = 9;   // Always 4 bytes. Efficient when values > 2^28.
  fixed64  hash            = 10;  // Always 8 bytes. Efficient when values > 2^56.
  sfixed32 offset          = 11;  // Signed fixed 32-bit.
  sfixed64 signed_hash     = 12;  // Signed fixed 64-bit.
  bool     active          = 13;  // Boolean.

  // String and bytes
  string   name            = 14;  // UTF-8 or ASCII string. Never null — default is "".
  bytes    payload         = 15;  // Arbitrary byte sequence. For binary data, files, images.
}
```

**Critical rule about `int32` vs `sint32`:**

`int32` uses varint encoding. For negative numbers, varint always uses 10 bytes (because it sign-extends to 64-bit). `sint32` uses zigzag encoding: maps `0→0, -1→1, 1→2, -2→3` — making small negative numbers efficient.

```
int32  value = -1   → 10 bytes on wire  ← WASTEFUL
sint32 value = -1   → 1 byte on wire    ← USE THIS for negatives
```

### Field numbers — the most important concept in Protobuf

```protobuf
message ServiceInfo {
  string service_id = 1;   // field number 1
  string name       = 2;   // field number 2
  int32  port       = 3;   // field number 3
}
```

Field numbers are how Protobuf identifies fields on the wire — **not by name**. This is why:
- You can rename a field without breaking compatibility (number stays the same)
- You cannot change a field number without breaking everything
- Field numbers 1-15 use 1 byte of overhead → use for frequent fields
- Field numbers 16-2047 use 2 bytes → use for less frequent fields
- Field numbers 19000-19999 are reserved by Google — never use them
- Max field number is 536,870,911 (2^29 - 1)

**The cardinal sin of Protobuf:** Changing a field number in a deployed system. Old clients send field `2`, server now interprets that as something else. Silent data corruption. Never do it.

### Default values in proto3

In proto3, every field has a default value if not set:

| Type | Default |
|---|---|
| numeric (int32, float, etc.) | 0 |
| bool | false |
| string | "" (empty string) |
| bytes | empty bytes |
| enum | first value (must be 0) |
| message | null (field not set) |
| repeated | empty list |
| map | empty map |

**This means you cannot distinguish between "field was set to 0" and "field was not set".** For nullable fields, use `google.protobuf.Int32Value` (wrapper types) — covered below.

### Enums

```protobuf
enum ServiceStatus {
  // RULE 1: First value MUST be 0. It's the default.
  SERVICE_STATUS_UNSPECIFIED = 0;   // Use UNSPECIFIED, not UNKNOWN, not NONE

  SERVICE_STATUS_HEALTHY  = 1;
  SERVICE_STATUS_DEGRADED = 2;
  SERVICE_STATUS_DOWN     = 3;

  // RULE 2: Prefix all values with the enum name — avoids collisions
  // BAD:  HEALTHY = 1;
  // GOOD: SERVICE_STATUS_HEALTHY = 1;
}
```

Why `UNSPECIFIED` as 0? Because if a client sends a message without setting this field, you get 0. `UNSPECIFIED` makes it explicit that the field was not set, rather than a confusing `UNKNOWN` or `NONE` that means something.

**Enum aliases** — when you need two names for the same value:

```protobuf
enum Direction {
  option allow_alias = true;   // must declare this
  DIRECTION_UNSPECIFIED = 0;
  DIRECTION_NORTH = 1;
  DIRECTION_UP = 1;            // alias for NORTH
}
```

### Nested messages

```protobuf
message DeploymentJob {
  string job_id = 1;

  // Nested message reference — just use the message name
  ServiceInfo target_service = 2;

  // Inline nested message definition
  message ResourceLimits {
    int32 cpu_millicores  = 1;
    int64 memory_bytes    = 2;
  }
  ResourceLimits limits = 3;
}
```

### Repeated fields — lists

```protobuf
message DeploymentJob {
  repeated string tags        = 1;   // List<String> in Java
  repeated ServiceInfo deps   = 2;   // List<ServiceInfo> in Java
}
```

Java usage:
```java
DeploymentJob job = DeploymentJob.newBuilder()
    .addTags("production")
    .addTags("v2")
    .addDeps(serviceInfo1)
    .addDeps(serviceInfo2)
    .build();

List<String> tags = job.getTagsList();   // returns unmodifiable List<String>
int count = job.getTagsCount();
String first = job.getTags(0);
```

### Map fields

```protobuf
message Config {
  map<string, string>  env_vars   = 1;   // Map<String, String>
  map<string, int32>   port_map   = 2;   // Map<String, Integer>
  map<int64, LogEntry> log_index  = 3;   // Map<Long, LogEntry>
}
```

Restrictions: Map keys can be any scalar type except float, double, or bytes. Map values can be any type except another map.

Java usage:
```java
Config config = Config.newBuilder()
    .putEnvVars("DB_HOST", "localhost")
    .putEnvVars("DB_PORT", "5432")
    .build();

Map<String, String> env = config.getEnvVarsMap();
String dbHost = config.getEnvVarsOrDefault("DB_HOST", "localhost");
String dbPort = config.getEnvVarsOrThrow("DB_PORT");   // throws if missing
```

### oneof — mutually exclusive fields

```protobuf
message AlertPayload {
  string alert_id = 1;
  string service_id = 2;

  oneof alert_type {
    CpuAlert    cpu    = 3;
    MemoryAlert memory = 4;
    DiskAlert   disk   = 5;
    NetworkAlert network = 6;
  }
}
```

Only one field inside `oneof` can be set. Setting one clears all others.

Java usage:
```java
AlertPayload payload = AlertPayload.newBuilder()
    .setAlertId("alert-123")
    .setCpu(cpuAlert)    // sets cpu, clears memory/disk/network
    .build();

// Switch on which one is set
switch (payload.getAlertTypeCase()) {
    case CPU:
        handleCpu(payload.getCpu());
        break;
    case MEMORY:
        handleMemory(payload.getMemory());
        break;
    case ALERT_TYPE_NOT_SET:
        // none was set
        break;
}
```

### Well-known types — use these, don't invent your own

Google ships standard types bundled with `protobuf-java`. Always import and use these:

```protobuf
import "google/protobuf/timestamp.proto";   // For all timestamps
import "google/protobuf/duration.proto";    // For time durations
import "google/protobuf/empty.proto";       // For RPCs with no request/response
import "google/protobuf/wrappers.proto";    // For nullable primitives
import "google/protobuf/any.proto";         // For dynamic types
import "google/protobuf/struct.proto";      // For JSON-like structures
import "google/protobuf/field_mask.proto";  // For partial updates (PATCH)
```

**Timestamp — never use int64 for timestamps:**

```protobuf
message HealthCheck {
  google.protobuf.Timestamp checked_at = 1;
}
```

Java usage:
```java
import com.google.protobuf.Timestamp;
import java.time.Instant;

// Current time to Timestamp
Instant now = Instant.now();
Timestamp ts = Timestamp.newBuilder()
    .setSeconds(now.getEpochSecond())
    .setNanos(now.getNano())
    .build();

// Timestamp to Instant
Instant instant = Instant.ofEpochSecond(ts.getSeconds(), ts.getNanos());
```

**Duration:**

```protobuf
message ResponseStats {
  google.protobuf.Duration response_time = 1;
}
```

**Empty — for RPCs that take or return nothing:**

```protobuf
import "google/protobuf/empty.proto";

service HealthService {
  rpc Ping (google.protobuf.Empty) returns (google.protobuf.Empty);
  rpc DeregisterService (DeregisterRequest) returns (google.protobuf.Empty);
}
```

**Wrapper types — for nullable primitives:**

```protobuf
import "google/protobuf/wrappers.proto";

message ServiceConfig {
  // Without wrapper: can't tell if 0 means "not set" or "actually 0"
  int32 timeout_ms = 1;

  // With wrapper: null means "not set", 0 means "actually 0"
  google.protobuf.Int32Value timeout_ms_nullable = 2;
  google.protobuf.StringValue optional_label = 3;
  google.protobuf.BoolValue   feature_flag = 4;
}
```

Available wrappers: `BoolValue`, `BytesValue`, `DoubleValue`, `FloatValue`, `Int32Value`, `Int64Value`, `StringValue`, `UInt32Value`, `UInt64Value`.

**FieldMask — for partial updates:**

```protobuf
import "google/protobuf/field_mask.proto";

message UpdateServiceRequest {
  string service_id = 1;
  ServiceInfo service = 2;
  google.protobuf.FieldMask update_mask = 3;  // which fields to update
}
```

```java
UpdateServiceRequest request = UpdateServiceRequest.newBuilder()
    .setServiceId("svc-123")
    .setService(updatedService)
    .setUpdateMask(FieldMask.newBuilder()
        .addPaths("name")
        .addPaths("host")
        .build())   // only update name and host, ignore everything else
    .build();
```

### Schema evolution — how to change protos without breaking production

This is where most teams make mistakes. Protobuf is designed for schema evolution, but you must follow the rules.

**Safe changes — you can do these at any time:**

```protobuf
// BEFORE
message ServiceInfo {
  string service_id = 1;
  string name = 2;
}

// AFTER — these changes are backward compatible
message ServiceInfo {
  string service_id = 1;
  string name = 2;
  string version = 3;             // ADD new field with new number ✓
  repeated string tags = 4;       // ADD new repeated field ✓
  // Adding a new RPC to a service ✓
  // Adding a new enum value ✓
  // Renaming a field (number stays, name doesn't matter on wire) ✓
}
```

**Dangerous changes — never do these in production:**

```protobuf
// NEVER:
message ServiceInfo {
  string service_id = 2;  // ✗ CHANGED field number 1→2. SILENT DATA CORRUPTION.
  int32 name = 1;         // ✗ CHANGED field type string→int32. DESERIALIZATION CRASH.
}
```

**Retiring a field — the correct way:**

```protobuf
// When you want to remove a field
message ServiceInfo {
  // string old_host = 3;   ← deleted
  // int32  old_port = 4;   ← deleted

  reserved 3, 4;              // ← Reserve the numbers. New fields can NEVER use these.
  reserved "old_host", "old_port";  // ← Reserve the names too.

  string service_id = 1;
  string name = 2;
  string endpoint = 5;   // New field — uses number 5, not 3 or 4
}
```

**Versioning strategy for breaking changes:**

When you must make a breaking change (rename a service, restructure messages), use package versioning:

```
infra.health.v1  →  infra.health.v2
```

Old services keep using v1. New services use v2. Gateway routes to both. You migrate gradually. Old package never gets deleted until all clients are off it.

```
proto/
├── health/
│   ├── v1/
│   │   └── health_service.proto   ← package infra.health.v1
│   └── v2/
│       └── health_service.proto   ← package infra.health.v2
```

### Proto file naming and organization conventions

```
# File naming: snake_case, descriptive
health_service.proto       ✓
HealthService.proto        ✗
health.proto               ✗ (too vague)

# Message naming: PascalCase
message ServiceInfo {}     ✓
message service_info {}    ✗

# Field naming: snake_case
string service_id = 1;     ✓
string serviceId = 1;      ✗

# Enum naming: SCREAMING_SNAKE_CASE with enum name prefix
SERVICE_STATUS_HEALTHY     ✓
HEALTHY                    ✗
serviceStatusHealthy       ✗

# RPC naming: PascalCase, verb + noun
rpc RegisterService(...)   ✓
rpc register_service(...)  ✗
rpc DoRegister(...)        ✗ (vague verb)
```

---

## Chapter 4: The 4 Types of gRPC Communication

This is the most powerful feature of gRPC. REST has one pattern: request → response. gRPC has four.

### Type 1: Unary RPC

Classic request/response. Identical to REST semantically.

```protobuf
service HealthService {
  rpc GetServiceStatus (GetServiceStatusRequest) returns (ServiceStatusResponse);
}
```

```
Client                    Server
  │                          │
  │──── GetServiceStatus ───→│
  │                          │  (process)
  │←─── ServiceStatusResponse│
  │                          │
```

**Use when:** Fetching data, submitting a form, triggering an action where you need a single response.

### Type 2: Server Streaming RPC

Client sends one request. Server sends back a stream of messages.

```protobuf
service HealthService {
  rpc StreamHeartbeats (StreamHeartbeatsRequest) returns (stream HeartbeatEvent);
  //                                                      ^^^^^^ stream keyword
}
```

```
Client                    Server
  │                          │
  │──── StreamHeartbeats ───→│
  │                          │
  │←──── HeartbeatEvent ─────│
  │←──── HeartbeatEvent ─────│
  │←──── HeartbeatEvent ─────│
  │←──── HeartbeatEvent ─────│
  │         (continues...)   │
  │←──── onCompleted() ──────│
  │                          │
```

**Use when:** Live data feeds, log tailing, real-time monitoring, file download in chunks, search results streaming.

### Type 3: Client Streaming RPC

Client sends a stream of messages. Server sends back one response.

```protobuf
service DeployService {
  rpc PushDeployLogs (stream DeployLogLine) returns (DeployLogSummary);
  //                  ^^^^^^ stream keyword
}
```

```
Client                    Server
  │                          │
  │──── DeployLogLine ──────→│
  │──── DeployLogLine ──────→│
  │──── DeployLogLine ──────→│
  │──── onCompleted() ──────→│
  │                          │  (process all)
  │←──── DeployLogSummary ───│
  │                          │
```

**Use when:** File upload in chunks, IoT sensor data ingestion, batch data submission.

### Type 4: Bidirectional Streaming RPC

Both client and server send streams simultaneously. Neither waits for the other.

```protobuf
service LogService {
  rpc StreamLogs (stream LogEntry) returns (stream LogEntry);
  //              ^^^^^^                    ^^^^^^
}
```

```
Client                    Server
  │                          │
  │──── LogEntry ───────────→│
  │←─── LogEntry ────────────│  (matching log echoed back)
  │──── LogEntry ───────────→│
  │──── LogEntry ───────────→│
  │←─── LogEntry ────────────│
  │         (simultaneous)   │
  │──── onCompleted() ──────→│
  │←─── onCompleted() ───────│
  │                          │
```

**Use when:** Chat applications, real-time collaboration, live game state sync, bidirectional data pipelines.

---

## Chapter 5: gRPC Status Codes — Complete Reference

gRPC has its own status code system. Forget HTTP 200/404/500. Learn these.

```java
// All status codes live in io.grpc.Status
Status.OK                  // Success. RPC completed successfully.
Status.CANCELLED           // Operation was cancelled (by caller).
Status.UNKNOWN             // Unknown error (catch-all for unmapped exceptions).
Status.INVALID_ARGUMENT    // Client sent bad data. (≈ HTTP 400)
Status.DEADLINE_EXCEEDED   // Deadline expired before operation completed. (≈ HTTP 408)
Status.NOT_FOUND           // Resource not found. (≈ HTTP 404)
Status.ALREADY_EXISTS      // Resource already exists. (≈ HTTP 409)
Status.PERMISSION_DENIED   // Caller lacks permission. (≈ HTTP 403)
Status.RESOURCE_EXHAUSTED  // Quota/rate limit hit. (≈ HTTP 429)
Status.FAILED_PRECONDITION // System not in required state. (≈ HTTP 400)
Status.ABORTED             // Concurrency conflict (compare-and-swap failed).
Status.OUT_OF_RANGE        // Operation outside valid range.
Status.UNIMPLEMENTED       // Method not implemented. (≈ HTTP 501)
Status.INTERNAL            // Internal server error. (≈ HTTP 500)
Status.UNAVAILABLE         // Service unavailable, retry later. (≈ HTTP 503)
Status.DATA_LOSS           // Unrecoverable data loss.
Status.UNAUTHENTICATED     // Request lacks valid credentials. (≈ HTTP 401)
```

**How to throw status errors from server:**

```java
// Simple
responseObserver.onError(Status.NOT_FOUND.asRuntimeException());

// With description
responseObserver.onError(
    Status.NOT_FOUND
        .withDescription("Service not found: " + serviceId)
        .asRuntimeException()
);

// With cause (exception attached — NOT sent to client, only logged server-side)
responseObserver.onError(
    Status.INTERNAL
        .withDescription("Database error")
        .withCause(e)
        .asRuntimeException()
);
```

**How to handle status errors on client:**

```java
try {
    ServiceStatusResponse response = stub.getServiceStatus(request);
} catch (StatusRuntimeException e) {
    switch (e.getStatus().getCode()) {
        case NOT_FOUND:
            // handle not found
            break;
        case UNAVAILABLE:
            // retry logic
            break;
        case UNAUTHENTICATED:
            // refresh token and retry
            break;
        default:
            throw e;
    }
}
```

**Status with metadata (sending extra error details):**

```java
// Server side — attach metadata to error
Metadata metadata = new Metadata();
metadata.put(
    Metadata.Key.of("retry-after", Metadata.ASCII_STRING_MARSHALLER),
    "30"
);
responseObserver.onError(
    Status.RESOURCE_EXHAUSTED
        .withDescription("Rate limit exceeded")
        .asRuntimeException(metadata)
);

// Client side — read metadata from error
StatusRuntimeException e = ...; // caught exception
Metadata trailers = Status.trailersFromThrowable(e);
if (trailers != null) {
    String retryAfter = trailers.get(
        Metadata.Key.of("retry-after", Metadata.ASCII_STRING_MARSHALLER)
    );
}
```

**Which status code to use — decision guide:**

```
Input validation failed?        → INVALID_ARGUMENT
Resource doesn't exist?         → NOT_FOUND
Resource already exists?        → ALREADY_EXISTS
Not logged in?                  → UNAUTHENTICATED
Logged in but no permission?    → PERMISSION_DENIED
Server crashed / DB error?      → INTERNAL
DB optimistic lock failed?      → ABORTED (safe to retry)
System state wrong (e.g. account closed)? → FAILED_PRECONDITION
Rate limit exceeded?            → RESOURCE_EXHAUSTED
Service is down, try later?     → UNAVAILABLE (safe to retry)
Timeout hit?                    → DEADLINE_EXCEEDED
```
# PART 2: JAVA IMPLEMENTATION

---

## Chapter 6: Maven Multi-Module Setup — Complete Guide

### Why multi-module for gRPC projects

Every gRPC service needs the generated proto classes. If you have 5 services and each generates its own proto classes, you have 5 copies of the same generated code and 5 places to update when the schema changes.

The correct pattern: **one `infra-proto` module** that generates all classes and produces a jar. Every service module declares a dependency on `infra-proto`. Schema change = update one module, rebuild all.

### Parent pom structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.infra</groupId>
    <artifactId>infra-parent</artifactId>
    <version>1.0.0</version>
    <packaging>pom</packaging>   <!-- CRITICAL: pom, not jar -->

    <modules>
        <module>infra-proto</module>
        <module>infra-health-service</module>
        <module>infra-deploy-service</module>
        <module>infra-log-service</module>
        <module>infra-discovery-service</module>
        <module>infra-gateway</module>
    </modules>

    <properties>
        <java.version>21</java.version>
        <maven.compiler.source>21</maven.compiler.source>
        <maven.compiler.target>21</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>

        <!-- Pin all versions here. Never in child poms. -->
        <spring-boot.version>3.2.5</spring-boot.version>
        <grpc.version>1.63.0</grpc.version>
        <protobuf.version>3.25.3</protobuf.version>
        <grpc-spring-boot.version>3.1.0.RELEASE</grpc-spring-boot.version>
        <mapstruct.version>1.5.5.Final</mapstruct.version>
    </properties>

    <dependencyManagement>
        <dependencies>
            <!-- Spring Boot BOM — manages all Spring versions -->
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-dependencies</artifactId>
                <version>${spring-boot.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>

            <!-- gRPC BOM — manages all gRPC module versions -->
            <dependency>
                <groupId>io.grpc</groupId>
                <artifactId>grpc-bom</artifactId>
                <version>${grpc.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>

            <!-- Protobuf -->
            <dependency>
                <groupId>com.google.protobuf</groupId>
                <artifactId>protobuf-java</artifactId>
                <version>${protobuf.version}</version>
            </dependency>
            <dependency>
                <groupId>com.google.protobuf</groupId>
                <artifactId>protobuf-java-util</artifactId>
                <version>${protobuf.version}</version>
            </dependency>

            <!-- Spring Boot + gRPC integration -->
            <dependency>
                <groupId>net.devh</groupId>
                <artifactId>grpc-server-spring-boot-starter</artifactId>
                <version>${grpc-spring-boot.version}</version>
            </dependency>
            <dependency>
                <groupId>net.devh</groupId>
                <artifactId>grpc-client-spring-boot-starter</artifactId>
                <version>${grpc-spring-boot.version}</version>
            </dependency>

            <!-- Our generated proto classes -->
            <dependency>
                <groupId>com.infra</groupId>
                <artifactId>infra-proto</artifactId>
                <version>${project.version}</version>
            </dependency>

            <!-- MapStruct for proto <-> entity mapping -->
            <dependency>
                <groupId>org.mapstruct</groupId>
                <artifactId>mapstruct</artifactId>
                <version>${mapstruct.version}</version>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <build>
        <pluginManagement>
            <plugins>
                <plugin>
                    <groupId>org.springframework.boot</groupId>
                    <artifactId>spring-boot-maven-plugin</artifactId>
                    <version>${spring-boot.version}</version>
                </plugin>
            </plugins>
        </pluginManagement>
    </build>
</project>
```

### Proto module pom

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.infra</groupId>
        <artifactId>infra-parent</artifactId>
        <version>1.0.0</version>
    </parent>

    <artifactId>infra-proto</artifactId>
    <!-- No <packaging> needed — defaults to jar, which is what we want -->
    <!-- No Spring Boot parent — this is NOT a Spring Boot app -->

    <dependencies>
        <dependency>
            <groupId>io.grpc</groupId>
            <artifactId>grpc-stub</artifactId>
        </dependency>
        <dependency>
            <groupId>io.grpc</groupId>
            <artifactId>grpc-protobuf</artifactId>
        </dependency>
        <dependency>
            <groupId>com.google.protobuf</groupId>
            <artifactId>protobuf-java</artifactId>
        </dependency>
        <dependency>
            <groupId>com.google.protobuf</groupId>
            <artifactId>protobuf-java-util</artifactId>
        </dependency>
        <!-- Required for @Generated annotation — Java 9+ requirement -->
        <dependency>
            <groupId>jakarta.annotation</groupId>
            <artifactId>jakarta.annotation-api</artifactId>
            <version>2.1.1</version>
        </dependency>
    </dependencies>

    <build>
        <extensions>
            <!-- Detects OS + architecture for downloading correct protoc binary -->
            <extension>
                <groupId>kr.motd.maven</groupId>
                <artifactId>os-maven-plugin</artifactId>
                <version>1.7.1</version>
            </extension>
        </extensions>
        <plugins>
            <plugin>
                <groupId>org.xolstice.maven.plugins</groupId>
                <artifactId>protobuf-maven-plugin</artifactId>
                <version>0.6.1</version>
                <configuration>
                    <!-- Downloads protoc binary for your platform automatically -->
                    <protocArtifact>
                        com.google.protobuf:protoc:${protobuf.version}:exe:${os.detected.classifier}
                    </protocArtifact>
                    <pluginId>grpc-java</pluginId>
                    <!-- Downloads protoc-gen-grpc-java plugin for your platform -->
                    <pluginArtifact>
                        io.grpc:protoc-gen-grpc-java:${grpc.version}:exe:${os.detected.classifier}
                    </pluginArtifact>
                    <!-- Proto source directory — default, but explicit is better -->
                    <protoSourceRoot>${project.basedir}/src/main/proto</protoSourceRoot>
                </configuration>
                <executions>
                    <execution>
                        <goals>
                            <goal>compile</goal>         <!-- generates message classes -->
                            <goal>compile-custom</goal>  <!-- generates gRPC service classes -->
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

### What happens when you run `mvn compile`

```
1. os-maven-plugin detects: windows-x86_64 (or linux-x86_64, osx-aarch_64, etc.)

2. Maven downloads (first time only, cached to ~/.m2 after):
   ~/.m2/repository/com/google/protobuf/protoc/3.25.3/protoc-3.25.3-windows-x86_64.exe
   ~/.m2/repository/io/grpc/protoc-gen-grpc-java/1.63.0/protoc-gen-grpc-java-1.63.0-windows-x86_64.exe

3. protoc runs on every .proto file in src/main/proto/

4. For each .proto file, generates:
   target/generated-sources/protobuf/java/       → message classes
   target/generated-sources/protobuf/grpc-java/  → service stubs

5. Maven adds both directories to the compile source roots automatically

6. Java compiler compiles generated .java files along with your regular code

7. Result: infra-proto-1.0.0.jar contains all generated .class files
```

### Generated file locations — IntelliJ setup

IntelliJ sometimes doesn't automatically recognize generated sources. If you see red imports:

1. Right-click `target/generated-sources/protobuf/java` → Mark Directory As → Generated Sources Root
2. Right-click `target/generated-sources/protobuf/grpc-java` → Mark Directory As → Generated Sources Root

Or add to `pom.xml` inside the `protobuf-maven-plugin` configuration:

```xml
<configuration>
    <outputDirectory>${project.build.directory}/generated-sources/protobuf/java</outputDirectory>
    <clearOutputDirectory>false</clearOutputDirectory>
</configuration>
```

---

## Chapter 7: Spring Boot + gRPC Integration

The `grpc-spring-boot-starter` by `net.devh` handles all the boilerplate: creating the Netty server, registering services, managing the lifecycle, wiring clients.

### Server-side setup

**`application.yml`:**

```yaml
spring:
  application:
    name: infra-health-service

grpc:
  server:
    port: 9091                    # gRPC listens here
    # address: 0.0.0.0           # bind all interfaces (default)
    # max-inbound-message-size: 4MB  # max request size
    # max-inbound-metadata-size: 8KB # max header size
```

**Implementing a gRPC service:**

```java
package com.infra.health.grpc;

import com.infra.health.v1.*;
import io.grpc.stub.StreamObserver;
import net.devh.boot.grpc.server.service.GrpcService;
import lombok.RequiredArgsConstructor;

@GrpcService  // registers this as a gRPC service with the Netty server
@RequiredArgsConstructor
public class HealthServiceImpl extends HealthServiceGrpc.HealthServiceImplBase {

    private final HealthMonitorService healthMonitorService;  // Spring DI works normally

    @Override
    public void registerService(
            RegisterServiceRequest request,
            StreamObserver<RegisterServiceResponse> responseObserver) {

        // Delegate to service layer — gRPC impl should be thin
        RegisterServiceResponse response = healthMonitorService.register(request);

        responseObserver.onNext(response);
        responseObserver.onCompleted();
    }
}
```

**`@GrpcService` does the following automatically:**
- Registers the service implementation with the gRPC server
- Applies global interceptors to this service
- Manages lifecycle (start/stop with Spring context)

### Client-side setup

**`application.yml` on the calling service:**

```yaml
grpc:
  client:
    infra-health-service:              # logical name — matches @GrpcClient annotation
      address: static://localhost:9091 # static://host:port for simple setups
      negotiation-type: plaintext      # PLAINTEXT for local dev, TLS for production
      # enable-keep-alive: true
      # keep-alive-time: 60s
      # keep-alive-timeout: 20s
```

**Using the client:**

```java
package com.infra.gateway.client;

import com.infra.health.v1.*;
import io.grpc.StatusRuntimeException;
import net.devh.boot.grpc.client.inject.GrpcClient;
import org.springframework.stereotype.Component;

@Component
public class HealthServiceClient {

    @GrpcClient("infra-health-service")  // name matches application.yml key
    private HealthServiceGrpc.HealthServiceBlockingStub healthStub;

    public RegisterServiceResponse register(String serviceId, String name) {
        RegisterServiceRequest request = RegisterServiceRequest.newBuilder()
                .setServiceId(serviceId)
                .setName(name)
                .build();

        try {
            return healthStub.registerService(request);
        } catch (StatusRuntimeException e) {
            // handle gRPC errors
            throw new RuntimeException("Health service unavailable", e);
        }
    }
}
```

### Stub types — which to use when

```java
// Blocking stub — synchronous, thread blocks until response arrives
// USE FOR: simple request/response, when simplicity > throughput
HealthServiceGrpc.HealthServiceBlockingStub blockingStub;

// Async stub — non-blocking, uses StreamObserver callbacks
// USE FOR: streaming RPCs, async workflows
HealthServiceGrpc.HealthServiceStub asyncStub;

// Future stub — returns ListenableFuture (Guava)
// USE FOR: when you want to compose async operations with futures
HealthServiceGrpc.HealthServiceFutureStub futureStub;
```

**Important:** BlockingStub does NOT support streaming RPCs (server-streaming, bidi-streaming). For those, you must use the async stub.

```java
// Server streaming — must use async stub
@GrpcClient("infra-health-service")
private HealthServiceGrpc.HealthServiceStub asyncHealthStub;

public void streamHeartbeats(String serviceId) {
    StreamHeartbeatsRequest request = StreamHeartbeatsRequest.newBuilder()
            .setServiceId(serviceId)
            .build();

    asyncHealthStub.streamHeartbeats(request, new StreamObserver<HeartbeatEvent>() {
        @Override
        public void onNext(HeartbeatEvent event) {
            // called for each event in the stream
            log.info("Heartbeat: {} CPU={}%", event.getServiceId(), event.getCpuPercent());
        }

        @Override
        public void onError(Throwable t) {
            // stream ended with error
            log.error("Stream error", t);
        }

        @Override
        public void onCompleted() {
            // stream ended normally
            log.info("Heartbeat stream completed");
        }
    });
    // returns immediately — callbacks fired asynchronously
}
```

---

## Chapter 8: Implementing All 4 RPC Types in Java

### Type 1: Unary — Complete Implementation

**Server:**

```java
@Override
public void getServiceStatus(
        GetServiceStatusRequest request,
        StreamObserver<ServiceStatusResponse> responseObserver) {

    // 1. Validate input
    if (request.getServiceId().isBlank()) {
        responseObserver.onError(
            Status.INVALID_ARGUMENT
                .withDescription("service_id cannot be empty")
                .asRuntimeException()
        );
        return;
    }

    // 2. Fetch data
    Optional<ServiceRegistration> registration =
            registrationRepository.findByServiceId(request.getServiceId());

    if (registration.isEmpty()) {
        responseObserver.onError(
            Status.NOT_FOUND
                .withDescription("No service registered with id: " + request.getServiceId())
                .asRuntimeException()
        );
        return;
    }

    // 3. Build response
    ServiceStatusResponse response = ServiceStatusResponse.newBuilder()
            .setService(mapper.toProto(registration.get()))
            .setStatus(ServiceHealthStatus.SERVICE_HEALTH_STATUS_HEALTHY)
            .setMissedHeartbeats(0)
            .setMeta(buildMeta())
            .build();

    // 4. ALWAYS both: onNext then onCompleted
    responseObserver.onNext(response);
    responseObserver.onCompleted();
}

private ResponseMeta buildMeta() {
    return ResponseMeta.newBuilder()
            .setRequestId(UUID.randomUUID().toString())
            .setTimestamp(Timestamps.fromMillis(System.currentTimeMillis()))
            .setServerId(serverProperties.getName())
            .build();
}
```

**Client:**

```java
// Synchronous call — thread blocks here until response arrives
ServiceStatusResponse response = blockingStub
        .withDeadlineAfter(5, TimeUnit.SECONDS)  // ALWAYS set a deadline
        .getServiceStatus(
            GetServiceStatusRequest.newBuilder()
                .setServiceId("svc-123")
                .build()
        );
```

### Type 2: Server Streaming — Complete Implementation

**Server:**

```java
@Override
public void streamHeartbeats(
        StreamHeartbeatsRequest request,
        StreamObserver<HeartbeatEvent> responseObserver) {

    String serviceId = request.getServiceId();

    // Replay last N heartbeats from DB
    if (request.getLastN() > 0) {
        List<HeartbeatRecord> history =
                heartbeatRepository.findLatestByServiceId(serviceId, request.getLastN());
        for (HeartbeatRecord record : history) {
            responseObserver.onNext(mapper.toProto(record));
        }
    }

    // Subscribe to live events
    // Using a blocking queue approach for simplicity
    // In production, use Reactor/RxJava or a proper pub-sub
    String subscriptionId = eventBus.subscribe(serviceId, event -> {
        try {
            responseObserver.onNext(event);
        } catch (StatusRuntimeException e) {
            // Client disconnected — this exception means the stream is dead
            // We handle cleanup below
        }
    });

    // When client disconnects, the responseObserver becomes closed
    // Use Context cancellation to detect this
    Context.current().withCancellation().addListener(
        context -> eventBus.unsubscribe(subscriptionId),
        Runnable::run
    );

    // NOTE: For server streaming, do NOT call onCompleted() if you want
    // the stream to stay open indefinitely. Call it only when done.
    // If you have a finite set: loop + onNext + onCompleted.
}
```

**Finite server streaming (when you know when the stream ends):**

```java
@Override
public void listDeploymentHistory(
        ListDeploymentHistoryRequest request,
        StreamObserver<DeploymentRecord> responseObserver) {

    // Stream records one by one instead of loading all into memory
    deploymentRepository
            .findByServiceId(request.getServiceId())
            .forEach(record -> responseObserver.onNext(mapper.toProto(record)));

    responseObserver.onCompleted();  // finite stream — call when done
}
```

**Client receiving server stream:**

```java
// Blocking iteration over server stream (BlockingStub supports server streaming)
Iterator<HeartbeatEvent> events = blockingStub
        .withDeadlineAfter(60, TimeUnit.SECONDS)
        .streamHeartbeats(
            StreamHeartbeatsRequest.newBuilder()
                .setServiceId("svc-123")
                .setLastN(10)
                .build()
        );

while (events.hasNext()) {
    HeartbeatEvent event = events.next();   // blocks until next event or stream end
    System.out.println("CPU: " + event.getCpuPercent() + "%");
}

// Async version (preferred)
asyncStub.streamHeartbeats(request, new StreamObserver<HeartbeatEvent>() {
    @Override
    public void onNext(HeartbeatEvent event) {
        processEvent(event);
    }

    @Override
    public void onError(Throwable t) {
        Status status = Status.fromThrowable(t);
        if (status.getCode() == Status.Code.CANCELLED) {
            log.info("Stream cancelled by client");
        } else {
            log.error("Stream error: {}", status.getDescription());
        }
    }

    @Override
    public void onCompleted() {
        log.info("Server finished streaming");
    }
});
```

### Type 3: Client Streaming — Complete Implementation

**Server:**

```java
@Override
public StreamObserver<DeployLogLine> pushDeployLogs(
        StreamObserver<DeployLogSummary> responseObserver) {

    // Return a StreamObserver — gRPC calls its methods as client sends data
    return new StreamObserver<DeployLogLine>() {

        private final List<DeployLogLine> lines = new ArrayList<>();
        private String deploymentId = null;
        private boolean hasError = false;

        @Override
        public void onNext(DeployLogLine line) {
            // Called for every message the client sends
            if (deploymentId == null) {
                deploymentId = line.getDeploymentId();
            }

            lines.add(line);

            // Optionally persist each line to DB as it arrives
            logRepository.save(mapper.toEntity(line));

            if (line.getLevel() == LogLevel.LOG_LEVEL_ERROR) {
                hasError = true;
            }
        }

        @Override
        public void onError(Throwable t) {
            // Client sent an error or disconnected
            log.error("Client error during log push for deployment {}", deploymentId, t);
            // Don't call responseObserver.onNext/onCompleted after onError
        }

        @Override
        public void onCompleted() {
            // Client finished sending — now we send our single response
            DeployLogSummary summary = DeployLogSummary.newBuilder()
                    .setDeploymentId(deploymentId != null ? deploymentId : "unknown")
                    .setTotalLines(lines.size())
                    .setSuccess(!hasError)
                    .setFinalMessage(hasError ? "Deployment failed" : "Deployment succeeded")
                    .setCompletedAt(Timestamps.fromMillis(System.currentTimeMillis()))
                    .build();

            responseObserver.onNext(summary);
            responseObserver.onCompleted();
        }
    };
}
```

**Client sending stream:**

```java
// For client streaming, must use async stub
@GrpcClient("infra-deploy-service")
private DeployServiceGrpc.DeployServiceStub asyncDeployStub;

public DeployLogSummary pushLogs(String deploymentId, List<String> logLines) {
    // Use CountDownLatch to wait for the response since we're async
    CountDownLatch latch = new CountDownLatch(1);
    AtomicReference<DeployLogSummary> result = new AtomicReference<>();
    AtomicReference<Throwable> error = new AtomicReference<>();

    // Get a StreamObserver to send requests, passing in the response observer
    StreamObserver<DeployLogLine> requestObserver = asyncDeployStub
            .withDeadlineAfter(30, TimeUnit.SECONDS)
            .pushDeployLogs(new StreamObserver<DeployLogSummary>() {
                @Override
                public void onNext(DeployLogSummary summary) {
                    result.set(summary);
                }

                @Override
                public void onError(Throwable t) {
                    error.set(t);
                    latch.countDown();
                }

                @Override
                public void onCompleted() {
                    latch.countDown();
                }
            });

    try {
        // Send each log line
        for (String line : logLines) {
            requestObserver.onNext(
                DeployLogLine.newBuilder()
                    .setDeploymentId(deploymentId)
                    .setLine(line)
                    .setLevel(LogLevel.LOG_LEVEL_INFO)
                    .setTimestamp(Timestamps.fromMillis(System.currentTimeMillis()))
                    .build()
            );
        }
        // Signal we're done sending
        requestObserver.onCompleted();

        // Wait for server response
        latch.await(30, TimeUnit.SECONDS);

    } catch (InterruptedException e) {
        requestObserver.onError(e);
        Thread.currentThread().interrupt();
    }

    if (error.get() != null) {
        throw new RuntimeException("Push failed", error.get());
    }

    return result.get();
}
```

### Type 4: Bidirectional Streaming — Complete Implementation

**Server:**

```java
@Override
public StreamObserver<LogEntry> streamLogs(
        StreamObserver<LogEntry> responseObserver) {

    // Both client and server can send independently
    return new StreamObserver<LogEntry>() {

        @Override
        public void onNext(LogEntry entry) {
            // 1. Persist the incoming log
            logRepository.save(mapper.toEntity(entry));

            // 2. If this log matches active subscriptions, echo it back
            // (simple implementation: echo all logs back to the sender
            //  for log tailing / acknowledgment)
            if (matchesFilter(entry)) {
                responseObserver.onNext(entry);
            }
        }

        @Override
        public void onError(Throwable t) {
            log.error("Client stream error", t);
            // Clean up any server-side resources
        }

        @Override
        public void onCompleted() {
            // Client done sending
            responseObserver.onCompleted();   // server done too
        }

        private boolean matchesFilter(LogEntry entry) {
            // In real implementation, check against subscriber filters
            return entry.getSeverity().getNumber() >=
                   LogSeverity.LOG_SEVERITY_WARN.getNumber();
        }
    };
}
```

**Client using bidirectional streaming:**

```java
StreamObserver<LogEntry> requestObserver = asyncLogStub
        .withDeadlineAfter(300, TimeUnit.SECONDS)
        .streamLogs(new StreamObserver<LogEntry>() {
            @Override
            public void onNext(LogEntry entry) {
                // Server echoed back a matching log — display it
                System.out.printf("[%s] %s: %s%n",
                    entry.getSeverity(),
                    entry.getServiceId(),
                    entry.getMessage()
                );
            }

            @Override
            public void onError(Throwable t) {
                log.error("Log stream error", t);
            }

            @Override
            public void onCompleted() {
                log.info("Log stream ended");
            }
        });

// Send logs
requestObserver.onNext(LogEntry.newBuilder()
    .setServiceId("payment-service")
    .setMessage("Transaction processed")
    .setSeverity(LogSeverity.LOG_SEVERITY_INFO)
    .build());

requestObserver.onNext(LogEntry.newBuilder()
    .setServiceId("payment-service")
    .setMessage("DB connection failed")
    .setSeverity(LogSeverity.LOG_SEVERITY_ERROR)
    .build());

// Done sending (server keeps streaming back matches until it completes)
requestObserver.onCompleted();
```

---

## Chapter 9: gRPC Interceptors

Interceptors are the gRPC equivalent of servlet filters or Spring's `HandlerInterceptor`. They run before/after every RPC call. Use them for: authentication, logging, metrics, tracing, rate limiting.

### Server interceptors

```java
package com.infra.health.interceptor;

import io.grpc.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class LoggingInterceptor implements ServerInterceptor {

    @Override
    public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(
            ServerCall<ReqT, RespT> call,
            Metadata headers,
            ServerCallHandler<ReqT, RespT> next) {

        String method = call.getMethodDescriptor().getFullMethodName();
        long startTime = System.currentTimeMillis();

        log.info("gRPC call started: {}", method);

        // Wrap the ServerCall to intercept the response
        ServerCall<ReqT, RespT> wrappedCall = new ForwardingServerCall
                .SimpleForwardingServerCall<>(call) {
            @Override
            public void close(Status status, Metadata trailers) {
                long duration = System.currentTimeMillis() - startTime;
                log.info("gRPC call completed: {} | Status: {} | Duration: {}ms",
                        method, status.getCode(), duration);
                super.close(status, trailers);
            }
        };

        return next.startCall(wrappedCall, headers);
    }
}
```

**Authentication interceptor:**

```java
@Slf4j
@Component
public class AuthInterceptor implements ServerInterceptor {

    // Context key to pass authenticated user info to service layer
    public static final Context.Key<String> USER_ID_KEY =
            Context.key("userId");

    private static final Metadata.Key<String> AUTHORIZATION_KEY =
            Metadata.Key.of("authorization", Metadata.ASCII_STRING_MARSHALLER);

    private final JwtService jwtService;

    public AuthInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(
            ServerCall<ReqT, RespT> call,
            Metadata headers,
            ServerCallHandler<ReqT, RespT> next) {

        String authHeader = headers.get(AUTHORIZATION_KEY);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            call.close(
                Status.UNAUTHENTICATED.withDescription("Missing or invalid authorization header"),
                new Metadata()
            );
            return new ServerCall.Listener<>() {};  // empty listener — request blocked
        }

        String token = authHeader.substring(7);  // remove "Bearer "

        try {
            String userId = jwtService.validateAndExtractUserId(token);

            // Attach userId to Context so service layer can access it
            Context context = Context.current().withValue(USER_ID_KEY, userId);
            return Contexts.interceptCall(context, call, headers, next);

        } catch (InvalidTokenException e) {
            call.close(
                Status.UNAUTHENTICATED.withDescription("Invalid token: " + e.getMessage()),
                new Metadata()
            );
            return new ServerCall.Listener<>() {};
        }
    }
}
```

**Accessing context in service layer:**

```java
@GrpcService
@RequiredArgsConstructor
public class HealthServiceImpl extends HealthServiceGrpc.HealthServiceImplBase {

    @Override
    public void registerService(
            RegisterServiceRequest request,
            StreamObserver<RegisterServiceResponse> responseObserver) {

        // Access the userId set by the auth interceptor
        String userId = AuthInterceptor.USER_ID_KEY.get();
        log.info("RegisterService called by user: {}", userId);

        // ...
    }
}
```

**Registering interceptors with `@GrpcService`:**

```java
// Option 1: Apply specific interceptors to a specific service
@GrpcService(interceptors = {AuthInterceptor.class, LoggingInterceptor.class})
public class HealthServiceImpl extends HealthServiceGrpc.HealthServiceImplBase { ... }

// Option 2: Make an interceptor global (applies to ALL services)
@Component
@GrpcGlobalServerInterceptor
public class LoggingInterceptor implements ServerInterceptor { ... }
```

**Interceptor ordering:**

```java
// Use @Order to control execution order
// Lower number = executes first (outer layer)
@Order(1)
@GrpcGlobalServerInterceptor
public class LoggingInterceptor implements ServerInterceptor { ... }

@Order(2)
@GrpcGlobalServerInterceptor
public class AuthInterceptor implements ServerInterceptor { ... }

@Order(3)
@GrpcGlobalServerInterceptor
public class MetricsInterceptor implements ServerInterceptor { ... }
```

### Client interceptors

```java
@Component
public class ClientAuthInterceptor implements ClientInterceptor {

    private final TokenProvider tokenProvider;

    @Override
    public <ReqT, RespT> ClientCall<ReqT, RespT> interceptCall(
            MethodDescriptor<ReqT, RespT> method,
            CallOptions callOptions,
            Channel next) {

        return new ForwardingClientCall.SimpleForwardingClientCall<>(
                next.newCall(method, callOptions)) {

            @Override
            public void start(Listener<RespT> responseListener, Metadata headers) {
                // Attach token to every outgoing call
                headers.put(
                    Metadata.Key.of("authorization", Metadata.ASCII_STRING_MARSHALLER),
                    "Bearer " + tokenProvider.getToken()
                );
                super.start(responseListener, headers);
            }
        };
    }
}
```

**Registering client interceptors:**

```java
// In application.yml — for all clients
grpc:
  client:
    infra-health-service:
      address: static://localhost:9091
      negotiation-type: plaintext

// In code — per-stub
blockingStub = blockingStub.withInterceptors(new ClientAuthInterceptor());
```

Or via Spring config:

```java
@Configuration
public class GrpcClientConfig {

    @Bean
    public GlobalClientInterceptorConfigurer clientAuthInterceptor(TokenProvider tokenProvider) {
        return registry -> registry.addClientInterceptors(new ClientAuthInterceptor(tokenProvider));
    }
}
```

---

## Chapter 10: Deadlines and Timeouts

**Rule: Always set a deadline.** Without a deadline, a hung server holds the client thread forever.

### Setting deadlines

```java
// On blocking stub
blockingStub
    .withDeadlineAfter(5, TimeUnit.SECONDS)
    .getServiceStatus(request);

// On async stub
asyncStub
    .withDeadlineAfter(30, TimeUnit.SECONDS)
    .streamHeartbeats(request, responseObserver);

// Using Deadline object (absolute point in time)
Deadline deadline = Deadline.after(5, TimeUnit.SECONDS);
blockingStub.withDeadline(deadline).getServiceStatus(request);
```

### Deadline propagation — critical concept

When Service A calls Service B, and Service A has a 5-second deadline, Service B should inherit that deadline. If Service A started processing 3 seconds ago, Service B gets 2 seconds max.

gRPC propagates deadlines automatically when you use `Context`:

```java
// Service A calling Service B
// The deadline from the incoming call is automatically propagated
// to outgoing calls IF they run in the same gRPC Context

@Override
public void processRequest(Request request, StreamObserver<Response> responseObserver) {
    // Context.current() here contains the deadline from the caller
    // When you use the stub in the same thread, it inherits this context

    // This call automatically gets the remaining deadline from the incoming call
    ServiceBResponse bResponse = serviceBStub.doSomething(bRequest);
}
```

**Manually check if deadline exceeded:**

```java
@Override
public void longRunningOperation(Request request, StreamObserver<Response> responseObserver) {
    for (Item item : items) {
        // Check if client deadline has passed
        if (Context.current().isCancelled()) {
            responseObserver.onError(
                Status.CANCELLED.withDescription("Request cancelled by client").asRuntimeException()
            );
            return;
        }

        processItem(item);  // expensive operation
    }
}
```

### Handling deadline exceeded on client

```java
try {
    Response response = stub
        .withDeadlineAfter(5, TimeUnit.SECONDS)
        .someRpc(request);
} catch (StatusRuntimeException e) {
    if (e.getStatus().getCode() == Status.Code.DEADLINE_EXCEEDED) {
        log.warn("RPC timed out after 5 seconds");
        // retry, circuit break, or fail fast
    }
}
```

---

## Chapter 11: Error Handling Patterns

### Result wrapper pattern

Instead of throwing exceptions everywhere, wrap results:

```java
public class GrpcResult<T> {
    private final T value;
    private final Status error;

    private GrpcResult(T value, Status error) {
        this.value = value;
        this.error = error;
    }

    public static <T> GrpcResult<T> success(T value) {
        return new GrpcResult<>(value, null);
    }

    public static <T> GrpcResult<T> error(Status error) {
        return new GrpcResult<>(null, error);
    }

    public boolean isSuccess() { return error == null; }
    public T getValue() { return value; }
    public Status getError() { return error; }
}
```

### Global exception handler interceptor

```java
@Component
@GrpcGlobalServerInterceptor
@Order(Integer.MAX_VALUE)  // Run last — innermost interceptor
public class ExceptionHandlerInterceptor implements ServerInterceptor {

    @Override
    public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(
            ServerCall<ReqT, RespT> call,
            Metadata headers,
            ServerCallHandler<ReqT, RespT> next) {

        ServerCall.Listener<ReqT> listener = next.startCall(call, headers);

        return new ForwardingServerCallListener.SimpleForwardingServerCallListener<>(listener) {
            @Override
            public void onMessage(ReqT message) {
                try {
                    super.onMessage(message);
                } catch (Exception e) {
                    handleException(e, call, headers);
                }
            }
        };
    }

    private <RespT> void handleException(
            Exception e, ServerCall<?, RespT> call, Metadata headers) {
        Status status;

        if (e instanceof ValidationException) {
            status = Status.INVALID_ARGUMENT.withDescription(e.getMessage());
        } else if (e instanceof NotFoundException) {
            status = Status.NOT_FOUND.withDescription(e.getMessage());
        } else if (e instanceof UnauthorizedException) {
            status = Status.UNAUTHENTICATED.withDescription(e.getMessage());
        } else {
            log.error("Unhandled exception in gRPC call", e);
            status = Status.INTERNAL.withDescription("Internal server error");
        }

        call.close(status, headers);
    }
}
```

### Rich error details using `google.rpc.Status`

For richer error information, use the `google.rpc` package:

```java
// Add dependency:
// <dependency>
//     <groupId>com.google.api.grpc</groupId>
//     <artifactId>proto-google-common-protos</artifactId>
//     <version>2.37.1</version>
// </dependency>

import com.google.rpc.BadRequest;
import com.google.rpc.Code;
import io.grpc.protobuf.StatusProto;

// Server: rich validation error with field details
BadRequest badRequest = BadRequest.newBuilder()
        .addFieldViolations(BadRequest.FieldViolation.newBuilder()
                .setField("service_id")
                .setDescription("service_id cannot be empty")
                .build())
        .addFieldViolations(BadRequest.FieldViolation.newBuilder()
                .setField("port")
                .setDescription("port must be between 1 and 65535")
                .build())
        .build();

com.google.rpc.Status status = com.google.rpc.Status.newBuilder()
        .setCode(Code.INVALID_ARGUMENT_VALUE)
        .setMessage("Validation failed")
        .addDetails(Any.pack(badRequest))
        .build();

responseObserver.onError(StatusProto.toStatusRuntimeException(status));

// Client: unpack the rich error
try {
    // ...
} catch (StatusRuntimeException e) {
    com.google.rpc.Status grpcStatus = StatusProto.fromThrowable(e);
    if (grpcStatus != null) {
        for (Any detail : grpcStatus.getDetailsList()) {
            if (detail.is(BadRequest.class)) {
                BadRequest br = detail.unpack(BadRequest.class);
                br.getFieldViolationsList().forEach(v ->
                    System.out.println(v.getField() + ": " + v.getDescription())
                );
            }
        }
    }
}
```

---

## Chapter 12: gRPC Health Checks

The gRPC Health Checking Protocol is a standard — every production gRPC service should implement it. Load balancers and orchestrators (Kubernetes) use it.

### Standard health check proto (built-in)

```xml
<!-- Add to infra-proto/pom.xml -->
<dependency>
    <groupId>io.grpc</groupId>
    <artifactId>grpc-services</artifactId>
</dependency>
```

### Implementation with Spring Boot

```java
// grpc-spring-boot-starter includes health check support automatically
// Just configure it:

@Configuration
public class GrpcHealthConfig {

    @Bean
    public HealthStatusManager healthStatusManager() {
        return new HealthStatusManager();
    }
}
```

```yaml
# application.yml
grpc:
  server:
    port: 9091
  health-service:
    enabled: true    # auto-registers health check service
```

**Manual health status update:**

```java
@Service
@RequiredArgsConstructor
public class HealthReporter {

    private final HealthStatusManager healthStatusManager;

    @PostConstruct
    public void init() {
        // Set initial status to SERVING
        healthStatusManager.setStatus(
            "infra.health.v1.HealthService",
            HealthCheckResponse.ServingStatus.SERVING
        );
    }

    public void markDegraded(String reason) {
        log.warn("Service degraded: {}", reason);
        healthStatusManager.setStatus(
            "infra.health.v1.HealthService",
            HealthCheckResponse.ServingStatus.NOT_SERVING
        );
    }

    public void markHealthy() {
        healthStatusManager.setStatus(
            "infra.health.v1.HealthService",
            HealthCheckResponse.ServingStatus.SERVING
        );
    }
}
```

---

## Chapter 13: TLS/mTLS Configuration

**Never run gRPC in production without TLS.** Plaintext is only for local development.

### Server TLS

```yaml
# application.yml
grpc:
  server:
    port: 9091
    security:
      enabled: true
      certificate-chain: classpath:certs/server.crt
      private-key: classpath:certs/server.key
```

### Client TLS

```yaml
grpc:
  client:
    infra-health-service:
      address: static://prod-server:9091
      negotiation-type: tls           # tls (not plaintext)
      security:
        trust-cert-collection: classpath:certs/ca.crt
```

### Mutual TLS (mTLS) — both sides authenticate

```yaml
# Server
grpc:
  server:
    security:
      enabled: true
      certificate-chain: classpath:certs/server.crt
      private-key: classpath:certs/server.key
      client-auth: REQUIRE         # require client certificate
      trust-cert-collection: classpath:certs/ca.crt

# Client
grpc:
  client:
    infra-health-service:
      negotiation-type: tls
      security:
        certificate-chain: classpath:certs/client.crt
        private-key: classpath:certs/client.key
        trust-cert-collection: classpath:certs/ca.crt
```

### Generating self-signed certs for development

```bash
# Generate CA key and certificate
openssl genrsa -out ca.key 4096
openssl req -new -x509 -days 365 -key ca.key -out ca.crt \
  -subj "/CN=INFRA-CA"

# Generate server key and CSR
openssl genrsa -out server.key 4096
openssl req -new -key server.key -out server.csr \
  -subj "/CN=localhost"

# Sign server cert with CA
openssl x509 -req -days 365 -in server.csr \
  -CA ca.crt -CAkey ca.key -CAcreateserial \
  -out server.crt

# Convert key to PKCS8 (required by gRPC Java)
openssl pkcs8 -topk8 -nocrypt -in server.key -out server.key.pkcs8
```
# PART 3: ADVANCED TOPICS

---

## Chapter 14: Metadata (Headers)

Metadata in gRPC = HTTP headers. Used for: auth tokens, request IDs, tracing headers, custom context.

### Key types

```java
// ASCII key — value must be printable ASCII (no binary)
Metadata.Key<String> REQUEST_ID_KEY =
    Metadata.Key.of("x-request-id", Metadata.ASCII_STRING_MARSHALLER);

// Binary key — MUST end in "-bin", value is raw bytes (base64 encoded on wire)
Metadata.Key<byte[]> SIGNATURE_KEY =
    Metadata.Key.of("x-signature-bin", Metadata.BINARY_BYTE_MARSHALLER);

// Custom marshaller — for typed objects
Metadata.Key<UserId> USER_ID_KEY = Metadata.Key.of("x-user-id",
    new Metadata.AsciiMarshaller<UserId>() {
        @Override
        public String toAsciiString(UserId value) {
            return value.toString();
        }

        @Override
        public UserId parseAsciiString(String serialized) {
            return UserId.of(serialized);
        }
    });
```

### Sending metadata from client

```java
// Attach metadata to every call via interceptor (preferred)
public class RequestIdInterceptor implements ClientInterceptor {
    @Override
    public <ReqT, RespT> ClientCall<ReqT, RespT> interceptCall(
            MethodDescriptor<ReqT, RespT> method,
            CallOptions callOptions,
            Channel next) {

        return new ForwardingClientCall.SimpleForwardingClientCall<>(
                next.newCall(method, callOptions)) {
            @Override
            public void start(Listener<RespT> responseListener, Metadata headers) {
                headers.put(REQUEST_ID_KEY, UUID.randomUUID().toString());
                super.start(responseListener, headers);
            }
        };
    }
}

// Or per-call using ClientInterceptors
Metadata headers = new Metadata();
headers.put(REQUEST_ID_KEY, UUID.randomUUID().toString());

stub = MetadataUtils.attachHeaders(stub, headers);
Response response = stub.someRpc(request);
```

### Reading metadata on server

```java
@Override
public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(
        ServerCall<ReqT, RespT> call,
        Metadata headers,
        ServerCallHandler<ReqT, RespT> next) {

    String requestId = headers.get(REQUEST_ID_KEY);
    if (requestId == null) {
        requestId = UUID.randomUUID().toString();  // generate if missing
    }

    // Store in MDC for logging
    MDC.put("requestId", requestId);

    // Store in Context for service layer
    Context context = Context.current().withValue(REQUEST_ID_CONTEXT_KEY, requestId);
    return Contexts.interceptCall(context, call, headers, next);
}
```

### Sending metadata in response (trailers)

```java
// Server sends metadata back via trailers (sent at end of RPC)
@Override
public void registerService(
        RegisterServiceRequest request,
        StreamObserver<RegisterServiceResponse> responseObserver) {

    // Trailers are sent automatically when you call onCompleted()
    // To send custom trailers, wrap the ServerCall:
    // See interceptor pattern above — override sendHeaders() or close()
}
```

---

## Chapter 15: Retry Policy

Configure automatic retries for transient failures. This is configured on the channel, not in code.

### Retry configuration in `application.yml`

```yaml
grpc:
  client:
    infra-health-service:
      address: static://localhost:9091
      negotiation-type: plaintext
```

```java
// Configure retry via ManagedChannelBuilder (for non-Spring setup)
ManagedChannel channel = ManagedChannelBuilder
    .forAddress("localhost", 9091)
    .usePlaintext()
    .defaultServiceConfig(buildRetryConfig())
    .enableRetry()
    .build();

private Map<String, Object> buildRetryConfig() {
    Map<String, Object> retryPolicy = new HashMap<>();
    retryPolicy.put("maxAttempts", 3.0);
    retryPolicy.put("initialBackoff", "0.5s");
    retryPolicy.put("maxBackoff", "30s");
    retryPolicy.put("backoffMultiplier", 2.0);
    retryPolicy.put("retryableStatusCodes", List.of("UNAVAILABLE", "RESOURCE_EXHAUSTED"));

    Map<String, Object> methodConfig = new HashMap<>();
    methodConfig.put("name", List.of(Map.of()));  // applies to all methods
    methodConfig.put("retryPolicy", retryPolicy);

    Map<String, Object> serviceConfig = new HashMap<>();
    serviceConfig.put("methodConfig", List.of(methodConfig));

    return serviceConfig;
}
```

### Which status codes are safe to retry

```
UNAVAILABLE        → Yes — server temporarily down, safe to retry
RESOURCE_EXHAUSTED → Yes — rate limited, retry with backoff
DEADLINE_EXCEEDED  → Maybe — depends on idempotency of the operation
INTERNAL           → No — unknown state, don't retry blindly
NOT_FOUND          → No — retrying won't make it appear
INVALID_ARGUMENT   → No — request is wrong, retry won't fix it
```

**Non-idempotent operations (creates, payments) should NOT be retried automatically** — retrying could create duplicates. Use idempotency keys instead.

---

## Chapter 16: Load Balancing

gRPC supports client-side load balancing natively — no external load balancer needed for basic cases.

### Client-side load balancing

```yaml
# Static list of servers
grpc:
  client:
    infra-health-service:
      address: static://host1:9091,host2:9091,host3:9091
      negotiation-type: plaintext
      # Load balancing policy: round_robin or pick_first
```

```java
// Programmatic — round robin across multiple servers
ManagedChannel channel = ManagedChannelBuilder
    .forTarget("static://host1:9091,host2:9091,host3:9091")
    .defaultLoadBalancingPolicy("round_robin")
    .usePlaintext()
    .build();
```

### With service discovery (Consul/Eureka)

```yaml
grpc:
  client:
    infra-health-service:
      address: discovery:///infra-health-service  # consul/eureka resolves this
      negotiation-type: plaintext
```

```java
// Custom name resolver for Consul
// Implement io.grpc.NameResolver and io.grpc.NameResolverProvider
// Register with ManagedChannelBuilder
```

---

## Chapter 17: Channel Management

### Channel lifecycle

```java
// Creating a channel
ManagedChannel channel = ManagedChannelBuilder
    .forAddress("localhost", 9091)
    .usePlaintext()
    .keepAliveTime(60, TimeUnit.SECONDS)       // send keepalive ping every 60s
    .keepAliveTimeout(20, TimeUnit.SECONDS)    // wait 20s for pong before failing
    .keepAliveWithoutCalls(true)               // send keepalives even without active calls
    .maxInboundMessageSize(10 * 1024 * 1024)  // 10MB max message size
    .build();

// IMPORTANT: Channels are expensive — create once, share
// Never create a channel per request!

// Stubs are lightweight — create from channel as needed
HealthServiceGrpc.HealthServiceBlockingStub stub =
    HealthServiceGrpc.newBlockingStub(channel);

// Shutdown gracefully
channel.shutdown().awaitTermination(5, TimeUnit.SECONDS);
```

### With Spring — channels are managed for you

```java
// @GrpcClient creates and manages channels automatically
// Don't create ManagedChannel manually when using Spring Boot starter

@GrpcClient("infra-health-service")
private HealthServiceGrpc.HealthServiceBlockingStub stub;
// channel created once, reused for all calls, closed on app shutdown
```

---

## Chapter 18: Observability — Metrics, Tracing, Logging

### Micrometer metrics with gRPC

```xml
<!-- Add to service pom.xml -->
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

```java
// Custom metrics interceptor
@Component
@GrpcGlobalServerInterceptor
public class MetricsInterceptor implements ServerInterceptor {

    private final MeterRegistry meterRegistry;

    public MetricsInterceptor(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    @Override
    public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(
            ServerCall<ReqT, RespT> call,
            Metadata headers,
            ServerCallHandler<ReqT, RespT> next) {

        String method = call.getMethodDescriptor().getBareMethodName();
        String service = call.getMethodDescriptor().getServiceName();

        Timer.Sample sample = Timer.start(meterRegistry);

        ServerCall<ReqT, RespT> wrappedCall = new ForwardingServerCall
                .SimpleForwardingServerCall<>(call) {
            @Override
            public void close(Status status, Metadata trailers) {
                sample.stop(Timer.builder("grpc.server.calls")
                    .tag("service", service)
                    .tag("method", method)
                    .tag("status", status.getCode().name())
                    .description("gRPC server call duration")
                    .register(meterRegistry));

                meterRegistry.counter("grpc.server.calls.total",
                    "service", service,
                    "method", method,
                    "status", status.getCode().name()
                ).increment();

                super.close(status, trailers);
            }
        };

        return next.startCall(wrappedCall, headers);
    }
}
```

**Important:** Never use request/response data as metric tags — it creates unbounded cardinality and will OOM Prometheus. Only use: service name, method name, status code.

### Structured logging with MDC

```java
@Component
@GrpcGlobalServerInterceptor
@Order(1)  // Run first — sets up MDC before other interceptors
public class MdcInterceptor implements ServerInterceptor {

    @Override
    public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(
            ServerCall<ReqT, RespT> call,
            Metadata headers,
            ServerCallHandler<ReqT, RespT> next) {

        String requestId = Optional.ofNullable(
            headers.get(Metadata.Key.of("x-request-id", Metadata.ASCII_STRING_MARSHALLER))
        ).orElse(UUID.randomUUID().toString());

        String traceId = Optional.ofNullable(
            headers.get(Metadata.Key.of("x-trace-id", Metadata.ASCII_STRING_MARSHALLER))
        ).orElse(UUID.randomUUID().toString());

        MDC.put("requestId", requestId);
        MDC.put("traceId", traceId);
        MDC.put("grpcMethod", call.getMethodDescriptor().getBareMethodName());

        try {
            return next.startCall(call, headers);
        } finally {
            MDC.clear();
        }
    }
}
```

```yaml
# logback-spring.xml — structured JSON logging
<configuration>
  <appender name="JSON" class="ch.qos.logback.core.ConsoleAppender">
    <encoder class="net.logstash.logback.encoder.LogstashEncoder">
      <includeMdcKeyName>requestId</includeMdcKeyName>
      <includeMdcKeyName>traceId</includeMdcKeyName>
      <includeMdcKeyName>grpcMethod</includeMdcKeyName>
    </encoder>
  </appender>
  <root level="INFO">
    <appender-ref ref="JSON"/>
  </root>
</configuration>
```

### OpenTelemetry tracing

```xml
<dependency>
    <groupId>io.opentelemetry.instrumentation</groupId>
    <artifactId>opentelemetry-grpc-1.6</artifactId>
    <version>2.3.0-alpha</version>
</dependency>
```

```java
// Auto-instruments all gRPC calls with traces
OpenTelemetry openTelemetry = ...; // configured separately
GrpcTelemetry grpcTelemetry = GrpcTelemetry.create(openTelemetry);

// Server side
ServerInterceptor tracingInterceptor = grpcTelemetry.newServerInterceptor();

// Client side
ClientInterceptor clientTracingInterceptor = grpcTelemetry.newClientInterceptor();
```

---

## Chapter 19: Testing gRPC Services

### Unit testing with in-process server

```xml
<dependency>
    <groupId>io.grpc</groupId>
    <artifactId>grpc-testing</artifactId>
    <scope>test</scope>
</dependency>
```

```java
@ExtendWith(MockitoExtension.class)
class HealthServiceImplTest {

    @Mock
    private ServiceRegistrationRepository registrationRepository;

    @Mock
    private HeartbeatRepository heartbeatRepository;

    @InjectMocks
    private HealthServiceImpl healthServiceImpl;

    // gRPC in-process server — runs in memory, no network
    @RegisterExtension
    GrpcCleanupRule grpcCleanup = new GrpcCleanupRule();

    private HealthServiceGrpc.HealthServiceBlockingStub stub;

    @BeforeEach
    void setUp() throws Exception {
        String serverName = InProcessServerBuilder.generateName();

        // Start in-process server
        grpcCleanup.register(
            InProcessServerBuilder.forName(serverName)
                .directExecutor()
                .addService(healthServiceImpl)
                .build()
                .start()
        );

        // Create in-process client
        ManagedChannel channel = grpcCleanup.register(
            InProcessChannelBuilder.forName(serverName)
                .directExecutor()
                .build()
        );

        stub = HealthServiceGrpc.newBlockingStub(channel);
    }

    @Test
    void registerService_validRequest_returnsRegistrationId() {
        // Arrange
        RegisterServiceRequest request = RegisterServiceRequest.newBuilder()
                .setService(ServiceInfo.newBuilder()
                    .setServiceId("svc-123")
                    .setName("payment-service")
                    .setHost("localhost")
                    .setPort(8080)
                    .build())
                .setHeartbeatIntervalSeconds(30)
                .build();

        // Act
        RegisterServiceResponse response = stub.registerService(request);

        // Assert
        assertThat(response.getRegistrationId()).isNotBlank();
        verify(registrationRepository).save(any(ServiceRegistration.class));
    }

    @Test
    void getServiceStatus_nonExistentService_throwsNotFound() {
        // Arrange
        when(registrationRepository.findByServiceId("unknown"))
            .thenReturn(Optional.empty());

        GetServiceStatusRequest request = GetServiceStatusRequest.newBuilder()
                .setServiceId("unknown")
                .build();

        // Act + Assert
        StatusRuntimeException exception = assertThrows(
            StatusRuntimeException.class,
            () -> stub.getServiceStatus(request)
        );

        assertThat(exception.getStatus().getCode())
            .isEqualTo(Status.Code.NOT_FOUND);
        assertThat(exception.getStatus().getDescription())
            .contains("unknown");
    }

    @Test
    void registerService_emptyServiceId_throwsInvalidArgument() {
        RegisterServiceRequest request = RegisterServiceRequest.newBuilder()
                .setService(ServiceInfo.newBuilder().setServiceId("").build())
                .build();

        StatusRuntimeException ex = assertThrows(
            StatusRuntimeException.class,
            () -> stub.registerService(request)
        );

        assertThat(ex.getStatus().getCode()).isEqualTo(Status.Code.INVALID_ARGUMENT);
    }
}
```

### Testing interceptors

```java
@Test
void authInterceptor_missingToken_returnsUnauthenticated() {
    // Start server with auth interceptor
    String serverName = InProcessServerBuilder.generateName();
    grpcCleanup.register(
        InProcessServerBuilder.forName(serverName)
            .directExecutor()
            .addService(ServerInterceptors.intercept(
                healthServiceImpl,
                new AuthInterceptor(jwtService)
            ))
            .build()
            .start()
    );

    ManagedChannel channel = grpcCleanup.register(
        InProcessChannelBuilder.forName(serverName).directExecutor().build()
    );
    HealthServiceGrpc.HealthServiceBlockingStub stub =
        HealthServiceGrpc.newBlockingStub(channel);

    // Call without auth header
    StatusRuntimeException ex = assertThrows(
        StatusRuntimeException.class,
        () -> stub.getServiceStatus(GetServiceStatusRequest.newBuilder()
            .setServiceId("svc-1")
            .build())
    );

    assertThat(ex.getStatus().getCode()).isEqualTo(Status.Code.UNAUTHENTICATED);
}
```

### Testing server streaming

```java
@Test
void streamHeartbeats_returnsEvents() throws InterruptedException {
    List<HeartbeatEvent> received = new ArrayList<>();
    CountDownLatch latch = new CountDownLatch(1);

    asyncStub.streamHeartbeats(
        StreamHeartbeatsRequest.newBuilder()
            .setServiceId("svc-123")
            .setLastN(3)
            .build(),
        new StreamObserver<HeartbeatEvent>() {
            @Override
            public void onNext(HeartbeatEvent event) {
                received.add(event);
            }

            @Override
            public void onError(Throwable t) {
                latch.countDown();
            }

            @Override
            public void onCompleted() {
                latch.countDown();
            }
        }
    );

    assertTrue(latch.await(5, TimeUnit.SECONDS));
    assertThat(received).hasSize(3);
    assertThat(received.get(0).getServiceId()).isEqualTo("svc-123");
}
```

### Integration testing with Testcontainers

```java
@SpringBootTest
@Testcontainers
class HealthServiceIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16")
            .withDatabaseName("infra_health_test")
            .withUsername("test")
            .withPassword("test");

    @Container
    static GenericContainer<?> redis = new GenericContainer<>("redis:7")
            .withExposedPorts(6379);

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.data.redis.host", redis::getHost);
        registry.add("spring.data.redis.port", () -> redis.getMappedPort(6379));
    }

    @GrpcClient("infra-health-service")
    private HealthServiceGrpc.HealthServiceBlockingStub stub;

    @Test
    void fullRegistrationFlow_worksEndToEnd() {
        RegisterServiceResponse response = stub.registerService(
            RegisterServiceRequest.newBuilder()
                .setService(ServiceInfo.newBuilder()
                    .setServiceId("test-svc-" + UUID.randomUUID())
                    .setName("test-service")
                    .setHost("localhost")
                    .setPort(9999)
                    .build())
                .build()
        );

        assertThat(response.getRegistrationId()).isNotBlank();

        // Verify in DB
        ServiceStatusResponse status = stub.getServiceStatus(
            GetServiceStatusRequest.newBuilder()
                .setServiceId("test-svc")
                .build()
        );
        assertThat(status.getService().getName()).isEqualTo("test-service");
    }
}
```

---

## Chapter 20: gRPC Reflection

Reflection lets clients (like grpcurl, Postman) discover your service API at runtime without having the .proto files.

```xml
<dependency>
    <groupId>io.grpc</groupId>
    <artifactId>grpc-services</artifactId>
</dependency>
```

```yaml
# Enable reflection (disable in production for security)
grpc:
  server:
    reflection:
      enabled: true   # grpc-spring-boot-starter enables automatically
```

Or manually:

```java
@Bean
public ProtoReflectionService protoReflectionService() {
    return ProtoReflectionService.newInstance();
}
```

### Using grpcurl for testing (like curl for gRPC)

```bash
# Install grpcurl
brew install grpcurl   # macOS
# or download from https://github.com/fullstorydev/grpcurl

# List all services
grpcurl -plaintext localhost:9091 list

# List methods of a service
grpcurl -plaintext localhost:9091 list infra.health.v1.HealthService

# Describe a method
grpcurl -plaintext localhost:9091 describe infra.health.v1.HealthService.RegisterService

# Call a unary RPC
grpcurl -plaintext -d '{"service": {"serviceId": "svc-1", "name": "payment"}}' \
  localhost:9091 infra.health.v1.HealthService/RegisterService

# Call with headers (auth)
grpcurl -plaintext \
  -H "authorization: Bearer eyJhbG..." \
  -d '{"serviceId": "svc-1"}' \
  localhost:9091 infra.health.v1.HealthService/GetServiceStatus

# Server streaming
grpcurl -plaintext -d '{"serviceId": "svc-1", "lastN": 5}' \
  localhost:9091 infra.health.v1.HealthService/StreamHeartbeats
```

---

## Chapter 21: gRPC-Web and REST Gateway

Browsers cannot use gRPC directly (HTTP/2 trailers are not exposed by browsers). Two solutions:

### Option 1: grpc-gateway (proto annotation approach)

```protobuf
import "google/api/annotations.proto";

service HealthService {
  rpc GetServiceStatus (GetServiceStatusRequest) returns (ServiceStatusResponse) {
    option (google.api.http) = {
      get: "/v1/services/{service_id}/status"
    };
  }

  rpc RegisterService (RegisterServiceRequest) returns (RegisterServiceResponse) {
    option (google.api.http) = {
      post: "/v1/services"
      body: "*"
    };
  }
}
```

### Option 2: Manual REST-to-gRPC translation (our INFRA approach)

Build a Spring Boot gateway that exposes REST endpoints and internally calls gRPC services:

```java
@RestController
@RequestMapping("/api/v1/health")
@RequiredArgsConstructor
public class HealthController {

    private final HealthServiceClient healthClient;

    @GetMapping("/services/{serviceId}/status")
    public ResponseEntity<ServiceStatusDto> getStatus(@PathVariable String serviceId) {
        ServiceStatusResponse grpcResponse = healthClient.getStatus(serviceId);
        return ResponseEntity.ok(mapper.toDto(grpcResponse));
    }

    @PostMapping("/services")
    public ResponseEntity<RegisterServiceDto> register(
            @RequestBody @Valid RegisterServiceRequest request) {
        RegisterServiceResponse grpcResponse = healthClient.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(mapper.toDto(grpcResponse));
    }
}
```

---

## Chapter 22: Production Best Practices

### Never do these in production

```java
// ❌ Creating a channel per request
public void doSomething() {
    ManagedChannel channel = ManagedChannelBuilder.forAddress("host", 9091).build();
    stub.callRpc(request);
    // channel never closed → connection leak
}

// ❌ No deadline
stub.someRpc(request);  // hangs if server is slow/down

// ❌ Ignoring the returned StreamObserver from client streaming
@Override
public StreamObserver<LogEntry> streamLogs(StreamObserver<LogEntry> responseObserver) {
    return null;  // ← NPE on first message from client
}

// ❌ Not calling onCompleted() after onNext() in unary RPC
responseObserver.onNext(response);
// missing: responseObserver.onCompleted() ← client hangs forever

// ❌ Calling onNext() after onError()
responseObserver.onError(Status.NOT_FOUND.asRuntimeException());
responseObserver.onNext(response);  // ← IllegalStateException

// ❌ Blocking inside async callback
asyncStub.streamHeartbeats(request, new StreamObserver<HeartbeatEvent>() {
    @Override
    public void onNext(HeartbeatEvent event) {
        Thread.sleep(1000);  // ← blocks gRPC thread pool. Never do this.
    }
});

// ❌ Using entity ID as Prometheus tag
meterRegistry.counter("grpc.calls", "service_id", serviceId);
// serviceId has unbounded cardinality → OOMs Prometheus
```

### Always do these in production

```java
// ✅ Channel created once, shared
@Bean
@Singleton
public ManagedChannel healthServiceChannel() {
    return ManagedChannelBuilder.forAddress("host", 9091).usePlaintext().build();
}

// ✅ Always set deadline
stub.withDeadlineAfter(5, TimeUnit.SECONDS).someRpc(request);

// ✅ Check for cancellation in long operations
for (Item item : items) {
    if (Context.current().isCancelled()) {
        responseObserver.onError(Status.CANCELLED.asRuntimeException());
        return;
    }
    process(item);
}

// ✅ Always handle both onNext AND onCompleted for unary
responseObserver.onNext(response);
responseObserver.onCompleted();

// ✅ Return early after onError
if (something bad) {
    responseObserver.onError(Status.INTERNAL.asRuntimeException());
    return;   // ← don't forget this
}

// ✅ Use only low-cardinality tags for metrics
meterRegistry.counter("grpc.calls",
    "service", "HealthService",   // always finite
    "method", "RegisterService",  // always finite
    "status", status.getCode().name()  // always finite
);
```

### Configuration checklist for production

```yaml
grpc:
  server:
    port: 9091
    security:
      enabled: true                        # TLS enabled
      certificate-chain: ...
      private-key: ...
    max-inbound-message-size: 4194304      # 4MB — set explicitly
    max-inbound-metadata-size: 8192        # 8KB headers
    keep-alive-time: 30s
    keep-alive-timeout: 10s
    permit-keep-alive-without-calls: true

  client:
    target-service:
      negotiation-type: tls                # TLS for all client connections
      keep-alive-time: 60s
      keep-alive-timeout: 20s
      enable-keep-alive: true
      deadline: 5s                         # default deadline
```
# PART 4: THE INFRA PROJECT — COMPLETE IMPLEMENTATION

---

> This is the full production-ready project. Every concept from Parts 1–3 is used here.
> Build this, put it on GitHub, and it goes on your resume.

---

## Project Overview

**INFRA** is a gRPC-based Infrastructure Control Plane — 4 microservices that collectively handle:
- Health monitoring with real-time heartbeat streaming
- Deployment management with log ingestion
- Centralized log aggregation with live tailing
- Service discovery with Redis-backed lease management

```
infra/
├── pom.xml                        # parent
├── infra-proto/                   # generated code
├── infra-health-service/          # gRPC :9091
├── infra-deploy-service/          # gRPC :9092
├── infra-log-service/             # gRPC :9093
├── infra-discovery-service/       # gRPC :9094
└── infra-gateway/                 # REST :8080
```

---

## Database Schema

```sql
-- Run this in PostgreSQL before starting services
-- Or use Flyway migrations (shown below)

-- Health Service DB
CREATE DATABASE infra_health;
CREATE DATABASE infra_deploy;
CREATE DATABASE infra_log;
CREATE DATABASE infra_discovery;

-- infra_health schema
\c infra_health;

CREATE TABLE service_registrations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id          VARCHAR(255) NOT NULL UNIQUE,
    name                VARCHAR(255) NOT NULL,
    host                VARCHAR(255) NOT NULL,
    port                INTEGER NOT NULL,
    version             VARCHAR(50),
    tags                JSONB DEFAULT '{}',
    status              VARCHAR(50) NOT NULL DEFAULT 'UNKNOWN',
    heartbeat_interval  INTEGER NOT NULL DEFAULT 30,
    missed_heartbeats   INTEGER NOT NULL DEFAULT 0,
    registered_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    last_heartbeat_at   TIMESTAMP,
    CONSTRAINT port_range CHECK (port BETWEEN 1 AND 65535)
);

CREATE TABLE heartbeat_records (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id          VARCHAR(255) NOT NULL,
    status              VARCHAR(50) NOT NULL,
    cpu_percent         DOUBLE PRECISION,
    memory_percent      DOUBLE PRECISION,
    active_connections  BIGINT DEFAULT 0,
    recorded_at         TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT fk_service FOREIGN KEY (service_id)
        REFERENCES service_registrations(service_id) ON DELETE CASCADE
);

CREATE INDEX idx_heartbeat_service_id ON heartbeat_records(service_id);
CREATE INDEX idx_heartbeat_recorded_at ON heartbeat_records(recorded_at DESC);

-- infra_deploy schema
\c infra_deploy;

CREATE TABLE deployments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id      VARCHAR(255) NOT NULL,
    image_tag       VARCHAR(500) NOT NULL,
    environment     VARCHAR(50) NOT NULL,
    replicas        INTEGER NOT NULL DEFAULT 1,
    env_vars        JSONB DEFAULT '{}',
    status          VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMP,
    rolled_back_to  UUID REFERENCES deployments(id)
);

CREATE TABLE deploy_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deployment_id   UUID NOT NULL REFERENCES deployments(id) ON DELETE CASCADE,
    line            TEXT NOT NULL,
    level           VARCHAR(20) NOT NULL DEFAULT 'INFO',
    logged_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_deploy_logs_deployment_id ON deploy_logs(deployment_id);

-- infra_log schema
\c infra_log;

CREATE TABLE log_entries (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id  VARCHAR(255) NOT NULL,
    message     TEXT NOT NULL,
    severity    VARCHAR(20) NOT NULL,
    fields      JSONB DEFAULT '{}',
    logged_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_log_service_id ON log_entries(service_id);
CREATE INDEX idx_log_severity ON log_entries(severity);
CREATE INDEX idx_log_logged_at ON log_entries(logged_at DESC);
```

---

## Proto Files (Complete)

### `common/common.proto`

```protobuf
syntax = "proto3";
package infra.common.v1;

option java_package = "com.infra.common.v1";
option java_outer_classname = "CommonProto";
option java_multiple_files = true;

import "google/protobuf/timestamp.proto";

message ServiceInfo {
  string service_id = 1;
  string name = 2;
  string host = 3;
  int32  port = 4;
  string version = 5;
  map<string, string> tags = 6;
  google.protobuf.Timestamp registered_at = 7;
}

message ResponseMeta {
  string request_id = 1;
  google.protobuf.Timestamp timestamp = 2;
  string server_id = 3;
}

enum Environment {
  ENVIRONMENT_UNSPECIFIED = 0;
  ENVIRONMENT_DEV = 1;
  ENVIRONMENT_STAGING = 2;
  ENVIRONMENT_PROD = 3;
}
```

### `health/health_service.proto`

```protobuf
syntax = "proto3";
package infra.health.v1;

option java_package = "com.infra.health.v1";
option java_outer_classname = "HealthServiceProto";
option java_multiple_files = true;

import "google/protobuf/timestamp.proto";
import "google/protobuf/empty.proto";
import "common/common.proto";

message RegisterServiceRequest {
  infra.common.v1.ServiceInfo service = 1;
  int32 heartbeat_interval_seconds = 2;
}

message RegisterServiceResponse {
  string registration_id = 1;
  infra.common.v1.ResponseMeta meta = 2;
}

message HeartbeatRequest {
  string registration_id = 1;
  ServiceHealthStatus status = 2;
  double cpu_percent = 3;
  double memory_percent = 4;
  int64  active_connections = 5;
}

message HeartbeatResponse {
  bool acknowledged = 1;
  infra.common.v1.ResponseMeta meta = 2;
}

message StreamHeartbeatsRequest {
  string service_id = 1;
  int32  last_n = 2;
}

message HeartbeatEvent {
  string service_id = 1;
  ServiceHealthStatus status = 2;
  double cpu_percent = 3;
  double memory_percent = 4;
  int64  active_connections = 5;
  google.protobuf.Timestamp timestamp = 6;
}

message GetServiceStatusRequest {
  string service_id = 1;
}

message ServiceStatusResponse {
  infra.common.v1.ServiceInfo service = 1;
  ServiceHealthStatus status = 2;
  HeartbeatEvent last_heartbeat = 3;
  int32 missed_heartbeats = 4;
  infra.common.v1.ResponseMeta meta = 5;
}

enum ServiceHealthStatus {
  SERVICE_HEALTH_STATUS_UNSPECIFIED = 0;
  SERVICE_HEALTH_STATUS_HEALTHY = 1;
  SERVICE_HEALTH_STATUS_DEGRADED = 2;
  SERVICE_HEALTH_STATUS_DOWN = 3;
  SERVICE_HEALTH_STATUS_UNKNOWN = 4;
}

service HealthService {
  rpc RegisterService (RegisterServiceRequest) returns (RegisterServiceResponse);
  rpc SendHeartbeat   (HeartbeatRequest)       returns (HeartbeatResponse);
  rpc StreamHeartbeats(StreamHeartbeatsRequest) returns (stream HeartbeatEvent);
  rpc GetServiceStatus(GetServiceStatusRequest) returns (ServiceStatusResponse);
  rpc DeregisterService(GetServiceStatusRequest) returns (google.protobuf.Empty);
}
```

### `deploy/deploy_service.proto`

```protobuf
syntax = "proto3";
package infra.deploy.v1;

option java_package = "com.infra.deploy.v1";
option java_outer_classname = "DeployServiceProto";
option java_multiple_files = true;

import "google/protobuf/timestamp.proto";
import "common/common.proto";

message CreateDeploymentRequest {
  string service_id = 1;
  string image_tag   = 2;
  infra.common.v1.Environment environment = 3;
  map<string, string> env_vars = 4;
  int32 replicas = 5;
}

message CreateDeploymentResponse {
  string deployment_id = 1;
  DeploymentStatus status = 2;
  infra.common.v1.ResponseMeta meta = 3;
}

message DeployLogLine {
  string deployment_id = 1;
  string line = 2;
  LogLevel level = 3;
  google.protobuf.Timestamp timestamp = 4;
}

message DeployLogSummary {
  string deployment_id = 1;
  int32  total_lines = 2;
  bool   success = 3;
  string final_message = 4;
  google.protobuf.Timestamp completed_at = 5;
}

message RollbackRequest {
  string deployment_id = 1;
  string reason = 2;
}

message RollbackResponse {
  string new_deployment_id = 1;
  DeploymentStatus status = 2;
  infra.common.v1.ResponseMeta meta = 3;
}

message GetDeploymentRequest {
  string deployment_id = 1;
}

message DeploymentRecord {
  string deployment_id = 1;
  string service_id    = 2;
  string image_tag     = 3;
  infra.common.v1.Environment environment = 4;
  DeploymentStatus status = 5;
  google.protobuf.Timestamp created_at   = 6;
  google.protobuf.Timestamp completed_at = 7;
}

enum DeploymentStatus {
  DEPLOYMENT_STATUS_UNSPECIFIED  = 0;
  DEPLOYMENT_STATUS_PENDING      = 1;
  DEPLOYMENT_STATUS_RUNNING      = 2;
  DEPLOYMENT_STATUS_SUCCESS      = 3;
  DEPLOYMENT_STATUS_FAILED       = 4;
  DEPLOYMENT_STATUS_ROLLED_BACK  = 5;
}

enum LogLevel {
  LOG_LEVEL_UNSPECIFIED = 0;
  LOG_LEVEL_DEBUG = 1;
  LOG_LEVEL_INFO  = 2;
  LOG_LEVEL_WARN  = 3;
  LOG_LEVEL_ERROR = 4;
}

service DeployService {
  rpc CreateDeployment(CreateDeploymentRequest)  returns (CreateDeploymentResponse);
  rpc PushDeployLogs  (stream DeployLogLine)     returns (DeployLogSummary);
  rpc Rollback        (RollbackRequest)          returns (RollbackResponse);
  rpc GetDeployment   (GetDeploymentRequest)     returns (DeploymentRecord);
}
```

### `log/log_service.proto`

```protobuf
syntax = "proto3";
package infra.log.v1;

option java_package = "com.infra.log.v1";
option java_outer_classname = "LogServiceProto";
option java_multiple_files = true;

import "google/protobuf/timestamp.proto";

message LogEntry {
  string log_id    = 1;
  string service_id = 2;
  string message   = 3;
  LogSeverity severity = 4;
  map<string, string> fields = 5;
  google.protobuf.Timestamp timestamp = 6;
}

message LogFilter {
  string service_id = 1;
  LogSeverity min_severity = 2;
  google.protobuf.Timestamp from = 3;
  google.protobuf.Timestamp to   = 4;
  string contains = 5;
}

enum LogSeverity {
  LOG_SEVERITY_UNSPECIFIED = 0;
  LOG_SEVERITY_DEBUG = 1;
  LOG_SEVERITY_INFO  = 2;
  LOG_SEVERITY_WARN  = 3;
  LOG_SEVERITY_ERROR = 4;
  LOG_SEVERITY_FATAL = 5;
}

service LogService {
  rpc StreamLogs(stream LogEntry) returns (stream LogEntry);
}
```

### `discovery/discovery_service.proto`

```protobuf
syntax = "proto3";
package infra.discovery.v1;

option java_package = "com.infra.discovery.v1";
option java_outer_classname = "DiscoveryServiceProto";
option java_multiple_files = true;

import "google/protobuf/empty.proto";
import "common/common.proto";

message RegisterRequest {
  infra.common.v1.ServiceInfo service = 1;
  int32 ttl_seconds = 2;
}

message RegisterResponse {
  string lease_id = 1;
  infra.common.v1.ResponseMeta meta = 2;
}

message RenewLeaseRequest {
  string lease_id = 1;
}

message LookupRequest {
  string name = 1;
}

message LookupResponse {
  repeated infra.common.v1.ServiceInfo instances = 1;
  infra.common.v1.ResponseMeta meta = 2;
}

message ListAllResponse {
  repeated infra.common.v1.ServiceInfo services = 1;
  infra.common.v1.ResponseMeta meta = 2;
}

service DiscoveryService {
  rpc Register   (RegisterRequest)              returns (RegisterResponse);
  rpc RenewLease (RenewLeaseRequest)            returns (google.protobuf.Empty);
  rpc Lookup     (LookupRequest)                returns (LookupResponse);
  rpc ListAll    (google.protobuf.Empty)        returns (ListAllResponse);
  rpc Deregister (RenewLeaseRequest)            returns (google.protobuf.Empty);
}
```

---

## Health Service — Full Implementation

### `application.yml`

```yaml
spring:
  application:
    name: infra-health-service
  datasource:
    url: jdbc:postgresql://localhost:5432/infra_health
    username: postgres
    password: postgres
    hikari:
      maximum-pool-size: 10
      minimum-idle: 2
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
  data:
    redis:
      host: localhost
      port: 6379

grpc:
  server:
    port: 9091

server:
  port: 8091
```

### `InfraHealthServiceApplication.java`

```java
package com.infra.health;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class InfraHealthServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(InfraHealthServiceApplication.class, args);
    }
}
```

### `entity/ServiceRegistration.java`

```java
package com.infra.health.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "service_registrations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServiceRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private String serviceId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String host;

    @Column(nullable = false)
    private Integer port;

    private String version;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, String> tags;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private HealthStatus status;

    @Column(nullable = false)
    private Integer heartbeatInterval;

    @Column(nullable = false)
    @Builder.Default
    private Integer missedHeartbeats = 0;

    @Column(nullable = false)
    private LocalDateTime registeredAt;

    private LocalDateTime lastHeartbeatAt;

    public enum HealthStatus {
        HEALTHY, DEGRADED, DOWN, UNKNOWN
    }
}
```

### `entity/HeartbeatRecord.java`

```java
package com.infra.health.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "heartbeat_records")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HeartbeatRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String serviceId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ServiceRegistration.HealthStatus status;

    private Double cpuPercent;
    private Double memoryPercent;
    private Long activeConnections;

    @Column(nullable = false)
    private LocalDateTime recordedAt;
}
```

### `repository/ServiceRegistrationRepository.java`

```java
package com.infra.health.repository;

import com.infra.health.entity.ServiceRegistration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ServiceRegistrationRepository extends JpaRepository<ServiceRegistration, UUID> {

    Optional<ServiceRegistration> findByServiceId(String serviceId);

    boolean existsByServiceId(String serviceId);

    List<ServiceRegistration> findByStatus(ServiceRegistration.HealthStatus status);

    @Modifying
    @Query("UPDATE ServiceRegistration s SET s.missedHeartbeats = s.missedHeartbeats + 1 " +
           "WHERE s.lastHeartbeatAt < :threshold OR s.lastHeartbeatAt IS NULL")
    int incrementMissedHeartbeats(LocalDateTime threshold);

    @Modifying
    @Query("UPDATE ServiceRegistration s SET s.status = :status " +
           "WHERE s.missedHeartbeats >= :threshold")
    int markAsDownWhereMissedExceeds(ServiceRegistration.HealthStatus status, int threshold);
}
```

### `repository/HeartbeatRepository.java`

```java
package com.infra.health.repository;

import com.infra.health.entity.HeartbeatRecord;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface HeartbeatRepository extends JpaRepository<HeartbeatRecord, UUID> {

    List<HeartbeatRecord> findByServiceIdOrderByRecordedAtDesc(String serviceId, Pageable pageable);

    default List<HeartbeatRecord> findLatestByServiceId(String serviceId, int limit) {
        return findByServiceIdOrderByRecordedAtDesc(
            serviceId,
            org.springframework.data.domain.PageRequest.of(0, limit)
        );
    }
}
```

### `mapper/HealthMapper.java`

```java
package com.infra.health.mapper;

import com.google.protobuf.Timestamp;
import com.infra.common.v1.ServiceInfo;
import com.infra.health.entity.HeartbeatRecord;
import com.infra.health.entity.ServiceRegistration;
import com.infra.health.v1.HeartbeatEvent;
import com.infra.health.v1.ServiceHealthStatus;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Map;

@Component
public class HealthMapper {

    public ServiceInfo toProto(ServiceRegistration entity) {
        ServiceInfo.Builder builder = ServiceInfo.newBuilder()
                .setServiceId(entity.getServiceId())
                .setName(entity.getName())
                .setHost(entity.getHost())
                .setPort(entity.getPort());

        if (entity.getVersion() != null) {
            builder.setVersion(entity.getVersion());
        }
        if (entity.getTags() != null) {
            builder.putAllTags(entity.getTags());
        }
        if (entity.getRegisteredAt() != null) {
            builder.setRegisteredAt(toTimestamp(entity.getRegisteredAt()));
        }

        return builder.build();
    }

    public ServiceRegistration toEntity(ServiceInfo proto, int heartbeatInterval) {
        return ServiceRegistration.builder()
                .serviceId(proto.getServiceId())
                .name(proto.getName())
                .host(proto.getHost())
                .port(proto.getPort())
                .version(proto.getVersion().isEmpty() ? null : proto.getVersion())
                .tags(proto.getTagsMap().isEmpty() ? Map.of() : proto.getTagsMap())
                .status(ServiceRegistration.HealthStatus.UNKNOWN)
                .heartbeatInterval(heartbeatInterval)
                .missedHeartbeats(0)
                .registeredAt(LocalDateTime.now())
                .build();
    }

    public HeartbeatEvent toHeartbeatEvent(HeartbeatRecord record) {
        return HeartbeatEvent.newBuilder()
                .setServiceId(record.getServiceId())
                .setStatus(toProtoStatus(record.getStatus()))
                .setCpuPercent(record.getCpuPercent() != null ? record.getCpuPercent() : 0.0)
                .setMemoryPercent(record.getMemoryPercent() != null ? record.getMemoryPercent() : 0.0)
                .setActiveConnections(record.getActiveConnections() != null ? record.getActiveConnections() : 0L)
                .setTimestamp(toTimestamp(record.getRecordedAt()))
                .build();
    }

    public ServiceHealthStatus toProtoStatus(ServiceRegistration.HealthStatus status) {
        return switch (status) {
            case HEALTHY  -> ServiceHealthStatus.SERVICE_HEALTH_STATUS_HEALTHY;
            case DEGRADED -> ServiceHealthStatus.SERVICE_HEALTH_STATUS_DEGRADED;
            case DOWN     -> ServiceHealthStatus.SERVICE_HEALTH_STATUS_DOWN;
            case UNKNOWN  -> ServiceHealthStatus.SERVICE_HEALTH_STATUS_UNKNOWN;
        };
    }

    public ServiceRegistration.HealthStatus toEntityStatus(ServiceHealthStatus status) {
        return switch (status) {
            case SERVICE_HEALTH_STATUS_HEALTHY  -> ServiceRegistration.HealthStatus.HEALTHY;
            case SERVICE_HEALTH_STATUS_DEGRADED -> ServiceRegistration.HealthStatus.DEGRADED;
            case SERVICE_HEALTH_STATUS_DOWN     -> ServiceRegistration.HealthStatus.DOWN;
            default                             -> ServiceRegistration.HealthStatus.UNKNOWN;
        };
    }

    public Timestamp toTimestamp(LocalDateTime ldt) {
        Instant instant = ldt.toInstant(ZoneOffset.UTC);
        return Timestamp.newBuilder()
                .setSeconds(instant.getEpochSecond())
                .setNanos(instant.getNano())
                .build();
    }
}
```

### `service/HeartbeatEventBus.java`

```java
package com.infra.health.service;

import com.infra.health.v1.HeartbeatEvent;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Consumer;

/**
 * In-memory pub/sub for heartbeat events.
 * In production, replace with Redis Pub/Sub or Kafka for multi-instance deployments.
 */
@Slf4j
@Component
public class HeartbeatEventBus {

    // serviceId → Map<subscriptionId, listener>
    private final Map<String, Map<String, Consumer<HeartbeatEvent>>> subscribers =
            new ConcurrentHashMap<>();

    public String subscribe(String serviceId, Consumer<HeartbeatEvent> listener) {
        String subscriptionId = UUID.randomUUID().toString();
        subscribers
            .computeIfAbsent(serviceId, k -> new ConcurrentHashMap<>())
            .put(subscriptionId, listener);

        log.debug("New subscription {} for service {}", subscriptionId, serviceId);
        return subscriptionId;
    }

    public void unsubscribe(String subscriptionId) {
        subscribers.values().forEach(subs -> subs.remove(subscriptionId));
        log.debug("Unsubscribed {}", subscriptionId);
    }

    public void publish(String serviceId, HeartbeatEvent event) {
        Map<String, Consumer<HeartbeatEvent>> subs = subscribers.get(serviceId);
        if (subs == null || subs.isEmpty()) return;

        subs.forEach((subId, listener) -> {
            try {
                listener.accept(event);
            } catch (Exception e) {
                log.warn("Failed to deliver event to subscriber {}, removing", subId, e);
                subs.remove(subId);
            }
        });
    }
}
```

### `service/HealthMonitorService.java`

```java
package com.infra.health.service;

import com.infra.common.v1.ResponseMeta;
import com.infra.common.v1.ServiceInfo;
import com.infra.health.entity.HeartbeatRecord;
import com.infra.health.entity.ServiceRegistration;
import com.infra.health.mapper.HealthMapper;
import com.infra.health.repository.HeartbeatRepository;
import com.infra.health.repository.ServiceRegistrationRepository;
import com.infra.health.v1.*;
import com.google.protobuf.Timestamp;
import io.grpc.Status;
import io.grpc.StatusRuntimeException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class HealthMonitorService {

    private final ServiceRegistrationRepository registrationRepository;
    private final HeartbeatRepository heartbeatRepository;
    private final HeartbeatEventBus eventBus;
    private final HealthMapper mapper;

    @Transactional
    public RegisterServiceResponse register(RegisterServiceRequest request) {
        ServiceInfo serviceInfo = request.getService();

        if (serviceInfo.getServiceId().isBlank()) {
            throw Status.INVALID_ARGUMENT
                .withDescription("service_id cannot be empty")
                .asRuntimeException();
        }
        if (serviceInfo.getPort() < 1 || serviceInfo.getPort() > 65535) {
            throw Status.INVALID_ARGUMENT
                .withDescription("port must be between 1 and 65535")
                .asRuntimeException();
        }

        // Upsert — re-registration updates the existing record
        ServiceRegistration existing = registrationRepository
            .findByServiceId(serviceInfo.getServiceId())
            .orElse(null);

        ServiceRegistration registration;
        if (existing != null) {
            existing.setName(serviceInfo.getName());
            existing.setHost(serviceInfo.getHost());
            existing.setPort(serviceInfo.getPort());
            existing.setVersion(serviceInfo.getVersion());
            existing.setHeartbeatInterval(request.getHeartbeatIntervalSeconds() > 0
                ? request.getHeartbeatIntervalSeconds() : 30);
            existing.setMissedHeartbeats(0);
            existing.setStatus(ServiceRegistration.HealthStatus.UNKNOWN);
            registration = registrationRepository.save(existing);
        } else {
            registration = registrationRepository.save(
                mapper.toEntity(serviceInfo, request.getHeartbeatIntervalSeconds() > 0
                    ? request.getHeartbeatIntervalSeconds() : 30)
            );
        }

        log.info("Service registered: {} ({})", registration.getName(), registration.getServiceId());

        return RegisterServiceResponse.newBuilder()
                .setRegistrationId(registration.getId().toString())
                .setMeta(buildMeta())
                .build();
    }

    @Transactional
    public HeartbeatResponse sendHeartbeat(HeartbeatRequest request) {
        ServiceRegistration registration = findRegistrationById(request.getRegistrationId());

        // Save heartbeat record
        HeartbeatRecord record = HeartbeatRecord.builder()
                .serviceId(registration.getServiceId())
                .status(mapper.toEntityStatus(request.getStatus()))
                .cpuPercent(request.getCpuPercent())
                .memoryPercent(request.getMemoryPercent())
                .activeConnections(request.getActiveConnections())
                .recordedAt(LocalDateTime.now())
                .build();

        heartbeatRepository.save(record);

        // Update registration
        registration.setStatus(mapper.toEntityStatus(request.getStatus()));
        registration.setLastHeartbeatAt(LocalDateTime.now());
        registration.setMissedHeartbeats(0);
        registrationRepository.save(registration);

        // Publish to streaming subscribers
        eventBus.publish(registration.getServiceId(), mapper.toHeartbeatEvent(record));

        return HeartbeatResponse.newBuilder()
                .setAcknowledged(true)
                .setMeta(buildMeta())
                .build();
    }

    @Transactional(readOnly = true)
    public ServiceStatusResponse getServiceStatus(String serviceId) {
        ServiceRegistration registration = registrationRepository
            .findByServiceId(serviceId)
            .orElseThrow(() -> Status.NOT_FOUND
                .withDescription("Service not found: " + serviceId)
                .asRuntimeException());

        List<HeartbeatRecord> recent = heartbeatRepository
            .findLatestByServiceId(serviceId, 1);

        ServiceStatusResponse.Builder builder = ServiceStatusResponse.newBuilder()
                .setService(mapper.toProto(registration))
                .setStatus(mapper.toProtoStatus(registration.getStatus()))
                .setMissedHeartbeats(registration.getMissedHeartbeats())
                .setMeta(buildMeta());

        if (!recent.isEmpty()) {
            builder.setLastHeartbeat(mapper.toHeartbeatEvent(recent.get(0)));
        }

        return builder.build();
    }

    @Transactional(readOnly = true)
    public List<HeartbeatRecord> getHeartbeatHistory(String serviceId, int limit) {
        if (!registrationRepository.existsByServiceId(serviceId)) {
            throw Status.NOT_FOUND
                .withDescription("Service not found: " + serviceId)
                .asRuntimeException();
        }
        return heartbeatRepository.findLatestByServiceId(serviceId, Math.max(1, Math.min(limit, 100)));
    }

    @Transactional
    public void deregister(String serviceId) {
        ServiceRegistration registration = registrationRepository
            .findByServiceId(serviceId)
            .orElseThrow(() -> Status.NOT_FOUND
                .withDescription("Service not found: " + serviceId)
                .asRuntimeException());

        registrationRepository.delete(registration);
        log.info("Service deregistered: {}", serviceId);
    }

    // Scheduled job — runs every 30 seconds to detect dead services
    @Scheduled(fixedDelay = 30_000)
    @Transactional
    public void checkMissedHeartbeats() {
        LocalDateTime threshold = LocalDateTime.now().minusSeconds(60);
        int updated = registrationRepository.incrementMissedHeartbeats(threshold);
        int markedDown = registrationRepository.markAsDownWhereMissedExceeds(
            ServiceRegistration.HealthStatus.DOWN, 3
        );

        if (updated > 0 || markedDown > 0) {
            log.warn("Heartbeat check: {} missed, {} marked DOWN", updated, markedDown);
        }
    }

    private ServiceRegistration findRegistrationById(String registrationId) {
        try {
            UUID uuid = UUID.fromString(registrationId);
            return registrationRepository.findById(uuid)
                .orElseThrow(() -> Status.NOT_FOUND
                    .withDescription("Registration not found: " + registrationId)
                    .asRuntimeException());
        } catch (IllegalArgumentException e) {
            throw Status.INVALID_ARGUMENT
                .withDescription("Invalid registration_id format: " + registrationId)
                .asRuntimeException();
        }
    }

    private ResponseMeta buildMeta() {
        return ResponseMeta.newBuilder()
                .setRequestId(UUID.randomUUID().toString())
                .setTimestamp(Timestamp.newBuilder()
                    .setSeconds(System.currentTimeMillis() / 1000)
                    .build())
                .setServerId("infra-health-service")
                .build();
    }
}
```

### `grpc/HealthServiceImpl.java`

```java
package com.infra.health.grpc;

import com.google.protobuf.Empty;
import com.infra.health.mapper.HealthMapper;
import com.infra.health.service.HeartbeatEventBus;
import com.infra.health.service.HealthMonitorService;
import com.infra.health.v1.*;
import io.grpc.Context;
import io.grpc.Status;
import io.grpc.stub.ServerCallStreamObserver;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.server.service.GrpcService;

@Slf4j
@GrpcService
@RequiredArgsConstructor
public class HealthServiceImpl extends HealthServiceGrpc.HealthServiceImplBase {

    private final HealthMonitorService healthMonitorService;
    private final HeartbeatEventBus eventBus;
    private final HealthMapper mapper;

    @Override
    public void registerService(
            RegisterServiceRequest request,
            StreamObserver<RegisterServiceResponse> responseObserver) {
        try {
            RegisterServiceResponse response = healthMonitorService.register(request);
            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(mapException(e));
        }
    }

    @Override
    public void sendHeartbeat(
            HeartbeatRequest request,
            StreamObserver<HeartbeatResponse> responseObserver) {
        try {
            HeartbeatResponse response = healthMonitorService.sendHeartbeat(request);
            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(mapException(e));
        }
    }

    @Override
    public void streamHeartbeats(
            StreamHeartbeatsRequest request,
            StreamObserver<HeartbeatEvent> responseObserver) {

        String serviceId = request.getServiceId();

        if (serviceId.isBlank()) {
            responseObserver.onError(
                Status.INVALID_ARGUMENT.withDescription("service_id cannot be empty").asRuntimeException()
            );
            return;
        }

        // Cast to ServerCallStreamObserver for cancellation detection
        ServerCallStreamObserver<HeartbeatEvent> serverObserver =
            (ServerCallStreamObserver<HeartbeatEvent>) responseObserver;

        // Replay history if requested
        if (request.getLastN() > 0) {
            healthMonitorService.getHeartbeatHistory(serviceId, request.getLastN())
                .forEach(record -> {
                    if (!serverObserver.isCancelled()) {
                        serverObserver.onNext(mapper.toHeartbeatEvent(record));
                    }
                });
        }

        // Subscribe to live events
        String subscriptionId = eventBus.subscribe(serviceId, event -> {
            if (!serverObserver.isCancelled()) {
                serverObserver.onNext(event);
            }
        });

        // Clean up subscription when client disconnects
        serverObserver.setOnCancelHandler(() -> {
            log.debug("Client cancelled heartbeat stream for service {}", serviceId);
            eventBus.unsubscribe(subscriptionId);
        });

        // Keep stream open — don't call onCompleted() for infinite streams
        // Stream stays alive until client cancels or server restarts
    }

    @Override
    public void getServiceStatus(
            GetServiceStatusRequest request,
            StreamObserver<ServiceStatusResponse> responseObserver) {
        try {
            ServiceStatusResponse response = healthMonitorService.getServiceStatus(request.getServiceId());
            responseObserver.onNext(response);
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(mapException(e));
        }
    }

    @Override
    public void deregisterService(
            GetServiceStatusRequest request,
            StreamObserver<Empty> responseObserver) {
        try {
            healthMonitorService.deregister(request.getServiceId());
            responseObserver.onNext(Empty.getDefaultInstance());
            responseObserver.onCompleted();
        } catch (Exception e) {
            responseObserver.onError(mapException(e));
        }
    }

    private Throwable mapException(Exception e) {
        if (e instanceof io.grpc.StatusRuntimeException) {
            return e;  // already a gRPC status exception, pass through
        }
        log.error("Unexpected error in HealthService", e);
        return Status.INTERNAL
            .withDescription("Internal server error")
            .withCause(e)
            .asRuntimeException();
    }
}
```

---

## Deploy Service — Full Implementation

### `entity/Deployment.java`

```java
package com.infra.deploy.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "deployments")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Deployment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String serviceId;

    @Column(nullable = false)
    private String imageTag;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeployEnvironment environment;

    @Column(nullable = false)
    private Integer replicas;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, String> envVars;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DeployStatus status;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime completedAt;

    @ManyToOne
    @JoinColumn(name = "rolled_back_to")
    private Deployment rolledBackTo;

    public enum DeployStatus  { PENDING, RUNNING, SUCCESS, FAILED, ROLLED_BACK }
    public enum DeployEnvironment { DEV, STAGING, PROD }
}
```

### `grpc/DeployServiceImpl.java`

```java
package com.infra.deploy.grpc;

import com.infra.deploy.entity.Deployment;
import com.infra.deploy.repository.DeployLogRepository;
import com.infra.deploy.repository.DeploymentRepository;
import com.infra.deploy.v1.*;
import com.infra.common.v1.ResponseMeta;
import com.google.protobuf.Timestamp;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.server.service.GrpcService;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@GrpcService
@RequiredArgsConstructor
public class DeployServiceImpl extends DeployServiceGrpc.DeployServiceImplBase {

    private final DeploymentRepository deploymentRepository;
    private final DeployLogRepository deployLogRepository;

    @Override
    public void createDeployment(
            CreateDeploymentRequest request,
            StreamObserver<CreateDeploymentResponse> responseObserver) {

        if (request.getServiceId().isBlank()) {
            responseObserver.onError(Status.INVALID_ARGUMENT
                .withDescription("service_id cannot be empty").asRuntimeException());
            return;
        }
        if (request.getImageTag().isBlank()) {
            responseObserver.onError(Status.INVALID_ARGUMENT
                .withDescription("image_tag cannot be empty").asRuntimeException());
            return;
        }

        Deployment deployment = Deployment.builder()
                .serviceId(request.getServiceId())
                .imageTag(request.getImageTag())
                .environment(mapEnvironment(request.getEnvironment()))
                .replicas(request.getReplicas() > 0 ? request.getReplicas() : 1)
                .envVars(request.getEnvVarsMap())
                .status(Deployment.DeployStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        deployment = deploymentRepository.save(deployment);
        log.info("Deployment created: {} for service {}", deployment.getId(), deployment.getServiceId());

        responseObserver.onNext(CreateDeploymentResponse.newBuilder()
                .setDeploymentId(deployment.getId().toString())
                .setStatus(DeploymentStatus.DEPLOYMENT_STATUS_PENDING)
                .setMeta(buildMeta())
                .build());
        responseObserver.onCompleted();
    }

    @Override
    public StreamObserver<DeployLogLine> pushDeployLogs(
            StreamObserver<DeployLogSummary> responseObserver) {

        return new StreamObserver<DeployLogLine>() {

            private String deploymentId = null;
            private final List<com.infra.deploy.entity.DeployLog> collected = new ArrayList<>();
            private boolean hasError = false;
            private int lineCount = 0;

            @Override
            public void onNext(DeployLogLine line) {
                if (deploymentId == null) {
                    deploymentId = line.getDeploymentId();
                }

                lineCount++;
                if (line.getLevel() == LogLevel.LOG_LEVEL_ERROR) {
                    hasError = true;
                }

                com.infra.deploy.entity.DeployLog logEntity =
                    com.infra.deploy.entity.DeployLog.builder()
                        .deploymentId(UUID.fromString(line.getDeploymentId()))
                        .line(line.getLine())
                        .level(line.getLevel().name())
                        .loggedAt(LocalDateTime.now())
                        .build();

                collected.add(logEntity);

                // Batch save every 50 lines for efficiency
                if (collected.size() >= 50) {
                    deployLogRepository.saveAll(collected);
                    collected.clear();
                }
            }

            @Override
            public void onError(Throwable t) {
                log.error("Client error during log push for deployment {}", deploymentId, t);
                if (!collected.isEmpty()) {
                    deployLogRepository.saveAll(collected);
                }
            }

            @Override
            public void onCompleted() {
                // Save remaining logs
                if (!collected.isEmpty()) {
                    deployLogRepository.saveAll(collected);
                }

                // Update deployment status
                if (deploymentId != null) {
                    deploymentRepository.findById(UUID.fromString(deploymentId))
                        .ifPresent(deployment -> {
                            deployment.setStatus(hasError
                                ? Deployment.DeployStatus.FAILED
                                : Deployment.DeployStatus.SUCCESS);
                            deployment.setCompletedAt(LocalDateTime.now());
                            deploymentRepository.save(deployment);
                        });
                }

                responseObserver.onNext(DeployLogSummary.newBuilder()
                        .setDeploymentId(deploymentId != null ? deploymentId : "unknown")
                        .setTotalLines(lineCount)
                        .setSuccess(!hasError)
                        .setFinalMessage(hasError ? "Deployment failed" : "Deployment succeeded")
                        .setCompletedAt(Timestamp.newBuilder()
                            .setSeconds(System.currentTimeMillis() / 1000)
                            .build())
                        .build());

                responseObserver.onCompleted();
            }
        };
    }

    @Override
    public void rollback(
            RollbackRequest request,
            StreamObserver<RollbackResponse> responseObserver) {

        Deployment original = deploymentRepository
            .findById(UUID.fromString(request.getDeploymentId()))
            .orElseThrow(() -> Status.NOT_FOUND
                .withDescription("Deployment not found: " + request.getDeploymentId())
                .asRuntimeException());

        Deployment rollback = Deployment.builder()
                .serviceId(original.getServiceId())
                .imageTag(original.getImageTag())
                .environment(original.getEnvironment())
                .replicas(original.getReplicas())
                .envVars(original.getEnvVars())
                .status(Deployment.DeployStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .rolledBackTo(original)
                .build();

        rollback = deploymentRepository.save(rollback);

        // Mark original as rolled back
        original.setStatus(Deployment.DeployStatus.ROLLED_BACK);
        deploymentRepository.save(original);

        log.info("Rollback initiated: {} → {}", request.getDeploymentId(), rollback.getId());

        responseObserver.onNext(RollbackResponse.newBuilder()
                .setNewDeploymentId(rollback.getId().toString())
                .setStatus(DeploymentStatus.DEPLOYMENT_STATUS_PENDING)
                .setMeta(buildMeta())
                .build());
        responseObserver.onCompleted();
    }

    @Override
    public void getDeployment(
            GetDeploymentRequest request,
            StreamObserver<DeploymentRecord> responseObserver) {

        Deployment deployment = deploymentRepository
            .findById(UUID.fromString(request.getDeploymentId()))
            .orElseThrow(() -> Status.NOT_FOUND
                .withDescription("Deployment not found: " + request.getDeploymentId())
                .asRuntimeException());

        responseObserver.onNext(toProto(deployment));
        responseObserver.onCompleted();
    }

    private DeploymentRecord toProto(Deployment d) {
        DeploymentRecord.Builder builder = DeploymentRecord.newBuilder()
                .setDeploymentId(d.getId().toString())
                .setServiceId(d.getServiceId())
                .setImageTag(d.getImageTag())
                .setStatus(mapStatus(d.getStatus()))
                .setCreatedAt(toTimestamp(d.getCreatedAt()));

        if (d.getCompletedAt() != null) {
            builder.setCompletedAt(toTimestamp(d.getCompletedAt()));
        }

        return builder.build();
    }

    private Timestamp toTimestamp(LocalDateTime ldt) {
        return Timestamp.newBuilder()
            .setSeconds(ldt.toEpochSecond(ZoneOffset.UTC))
            .build();
    }

    private DeploymentStatus mapStatus(Deployment.DeployStatus s) {
        return switch (s) {
            case PENDING     -> DeploymentStatus.DEPLOYMENT_STATUS_PENDING;
            case RUNNING     -> DeploymentStatus.DEPLOYMENT_STATUS_RUNNING;
            case SUCCESS     -> DeploymentStatus.DEPLOYMENT_STATUS_SUCCESS;
            case FAILED      -> DeploymentStatus.DEPLOYMENT_STATUS_FAILED;
            case ROLLED_BACK -> DeploymentStatus.DEPLOYMENT_STATUS_ROLLED_BACK;
        };
    }

    private Deployment.DeployEnvironment mapEnvironment(com.infra.common.v1.Environment env) {
        return switch (env) {
            case ENVIRONMENT_STAGING -> Deployment.DeployEnvironment.STAGING;
            case ENVIRONMENT_PROD    -> Deployment.DeployEnvironment.PROD;
            default                  -> Deployment.DeployEnvironment.DEV;
        };
    }

    private ResponseMeta buildMeta() {
        return ResponseMeta.newBuilder()
                .setRequestId(UUID.randomUUID().toString())
                .setTimestamp(Timestamp.newBuilder()
                    .setSeconds(System.currentTimeMillis() / 1000).build())
                .setServerId("infra-deploy-service")
                .build();
    }
}
```

---

## Discovery Service — Full Implementation

### `grpc/DiscoveryServiceImpl.java`

```java
package com.infra.discovery.grpc;

import com.google.protobuf.Empty;
import com.infra.common.v1.ResponseMeta;
import com.infra.common.v1.ServiceInfo;
import com.infra.discovery.v1.*;
import com.google.protobuf.Timestamp;
import io.grpc.Status;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.server.service.GrpcService;
import org.springframework.data.redis.core.RedisTemplate;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Slf4j
@GrpcService
@RequiredArgsConstructor
public class DiscoveryServiceImpl extends DiscoveryServiceGrpc.DiscoveryServiceImplBase {

    private final RedisTemplate<String, String> redisTemplate;

    private static final String SERVICE_KEY_PREFIX = "discovery:service:";
    private static final String SERVICE_INDEX_KEY  = "discovery:services";
    private static final int DEFAULT_TTL_SECONDS   = 30;

    @Override
    public void register(RegisterRequest request, StreamObserver<RegisterResponse> responseObserver) {
        ServiceInfo service = request.getService();

        if (service.getServiceId().isBlank() || service.getName().isBlank()) {
            responseObserver.onError(Status.INVALID_ARGUMENT
                .withDescription("service_id and name are required").asRuntimeException());
            return;
        }

        String leaseId = UUID.randomUUID().toString();
        int ttl = request.getTtlSeconds() > 0 ? request.getTtlSeconds() : DEFAULT_TTL_SECONDS;

        // Store service info as JSON in Redis with TTL
        String key = SERVICE_KEY_PREFIX + service.getServiceId();
        String value = serializeService(service, leaseId);

        redisTemplate.opsForValue().set(key, value, Duration.ofSeconds(ttl));
        redisTemplate.opsForSet().add(SERVICE_INDEX_KEY, service.getServiceId());

        log.info("Service registered in discovery: {} (TTL: {}s)", service.getServiceId(), ttl);

        responseObserver.onNext(RegisterResponse.newBuilder()
                .setLeaseId(leaseId)
                .setMeta(buildMeta())
                .build());
        responseObserver.onCompleted();
    }

    @Override
    public void renewLease(RenewLeaseRequest request, StreamObserver<Empty> responseObserver) {
        // Find the service entry with this leaseId and reset its TTL
        Set<String> serviceIds = redisTemplate.opsForSet().members(SERVICE_INDEX_KEY);
        if (serviceIds != null) {
            for (String serviceId : serviceIds) {
                String key = SERVICE_KEY_PREFIX + serviceId;
                String value = redisTemplate.opsForValue().get(key);
                if (value != null && value.contains(request.getLeaseId())) {
                    redisTemplate.expire(key, DEFAULT_TTL_SECONDS, TimeUnit.SECONDS);
                    responseObserver.onNext(Empty.getDefaultInstance());
                    responseObserver.onCompleted();
                    return;
                }
            }
        }

        responseObserver.onError(Status.NOT_FOUND
            .withDescription("Lease not found: " + request.getLeaseId()).asRuntimeException());
    }

    @Override
    public void lookup(LookupRequest request, StreamObserver<LookupResponse> responseObserver) {
        List<ServiceInfo> instances = new ArrayList<>();

        Set<String> allServiceIds = redisTemplate.opsForSet().members(SERVICE_INDEX_KEY);
        if (allServiceIds != null) {
            for (String serviceId : allServiceIds) {
                String key = SERVICE_KEY_PREFIX + serviceId;
                String value = redisTemplate.opsForValue().get(key);

                if (value != null) {
                    ServiceInfo info = deserializeService(value);
                    if (info.getName().equals(request.getName())) {
                        instances.add(info);
                    }
                } else {
                    // TTL expired — remove from index
                    redisTemplate.opsForSet().remove(SERVICE_INDEX_KEY, serviceId);
                }
            }
        }

        responseObserver.onNext(LookupResponse.newBuilder()
                .addAllInstances(instances)
                .setMeta(buildMeta())
                .build());
        responseObserver.onCompleted();
    }

    @Override
    public void listAll(Empty request, StreamObserver<ListAllResponse> responseObserver) {
        List<ServiceInfo> services = new ArrayList<>();

        Set<String> allServiceIds = redisTemplate.opsForSet().members(SERVICE_INDEX_KEY);
        if (allServiceIds != null) {
            for (String serviceId : allServiceIds) {
                String value = redisTemplate.opsForValue().get(SERVICE_KEY_PREFIX + serviceId);
                if (value != null) {
                    services.add(deserializeService(value));
                } else {
                    redisTemplate.opsForSet().remove(SERVICE_INDEX_KEY, serviceId);
                }
            }
        }

        responseObserver.onNext(ListAllResponse.newBuilder()
                .addAllServices(services)
                .setMeta(buildMeta())
                .build());
        responseObserver.onCompleted();
    }

    @Override
    public void deregister(RenewLeaseRequest request, StreamObserver<Empty> responseObserver) {
        Set<String> serviceIds = redisTemplate.opsForSet().members(SERVICE_INDEX_KEY);
        if (serviceIds != null) {
            for (String serviceId : serviceIds) {
                String key = SERVICE_KEY_PREFIX + serviceId;
                String value = redisTemplate.opsForValue().get(key);
                if (value != null && value.contains(request.getLeaseId())) {
                    redisTemplate.delete(key);
                    redisTemplate.opsForSet().remove(SERVICE_INDEX_KEY, serviceId);
                    log.info("Service deregistered from discovery: {}", serviceId);
                    responseObserver.onNext(Empty.getDefaultInstance());
                    responseObserver.onCompleted();
                    return;
                }
            }
        }

        responseObserver.onError(Status.NOT_FOUND
            .withDescription("Lease not found: " + request.getLeaseId()).asRuntimeException());
    }

    private String serializeService(ServiceInfo service, String leaseId) {
        // Simple serialization — in production use Jackson
        return String.format("%s|%s|%s|%d|%s|%s",
            service.getServiceId(),
            service.getName(),
            service.getHost(),
            service.getPort(),
            service.getVersion(),
            leaseId
        );
    }

    private ServiceInfo deserializeService(String value) {
        String[] parts = value.split("\\|", 6);
        if (parts.length < 4) return ServiceInfo.getDefaultInstance();

        return ServiceInfo.newBuilder()
                .setServiceId(parts[0])
                .setName(parts[1])
                .setHost(parts[2])
                .setPort(Integer.parseInt(parts[3]))
                .setVersion(parts.length > 4 ? parts[4] : "")
                .build();
    }

    private ResponseMeta buildMeta() {
        return ResponseMeta.newBuilder()
                .setRequestId(UUID.randomUUID().toString())
                .setTimestamp(Timestamp.newBuilder()
                    .setSeconds(System.currentTimeMillis() / 1000).build())
                .setServerId("infra-discovery-service")
                .build();
    }
}
```

---

## Log Service — Full Implementation

### `grpc/LogServiceImpl.java`

```java
package com.infra.log.grpc;

import com.infra.log.entity.LogEntry;
import com.infra.log.repository.LogEntryRepository;
import com.infra.log.v1.*;
import io.grpc.stub.ServerCallStreamObserver;
import io.grpc.stub.StreamObserver;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.server.service.GrpcService;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Consumer;

@Slf4j
@GrpcService
@RequiredArgsConstructor
public class LogServiceImpl extends LogServiceGrpc.LogServiceImplBase {

    private final LogEntryRepository logEntryRepository;

    // Active log subscribers: serviceId → list of observers
    private final ConcurrentHashMap<String, CopyOnWriteArrayList<StreamObserver<com.infra.log.v1.LogEntry>>>
            subscribers = new ConcurrentHashMap<>();

    @Override
    public StreamObserver<com.infra.log.v1.LogEntry> streamLogs(
            StreamObserver<com.infra.log.v1.LogEntry> responseObserver) {

        ServerCallStreamObserver<com.infra.log.v1.LogEntry> serverObserver =
            (ServerCallStreamObserver<com.infra.log.v1.LogEntry>) responseObserver;

        return new StreamObserver<com.infra.log.v1.LogEntry>() {

            private String subscribedServiceId = null;

            @Override
            public void onNext(com.infra.log.v1.LogEntry entry) {
                // 1. Persist incoming log
                persist(entry);

                // 2. Register subscriber on first message (subscribe to their own service logs)
                if (subscribedServiceId == null) {
                    subscribedServiceId = entry.getServiceId();
                    subscribe(subscribedServiceId, serverObserver);
                }

                // 3. Fan out to all subscribers of this service
                fanOut(entry);
            }

            @Override
            public void onError(Throwable t) {
                log.error("Client log stream error", t);
                cleanup();
            }

            @Override
            public void onCompleted() {
                cleanup();
                responseObserver.onCompleted();
            }

            private void cleanup() {
                if (subscribedServiceId != null) {
                    unsubscribe(subscribedServiceId, serverObserver);
                }
            }
        };
    }

    private void persist(com.infra.log.v1.LogEntry entry) {
        LogEntry entity = LogEntry.builder()
                .serviceId(entry.getServiceId())
                .message(entry.getMessage())
                .severity(entry.getSeverity().name())
                .loggedAt(LocalDateTime.now())
                .build();

        logEntryRepository.save(entity);
    }

    private void fanOut(com.infra.log.v1.LogEntry entry) {
        CopyOnWriteArrayList<StreamObserver<com.infra.log.v1.LogEntry>> subs =
            subscribers.get(entry.getServiceId());

        if (subs == null) return;

        // Only fan out WARN and above
        if (entry.getSeverity().getNumber() < LogSeverity.LOG_SEVERITY_WARN.getNumber()) {
            return;
        }

        subs.forEach(observer -> {
            try {
                observer.onNext(entry);
            } catch (Exception e) {
                log.warn("Failed to deliver log to subscriber, removing", e);
                subs.remove(observer);
            }
        });
    }

    private void subscribe(String serviceId, StreamObserver<com.infra.log.v1.LogEntry> observer) {
        subscribers.computeIfAbsent(serviceId, k -> new CopyOnWriteArrayList<>()).add(observer);
    }

    private void unsubscribe(String serviceId, StreamObserver<com.infra.log.v1.LogEntry> observer) {
        CopyOnWriteArrayList<StreamObserver<com.infra.log.v1.LogEntry>> subs =
            subscribers.get(serviceId);
        if (subs != null) {
            subs.remove(observer);
        }
    }
}
```

---

## Gateway Service — Full Implementation

### `pom.xml` (gateway)

```xml
<dependencies>
    <dependency>
        <groupId>com.infra</groupId>
        <artifactId>infra-proto</artifactId>
    </dependency>
    <dependency>
        <groupId>net.devh</groupId>
        <artifactId>grpc-client-spring-boot-starter</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
</dependencies>
```

### `application.yml` (gateway)

```yaml
spring:
  application:
    name: infra-gateway

server:
  port: 8080

grpc:
  client:
    infra-health-service:
      address: static://localhost:9091
      negotiation-type: plaintext
    infra-deploy-service:
      address: static://localhost:9092
      negotiation-type: plaintext
    infra-log-service:
      address: static://localhost:9093
      negotiation-type: plaintext
    infra-discovery-service:
      address: static://localhost:9094
      negotiation-type: plaintext
```

### `controller/HealthController.java`

```java
package com.infra.gateway.controller;

import com.infra.gateway.dto.*;
import com.infra.health.v1.*;
import io.grpc.StatusRuntimeException;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.client.inject.GrpcClient;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.concurrent.TimeUnit;

@Slf4j
@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    @GrpcClient("infra-health-service")
    private HealthServiceGrpc.HealthServiceBlockingStub healthStub;

    @PostMapping("/services")
    public ResponseEntity<?> registerService(@RequestBody RegisterServiceDto dto) {
        try {
            RegisterServiceResponse response = healthStub
                .withDeadlineAfter(5, TimeUnit.SECONDS)
                .registerService(dto.toProto());

            return ResponseEntity.status(HttpStatus.CREATED)
                .body(new RegisterServiceResponseDto(response.getRegistrationId()));

        } catch (StatusRuntimeException e) {
            return handleGrpcError(e);
        }
    }

    @GetMapping("/services/{serviceId}/status")
    public ResponseEntity<?> getServiceStatus(@PathVariable String serviceId) {
        try {
            ServiceStatusResponse response = healthStub
                .withDeadlineAfter(5, TimeUnit.SECONDS)
                .getServiceStatus(
                    GetServiceStatusRequest.newBuilder().setServiceId(serviceId).build()
                );

            return ResponseEntity.ok(ServiceStatusDto.fromProto(response));

        } catch (StatusRuntimeException e) {
            return handleGrpcError(e);
        }
    }

    @PostMapping("/services/{registrationId}/heartbeat")
    public ResponseEntity<?> sendHeartbeat(
            @PathVariable String registrationId,
            @RequestBody HeartbeatDto dto) {
        try {
            HeartbeatResponse response = healthStub
                .withDeadlineAfter(3, TimeUnit.SECONDS)
                .sendHeartbeat(dto.toProto(registrationId));

            return ResponseEntity.ok(new HeartbeatResponseDto(response.getAcknowledged()));

        } catch (StatusRuntimeException e) {
            return handleGrpcError(e);
        }
    }

    @DeleteMapping("/services/{serviceId}")
    public ResponseEntity<?> deregisterService(@PathVariable String serviceId) {
        try {
            healthStub.withDeadlineAfter(5, TimeUnit.SECONDS)
                .deregisterService(
                    GetServiceStatusRequest.newBuilder().setServiceId(serviceId).build()
                );
            return ResponseEntity.noContent().build();
        } catch (StatusRuntimeException e) {
            return handleGrpcError(e);
        }
    }

    private ResponseEntity<?> handleGrpcError(StatusRuntimeException e) {
        return switch (e.getStatus().getCode()) {
            case NOT_FOUND          -> ResponseEntity.notFound().build();
            case INVALID_ARGUMENT   -> ResponseEntity.badRequest()
                .body(new ErrorDto(e.getStatus().getDescription()));
            case ALREADY_EXISTS     -> ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorDto(e.getStatus().getDescription()));
            case UNAUTHENTICATED    -> ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorDto("Authentication required"));
            case DEADLINE_EXCEEDED  -> ResponseEntity.status(HttpStatus.REQUEST_TIMEOUT)
                .body(new ErrorDto("Service timeout"));
            default                 -> ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorDto("Internal error: " + e.getStatus().getCode()));
        };
    }
}
```

### `controller/DeployController.java`

```java
package com.infra.gateway.controller;

import com.infra.deploy.v1.*;
import com.infra.gateway.dto.*;
import io.grpc.StatusRuntimeException;
import net.devh.boot.grpc.client.inject.GrpcClient;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

@RestController
@RequestMapping("/api/v1/deploy")
public class DeployController {

    @GrpcClient("infra-deploy-service")
    private DeployServiceGrpc.DeployServiceBlockingStub deployBlockingStub;

    @GrpcClient("infra-deploy-service")
    private DeployServiceGrpc.DeployServiceStub deployAsyncStub;

    @PostMapping("/deployments")
    public ResponseEntity<?> createDeployment(@RequestBody CreateDeploymentDto dto) {
        try {
            CreateDeploymentResponse response = deployBlockingStub
                .withDeadlineAfter(10, TimeUnit.SECONDS)
                .createDeployment(dto.toProto());

            return ResponseEntity.status(HttpStatus.CREATED)
                .body(new DeploymentResponseDto(response.getDeploymentId(),
                    response.getStatus().name()));
        } catch (StatusRuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorDto(e.getStatus().getDescription()));
        }
    }

    @PostMapping("/deployments/{deploymentId}/rollback")
    public ResponseEntity<?> rollback(
            @PathVariable String deploymentId,
            @RequestBody RollbackDto dto) {
        try {
            RollbackResponse response = deployBlockingStub
                .withDeadlineAfter(10, TimeUnit.SECONDS)
                .rollback(RollbackRequest.newBuilder()
                    .setDeploymentId(deploymentId)
                    .setReason(dto.getReason())
                    .build());

            return ResponseEntity.ok(new DeploymentResponseDto(
                response.getNewDeploymentId(), response.getStatus().name()));
        } catch (StatusRuntimeException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorDto(e.getStatus().getDescription()));
        }
    }

    @GetMapping("/deployments/{deploymentId}")
    public ResponseEntity<?> getDeployment(@PathVariable String deploymentId) {
        try {
            DeploymentRecord record = deployBlockingStub
                .withDeadlineAfter(5, TimeUnit.SECONDS)
                .getDeployment(GetDeploymentRequest.newBuilder()
                    .setDeploymentId(deploymentId)
                    .build());

            return ResponseEntity.ok(DeploymentRecordDto.fromProto(record));
        } catch (StatusRuntimeException e) {
            if (e.getStatus().getCode() == io.grpc.Status.Code.NOT_FOUND) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.internalServerError()
                .body(new ErrorDto(e.getStatus().getDescription()));
        }
    }
}
```

---

## Global Interceptors — Complete

### `interceptor/LoggingInterceptor.java`

```java
package com.infra.health.interceptor;

import io.grpc.*;
import lombok.extern.slf4j.Slf4j;
import net.devh.boot.grpc.server.interceptor.GrpcGlobalServerInterceptor;
import org.springframework.core.annotation.Order;

@Slf4j
@GrpcGlobalServerInterceptor
@Order(1)
public class LoggingInterceptor implements ServerInterceptor {

    @Override
    public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(
            ServerCall<ReqT, RespT> call,
            Metadata headers,
            ServerCallHandler<ReqT, RespT> next) {

        String method = call.getMethodDescriptor().getFullMethodName();
        long start = System.currentTimeMillis();

        log.info("[gRPC] → {}", method);

        return new ForwardingServerCallListener.SimpleForwardingServerCallListener<>(
                next.startCall(new ForwardingServerCall.SimpleForwardingServerCall<>(call) {
                    @Override
                    public void close(Status status, Metadata trailers) {
                        long ms = System.currentTimeMillis() - start;
                        if (status.isOk()) {
                            log.info("[gRPC] ← {} | OK | {}ms", method, ms);
                        } else {
                            log.warn("[gRPC] ← {} | {} | {}ms | {}",
                                method, status.getCode(), ms, status.getDescription());
                        }
                        super.close(status, trailers);
                    }
                }, headers)) {};
    }
}
```

### `interceptor/RequestIdInterceptor.java`

```java
package com.infra.health.interceptor;

import io.grpc.*;
import net.devh.boot.grpc.server.interceptor.GrpcGlobalServerInterceptor;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;

import java.util.UUID;

@GrpcGlobalServerInterceptor
@Order(2)
public class RequestIdInterceptor implements ServerInterceptor {

    public static final Context.Key<String> REQUEST_ID =
        Context.key("x-request-id");

    private static final Metadata.Key<String> REQUEST_ID_HEADER =
        Metadata.Key.of("x-request-id", Metadata.ASCII_STRING_MARSHALLER);

    @Override
    public <ReqT, RespT> ServerCall.Listener<ReqT> interceptCall(
            ServerCall<ReqT, RespT> call,
            Metadata headers,
            ServerCallHandler<ReqT, RespT> next) {

        String requestId = headers.get(REQUEST_ID_HEADER);
        if (requestId == null) {
            requestId = UUID.randomUUID().toString();
        }

        MDC.put("requestId", requestId);
        Context ctx = Context.current().withValue(REQUEST_ID, requestId);

        try {
            return Contexts.interceptCall(ctx, call, headers, next);
        } finally {
            MDC.remove("requestId");
        }
    }
}
```

---

## Docker Compose — Run Everything Locally

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  infra-health-service:
    build:
      context: ./infra-health-service
      dockerfile: Dockerfile
    ports:
      - "9091:9091"
      - "8091:8091"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/infra_health
      SPRING_DATA_REDIS_HOST: redis
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  infra-deploy-service:
    build:
      context: ./infra-deploy-service
      dockerfile: Dockerfile
    ports:
      - "9092:9092"
      - "8092:8092"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/infra_deploy
    depends_on:
      postgres:
        condition: service_healthy

  infra-log-service:
    build:
      context: ./infra-log-service
      dockerfile: Dockerfile
    ports:
      - "9093:9093"
      - "8093:8093"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/infra_log
    depends_on:
      postgres:
        condition: service_healthy

  infra-discovery-service:
    build:
      context: ./infra-discovery-service
      dockerfile: Dockerfile
    ports:
      - "9094:9094"
      - "8094:8094"
    environment:
      SPRING_DATA_REDIS_HOST: redis
    depends_on:
      redis:
        condition: service_healthy

  infra-gateway:
    build:
      context: ./infra-gateway
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      GRPC_CLIENT_INFRA-HEALTH-SERVICE_ADDRESS: static://infra-health-service:9091
      GRPC_CLIENT_INFRA-DEPLOY-SERVICE_ADDRESS: static://infra-deploy-service:9092
      GRPC_CLIENT_INFRA-LOG-SERVICE_ADDRESS: static://infra-log-service:9093
      GRPC_CLIENT_INFRA-DISCOVERY-SERVICE_ADDRESS: static://infra-discovery-service:9094
    depends_on:
      - infra-health-service
      - infra-deploy-service
      - infra-log-service
      - infra-discovery-service
```

### Dockerfile (per service)

```dockerfile
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE 9091 8091
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## API Reference — Quick Test Guide

### Register a service

```bash
curl -X POST http://localhost:8080/api/v1/health/services \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "payment-service",
    "name": "payment-service",
    "host": "localhost",
    "port": 8080,
    "version": "2.1.0",
    "heartbeatIntervalSeconds": 30
  }'
```

### Get service status

```bash
curl http://localhost:8080/api/v1/health/services/payment-service/status
```

### Send heartbeat

```bash
curl -X POST http://localhost:8080/api/v1/health/services/{registrationId}/heartbeat \
  -H "Content-Type: application/json" \
  -d '{
    "status": "HEALTHY",
    "cpuPercent": 45.2,
    "memoryPercent": 62.1,
    "activeConnections": 150
  }'
```

### Create deployment

```bash
curl -X POST http://localhost:8080/api/v1/deploy/deployments \
  -H "Content-Type: application/json" \
  -d '{
    "serviceId": "payment-service",
    "imageTag": "payment-service:v2.2.0",
    "environment": "STAGING",
    "replicas": 3,
    "envVars": {"DB_HOST": "prod-db", "LOG_LEVEL": "INFO"}
  }'
```

### Direct gRPC with grpcurl

```bash
# Register service directly
grpcurl -plaintext \
  -d '{"service": {"serviceId": "test-svc", "name": "test", "host": "localhost", "port": 8080}}' \
  localhost:9091 infra.health.v1.HealthService/RegisterService

# Stream heartbeats
grpcurl -plaintext \
  -d '{"serviceId": "test-svc", "lastN": 5}' \
  localhost:9091 infra.health.v1.HealthService/StreamHeartbeats

# List all services in discovery
grpcurl -plaintext localhost:9094 infra.discovery.v1.DiscoveryService/ListAll
```
# PART 5: RULES, CHEATSHEET & QUICK REFERENCE

---

## The Golden Rules of gRPC — Never Break These

### Proto rules

```
RULE 1:  Never change a field number. Ever. In any deployed system.
         Old clients send field 2, server now reads it as something else.
         Silent data corruption that's hell to debug.

RULE 2:  Never remove a field without reserving its number.
         reserved 3, 4; → prevents future fields from reusing the number.

RULE 3:  Enum's first value must always be 0 with name *_UNSPECIFIED.
         Proto3 defaults missing fields to 0. UNSPECIFIED makes this obvious.

RULE 4:  Always use java_multiple_files = true.
         One class per message. Without it, everything is nested inside
         one giant wrapper class.

RULE 5:  Never use float/double for money. Use int64 cents/paise.
         Floating point precision errors will destroy your accounting.

RULE 6:  Use sint32/sint64 for numbers that can be negative.
         int32 with negative values = 10 bytes on wire every time.

RULE 7:  Use google.protobuf.Timestamp for timestamps.
         Never use int64 unix millis. Timestamp is self-documenting
         and has proper type support.

RULE 8:  Prefix enum values with the enum name.
         SERVICE_STATUS_HEALTHY not just HEALTHY.
         Avoids name collisions across proto files in the same package.

RULE 9:  Field numbers 1-15 cost 1 byte. Use these for frequent fields.
         Field numbers 16+ cost 2 bytes. Use these for rare fields.

RULE 10: Never put business logic in generated proto classes.
         They are data containers only.
```

### Server implementation rules

```
RULE 11: Unary RPC — always call BOTH onNext() AND onCompleted().
         Missing either one hangs the client forever. No exception.

RULE 12: After calling onError(), always return immediately.
         Calling onNext() or onCompleted() after onError() = IllegalStateException.

RULE 13: Never block inside a StreamObserver callback.
         gRPC callbacks run on Netty threads. Blocking = starving the thread pool.
         Offload blocking work to a separate executor.

RULE 14: For infinite server streaming, do NOT call onCompleted().
         Call it only when you're done sending. For live feeds, never call it
         unless the stream is intentionally closing.

RULE 15: Use ServerCallStreamObserver.isCancelled() before sending in loops.
         Client may disconnect mid-stream. Check before each onNext() in loops.

RULE 16: The StreamObserver returned from client-streaming methods must NOT be null.
         Returning null causes NullPointerException on the first client message.

RULE 17: Use @GrpcService for server implementations, not @Component.
         @Component alone won't register the service with the Netty gRPC server.

RULE 18: Validate ALL input at the start of every RPC handler.
         Fail fast with Status.INVALID_ARGUMENT before touching DB/Redis.
```

### Client rules

```
RULE 19: Always set a deadline on every RPC call.
         stub.withDeadlineAfter(5, TimeUnit.SECONDS).someRpc(request)
         Without this, a hung server holds your thread/connection forever.

RULE 20: Never create a ManagedChannel per request.
         Channels are expensive. Create once, share, close on app shutdown.
         @GrpcClient does this automatically with Spring Boot starter.

RULE 21: BlockingStub cannot do streaming RPCs.
         Server streaming, client streaming, bidi streaming → use async stub.
         BlockingStub only works for unary + server streaming (via Iterator).

RULE 22: Handle StatusRuntimeException for every blocking stub call.
         gRPC errors come as StatusRuntimeException, not standard exceptions.

RULE 23: Use withDeadlineAfter() not setTimeout() — there is no setTimeout().
         gRPC deadlines are absolute (point in time), not durations.
         withDeadlineAfter() is the right API.
```

### Interceptor rules

```
RULE 24: Use @Order to control interceptor execution order.
         Lower number = outer layer (executes first on request, last on response).
         Logging → Auth → Metrics is the typical order.

RULE 25: Auth interceptor: always return empty listener after closing the call.
         return new ServerCall.Listener<>() {};
         Without this, NPE or further processing on a closed call.

RULE 26: Clean up Context entries after use.
         MDC.clear() in a finally block to prevent context leakage between requests.
```

### Observability rules

```
RULE 27: Never use request/response data as metric tags.
         Only use: service name, method name, status code.
         User IDs, service IDs, etc. = unbounded cardinality = OOM in Prometheus.

RULE 28: Always record both success AND failure paths in timers.
         If your timer only records on success, your P99 lies.

RULE 29: Use structured logging with MDC request ID.
         Flat log lines are impossible to correlate across services.
         requestId in MDC + log aggregation = traceable requests.
```

### Production / deployment rules

```
RULE 30: Never run plaintext gRPC in production.
         Always TLS between services. mTLS for zero-trust.

RULE 31: Enable reflection in development, disable in production.
         Reflection exposes your entire API surface to anyone with grpcurl.

RULE 32: Set max-inbound-message-size explicitly.
         Default is 4MB. Large messages cause silent failures if not configured.

RULE 33: Configure keepalive on both client and server.
         Without keepalive, idle connections die silently.
         Client thinks it's connected. First RPC fails. User sees error.

RULE 34: Implement the standard gRPC health check protocol.
         Kubernetes, load balancers, and monitoring tools expect it.
         grpc-spring-boot-starter includes it — just enable it.

RULE 35: Version your proto packages, not your messages.
         infra.health.v2, not infra.health.v1.ServiceInfoV2.
         Breaking changes → new package. Old package stays until all clients migrate.
```

---

## Complete Cheatsheet

### Creating proto messages in Java

```java
// Always use newBuilder()
ServiceInfo info = ServiceInfo.newBuilder()
    .setServiceId("svc-1")
    .setName("payment")
    .setHost("localhost")
    .setPort(8080)
    .putTags("env", "prod")        // map field
    .addTags("v1")                 // repeated field (if it were repeated)
    .build();

// Reading
String id   = info.getServiceId();
int port    = info.getPort();
Map<String, String> tags = info.getTagsMap();

// Modifying (proto objects are immutable — toBuilder() to create modified copy)
ServiceInfo updated = info.toBuilder()
    .setPort(9090)
    .build();

// Checking if optional message field is set
if (response.hasLastHeartbeat()) {
    HeartbeatEvent hb = response.getLastHeartbeat();
}

// Checking repeated field
if (response.getInstancesCount() > 0) {
    ServiceInfo first = response.getInstances(0);
    List<ServiceInfo> all = response.getInstancesList();
}
```

### Timestamp conversions

```java
import com.google.protobuf.Timestamp;
import com.google.protobuf.util.Timestamps;
import java.time.*;

// LocalDateTime → Timestamp
LocalDateTime ldt = LocalDateTime.now();
Instant instant = ldt.toInstant(ZoneOffset.UTC);
Timestamp ts = Timestamp.newBuilder()
    .setSeconds(instant.getEpochSecond())
    .setNanos(instant.getNano())
    .build();

// Timestamp → LocalDateTime
LocalDateTime back = LocalDateTime.ofInstant(
    Instant.ofEpochSecond(ts.getSeconds(), ts.getNanos()),
    ZoneOffset.UTC
);

// Instant → Timestamp (via util)
Timestamp ts2 = Timestamps.fromMillis(System.currentTimeMillis());

// Timestamp → Instant (via util)
Instant i = Instant.ofEpochSecond(ts.getSeconds(), ts.getNanos());
```

### Status code cheatsheet

```java
// Throw from server
Status.INVALID_ARGUMENT.withDescription("...").asRuntimeException()
Status.NOT_FOUND.withDescription("...").asRuntimeException()
Status.ALREADY_EXISTS.withDescription("...").asRuntimeException()
Status.INTERNAL.withDescription("...").withCause(e).asRuntimeException()
Status.UNAUTHENTICATED.withDescription("...").asRuntimeException()
Status.PERMISSION_DENIED.withDescription("...").asRuntimeException()
Status.UNAVAILABLE.withDescription("...").asRuntimeException()
Status.DEADLINE_EXCEEDED.withDescription("...").asRuntimeException()
Status.RESOURCE_EXHAUSTED.withDescription("...").asRuntimeException()
Status.UNIMPLEMENTED.withDescription("...").asRuntimeException()

// Catch on client
try {
    stub.someRpc(request);
} catch (StatusRuntimeException e) {
    Status.Code code = e.getStatus().getCode();
    String desc = e.getStatus().getDescription();
    Throwable cause = e.getStatus().getCause(); // only if server attached it
}
```

### Stub selection guide

```java
// Use BLOCKING for:
// - Simple unary calls
// - When you need the result before proceeding
// - Tests
HealthServiceGrpc.HealthServiceBlockingStub blocking = 
    HealthServiceGrpc.newBlockingStub(channel);
Response r = blocking.withDeadlineAfter(5, TimeUnit.SECONDS).unaryRpc(request);

// Use ASYNC for:
// - ALL streaming RPCs (client, server, bidi)
// - Fire-and-forget patterns
// - High throughput async pipelines
HealthServiceGrpc.HealthServiceStub async = 
    HealthServiceGrpc.newStub(channel);
async.serverStreamingRpc(request, new StreamObserver<Response>() { ... });

// Use FUTURE for:
// - When composing with ListenableFuture (Guava)
// - Parallel calls with .allAsList()
HealthServiceGrpc.HealthServiceFutureStub future = 
    HealthServiceGrpc.newFutureStub(channel);
ListenableFuture<Response> f = future.unaryRpc(request);
```

### ResponseObserver patterns

```java
// Unary — THE pattern, never deviate
responseObserver.onNext(response);
responseObserver.onCompleted();

// Unary with error
if (invalid) {
    responseObserver.onError(Status.INVALID_ARGUMENT.asRuntimeException());
    return;   // ← MANDATORY return
}
responseObserver.onNext(response);
responseObserver.onCompleted();

// Finite server streaming
for (Item item : items) {
    responseObserver.onNext(toProto(item));
}
responseObserver.onCompleted();

// Infinite server streaming (never call onCompleted)
String subId = bus.subscribe(id, event -> responseObserver.onNext(event));
((ServerCallStreamObserver<T>) responseObserver).setOnCancelHandler(
    () -> bus.unsubscribe(subId)
);
// DO NOT call onCompleted()

// Client streaming — return a new StreamObserver
return new StreamObserver<Request>() {
    public void onNext(Request r)    { /* accumulate */ }
    public void onError(Throwable t) { /* cleanup */ }
    public void onCompleted()        {
        responseObserver.onNext(summary);
        responseObserver.onCompleted();
    }
};
```

---

## Common Errors and Fixes

### `UNIMPLEMENTED: Method not found`

```
Cause:  Your service class doesn't properly extend the generated ImplBase,
        OR the method signature doesn't match the generated one.

Fix:    Check: public class XServiceImpl extends XServiceGrpc.XServiceImplBase
        Ensure you're overriding the exact method from ImplBase.
        If you added a new RPC to the proto, run mvn compile to regenerate.
```

### `UNAVAILABLE: io exception`

```
Cause:  Server is not running, wrong port, or negotiation-type mismatch.
        Client expects TLS, server is plaintext (or vice versa).

Fix:    1. Check server is running: netstat -tlnp | grep 9091
        2. Check negotiation-type in application.yml matches server config
        3. Check address in @GrpcClient matches running server
```

### Client hangs forever (no response, no error)

```
Cause:  Server called onNext() but forgot onCompleted().
        OR server threw an exception that wasn't caught and turned into onError().

Fix:    Always: responseObserver.onNext(r); responseObserver.onCompleted();
        Wrap handler body in try-catch → onError on exception.
        Add deadline: stub.withDeadlineAfter(5, TimeUnit.SECONDS) to get timeout.
```

### `StatusRuntimeException: CANCELLED`

```
Cause:  Client set a deadline and it expired before server responded.
        OR client explicitly cancelled the call.

Fix:    1. Increase deadline if server legitimately needs more time
        2. Optimize server to respond faster
        3. Check for blocking operations (DB queries, network calls) inside handlers
```

### `Generated sources not found` in IntelliJ

```
Cause:  IntelliJ doesn't automatically mark generated source directories.

Fix:    1. Run: mvn compile in infra-proto
        2. Right-click: target/generated-sources/protobuf/java
           → Mark Directory As → Generated Sources Root
        3. Right-click: target/generated-sources/protobuf/grpc-java
           → Mark Directory As → Generated Sources Root
        4. Invalidate caches if still broken: File → Invalidate Caches
```

### `Cannot find protoc` or `os.detected.classifier not set`

```
Cause:  os-maven-plugin not registered as a build extension.
        Registering it as a plugin (not extension) doesn't work.

Fix:    In pom.xml, make sure it's under <build><extensions>:
        <extensions>
          <extension>
            <groupId>kr.motd.maven</groupId>
            <artifactId>os-maven-plugin</artifactId>
            <version>1.7.1</version>
          </extension>
        </extensions>
        NOT under <build><plugins>.
```

### `NullPointerException` on first client streaming message

```
Cause:  Your server-side client-streaming method returns null instead of a StreamObserver.

Fix:    return new StreamObserver<Request>() { ... };  // must return a non-null observer
```

### Redis `ClassCastException` when deserializing

```
Cause:  RedisTemplate<String, String> used to store, but retrieved with wrong type.

Fix:    Keep your RedisTemplate generic types consistent.
        For simple string values: RedisTemplate<String, String>.
        For objects: RedisTemplate<String, Object> with Jackson serializer.
```

---

## Interview Questions — Mastery Level

**Q: What are the 4 types of gRPC communication and when do you use each?**

Unary: request/response, like REST. Use for CRUD operations.
Server streaming: one request, many responses. Use for live feeds, log tailing.
Client streaming: many requests, one response. Use for file uploads, data ingestion.
Bidirectional streaming: both sides stream simultaneously. Use for chat, real-time sync.

**Q: Why are Protobuf field numbers critical and what happens if you change one?**

Field numbers identify fields on the wire, not names. Changing a number causes old clients to send data under the old number, which the server now interprets as a different field. Silent data corruption — no error, wrong data silently substituted.

**Q: What is the difference between `int32` and `sint32` in Protobuf?**

Both are 32-bit signed integers, but encoding differs. `int32` uses varint encoding, which is efficient for positive numbers but uses 10 bytes for negative numbers (sign extension). `sint32` uses zigzag encoding, mapping negatives to small positive numbers. For fields that can be negative, `sint32` is always more efficient.

**Q: Explain gRPC deadline propagation.**

When Service A receives a call with a 5-second deadline and has already spent 2 seconds processing, it has 3 seconds left. When it calls Service B, it should pass the remaining 3 seconds as B's deadline — not a fresh 5 seconds. gRPC does this automatically when calls are made in the same Context. This prevents cascading slow calls from causing unbounded response times.

**Q: What's the difference between `Status.FAILED_PRECONDITION`, `Status.ABORTED`, and `Status.UNAVAILABLE`?**

`FAILED_PRECONDITION`: System is not in the required state for this operation (e.g., trying to delete a non-empty directory). Client should fix the state before retrying.
`ABORTED`: Operation was aborted due to a concurrency issue (e.g., optimistic lock failure, transaction conflict). Safe to retry from scratch.
`UNAVAILABLE`: Service is temporarily unavailable (overloaded, restarting). Safe to retry with backoff.

**Q: Why can't you use `BlockingStub` for bidirectional streaming?**

Bidirectional streaming requires sending and receiving simultaneously — the client sends a stream while receiving a stream. `BlockingStub` is synchronous, so it would block the calling thread waiting for each response before sending the next request. This makes simultaneous bidirectional communication impossible. The `AsyncStub` with `StreamObserver` callbacks handles both directions independently on separate threads.

**Q: What does `onCompleted()` do in client streaming, and what happens if you call it twice?**

In client streaming, `onCompleted()` signals to the server that the client has finished sending messages. The server's `onCompleted()` callback then fires, where it typically sends its single response. Calling it twice throws `IllegalStateException` — a stream can only be completed once.

**Q: How do you handle a client disconnect in server streaming?**

Cast `responseObserver` to `ServerCallStreamObserver<T>` and use `setOnCancelHandler()` and `isCancelled()`:
```java
ServerCallStreamObserver<T> obs = (ServerCallStreamObserver<T>) responseObserver;
obs.setOnCancelHandler(() -> cleanup());
// In loops: if (obs.isCancelled()) return;
```

**Q: What's wrong with using service/user IDs as Prometheus metric tags?**

Prometheus stores a time series for every unique combination of label values. Service IDs and user IDs are unbounded — there could be millions. Each unique combination = a new time series = more memory. With enough unique values, Prometheus runs out of memory (cardinality explosion / high cardinality). Only use bounded labels: service name (finite), method name (finite), status code (16 values).

---

## Dependency Versions Reference (Latest Stable as of mid-2025)

```xml
<!-- Always check mvnrepository.com for latest -->
<spring-boot.version>3.2.5</spring-boot.version>
<grpc.version>1.63.0</grpc.version>
<protobuf.version>3.25.3</protobuf.version>
<grpc-spring-boot.version>3.1.0.RELEASE</grpc-spring-boot.version>
<os-maven-plugin.version>1.7.1</os-maven-plugin.version>
<protobuf-maven-plugin.version>0.6.1</protobuf-maven-plugin.version>
<jakarta-annotation.version>2.1.1</jakarta-annotation.version>
<mapstruct.version>1.5.5.Final</mapstruct.version>
```

**Compatibility check before using:**
- Spring Boot 3.x requires Java 17+
- `grpc-spring-boot-starter` version must match Spring Boot version
  → Check: https://github.com/grpc-ecosystem/grpc-spring#versions

---

## Where to Go From Here

### Tools to install now

```bash
# grpcurl — curl for gRPC
brew install grpcurl                          # macOS
choco install grpcurl                         # Windows

# Bloom RPC — GUI client for gRPC (like Postman but for gRPC)
# Download from: https://github.com/bloomrpc/bloomrpc/releases

# Evans — interactive gRPC REPL
brew install evans                            # macOS
```

### Official resources

```
gRPC Java GitHub:          https://github.com/grpc/grpc-java
grpc-spring GitHub:        https://github.com/grpc-ecosystem/grpc-spring
gRPC documentation:        https://grpc.io/docs/
Protobuf style guide:      https://protobuf.dev/programming-guides/style/
Proto3 language guide:     https://protobuf.dev/programming-guides/proto3/
gRPC status codes:         https://grpc.github.io/grpc/core/md_doc_statuscodes.html
```

### What to build next (resume++ topics)

After INFRA is solid:

1. **Add gRPC-Web** — expose services to browser clients via Envoy proxy
2. **Add distributed tracing** — OpenTelemetry + Jaeger, trace across all 4 services
3. **Add circuit breaking** — Resilience4j on gRPC client calls
4. **Migrate to Reactive** — Spring WebFlux + Project Reactor with reactive gRPC
5. **Add Kubernetes deployment** — Helm charts, liveness/readiness probes hitting gRPC health check
6. **Add mTLS** — mutual certificate auth between all services

---

## Summary — What You've Learned

```
Part 1: Foundations
  ✓ What gRPC is and why it exists
  ✓ HTTP/2 — multiplexing, binary framing, server push
  ✓ Protobuf — complete syntax, field numbers, types, evolution rules
  ✓ 4 RPC types — unary, server streaming, client streaming, bidi

Part 2: Java Implementation
  ✓ Maven multi-module setup — parent pom, infra-proto, service modules
  ✓ Spring Boot + grpc-spring-boot-starter integration
  ✓ All 4 RPC types implemented in Java — complete code
  ✓ Interceptors — auth, logging, request ID
  ✓ Deadlines — setting, propagating, checking
  ✓ Error handling — status codes, rich errors, global handler

Part 3: Advanced Topics
  ✓ Metadata — keys, reading/writing, custom marshallers
  ✓ Retry policy — configuration, retryable codes
  ✓ Load balancing — client-side round robin
  ✓ Channel lifecycle management
  ✓ Observability — Micrometer metrics, MDC logging, OpenTelemetry
  ✓ Testing — unit tests with in-process server, Testcontainers
  ✓ gRPC reflection — grpcurl usage
  ✓ REST gateway — Spring Boot REST → gRPC translation
  ✓ Production best practices — what to never do, what to always do
  ✓ TLS/mTLS — configuration and certificate generation

Part 4: INFRA Project
  ✓ Complete 4-service system with all 4 RPC types used
  ✓ Full Spring Boot implementation — entities, repos, services, gRPC impls
  ✓ Docker Compose for local development
  ✓ API reference and grpcurl test commands

Part 5: Reference
  ✓ 35 golden rules
  ✓ Complete cheatsheets — messages, timestamps, status codes, stubs, observers
  ✓ Common errors and fixes
  ✓ Interview questions with answers
```
