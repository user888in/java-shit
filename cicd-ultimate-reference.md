# THE ULTIMATE CI/CD PRODUCTION REFERENCE
## Everything from Zero to Production-Grade DevOps — Zero Assumptions, Zero Shortcuts

---

# TABLE OF CONTENTS

## Part I — Foundations
1. The DevOps Philosophy
2. CI/CD Mental Models
3. Choosing Your Stack

## Part II — Version Control
4. Git Deep Dive
5. Branch Strategies — All Options
6. Commit Standards

## Part III — The Application
7. Spring Boot Production Setup
8. Maven vs Gradle
9. Database Options
10. Database Migrations — Flyway vs Liquibase
11. Configuration Management

## Part IV — Containerization
12. Docker Deep Dive
13. Dockerfile — Every Option Explained
14. Docker Compose — Complete Reference
15. Container Registries — All Options

## Part V — CI Pipeline
16. CI Tools Comparison
17. GitHub Actions — Complete Reference
18. Testing Strategy in CI
19. Code Quality Tools
20. Security Scanning

## Part VI — CD Pipeline & Deployment
21. Deployment Strategies
22. Deployment Targets — All Options
23. Railway — Complete Guide
24. AWS Deployment
25. DigitalOcean & Other PaaS

## Part VII — Production Engineering
26. Secrets Management
27. Environment Management
28. Health Checks & Readiness
29. Monitoring & Alerting
30. Logging
31. Rollbacks & Recovery

## Part VIII — Advanced Topics
32. Kubernetes — When and Why
33. Infrastructure as Code
34. Migration Paths
35. Production Checklists
36. Troubleshooting Bible


---
# PART I — FOUNDATIONS
---

# 1. The DevOps Philosophy

## What DevOps Actually Is

DevOps is not a tool. Not a job title. It is a culture that removes the wall between the people who write software (Dev) and the people who run it (Ops).

```
BEFORE DevOps:
  Dev team   → writes code, throws it over the wall
  Ops team   → "why does this keep crashing?!"
  Release    → once every 3 months, terrifying
  Result     → slow, painful, risky deployments

WITH DevOps:
  Same team  → writes AND owns production
  Release    → dozens of times per day, boring (good)
  Result     → fast, safe, automated deployments
```

## The Core Principles

```
1. AUTOMATE EVERYTHING
   If a human does it more than twice, automate it.
   Humans make mistakes. Machines are consistent.
   Build → Test → Deploy should require zero manual steps.

2. FAIL FAST
   Find bugs in seconds (dev machine) not days (production).
   Cost to fix a bug:
     Dev machine    → $1
     PR/CI          → $10
     Staging        → $100
     Production     → $10,000+

3. EVERYTHING IS CODE
   Infrastructure = code (Terraform)
   Pipeline       = code (ci.yml)
   Config         = code (application.yml)
   Everything in git. Everything reviewable. Reproducible.

4. SMALL, FREQUENT RELEASES
   One giant release every 3 months = high risk, high stress
   100 small releases per week = low risk, fast feedback

5. MEASURE EVERYTHING
   You cannot improve what you don't measure.
   DORA metrics: deployment frequency, lead time, MTTR, change failure rate.
```

## DORA Metrics (Industry Standard)

```
Elite performers (Google, Netflix, Amazon):
  Deployment Frequency  → Multiple times per day
  Lead Time for Change  → Less than 1 hour
  MTTR                  → Less than 1 hour
  Change Failure Rate   → 0-15%

Realistic targets for a growing team:
  Deployment Frequency  → Daily to weekly
  Lead Time             → Less than 1 day
  MTTR                  → Less than 1 day
  Change Failure Rate   → Less than 15%
```

---

# 2. CI/CD Mental Models

## The 4-Step GitHub Actions Model

```
1. TRIGGER  → what event starts the pipeline (push, PR, schedule)
2. RUNNER   → fresh Ubuntu VM that runs your jobs
3. JOB      → a group of steps on one runner
4. STEP     → one individual command or action
```

## Continuous Delivery vs Continuous Deployment

```
CONTINUOUS DELIVERY:
  Every change COULD be deployed.
  Deployment is automated but requires human approval.
  "The button is always ready, a human presses it."
  → Best for regulated industries, enterprise

CONTINUOUS DEPLOYMENT:
  Every change IS deployed to production automatically.
  Zero human intervention after merge.
  → Best for SaaS startups, mature test coverage (>95%)

Which to use:
  Learning project   → Continuous Delivery (understand both flows)
  Startup            → Continuous Deployment (move fast)
  Regulated/Enterprise → Continuous Delivery (approval gates)
```

## Pipeline Anatomy

```
TRIGGER
  ↓
CHECKOUT
  └── Get code from git

BUILD
  └── Compile source code
  └── Resolve dependencies

TEST
  └── Unit tests (fast, no external services)
  └── Integration tests (with DB, slower)
  └── E2E tests (optional, slow)

QUALITY
  └── Code style (Checkstyle)
  └── Static analysis (SpotBugs, SonarQube)
  └── Security scan (OWASP, Trivy)

ARTIFACT
  └── Build Docker image
  └── Tag with SHA + branch + version
  └── Push to registry (ghcr.io, ECR)

DEPLOY
  └── Deploy to staging (auto)
  └── Smoke tests against staging
  └── Manual approval gate
  └── Deploy to production
  └── Health check verification
```

---

# 3. Choosing Your Stack

## CI/CD Tool Decision Tree

```
Using GitHub for source control?
  YES → GitHub Actions (free, integrated, zero setup)

  NO → Need self-hosted?
    YES → Jenkins (free software, most flexible, runs anywhere)
    NO  → Using GitLab? → GitLab CI (built-in, powerful)
          Have budget?  → CircleCI or TeamCity
          No budget?    → GitHub Actions or GitLab CI free tier
```

## Container Registry Decision Tree

```
Using GitHub?
  YES → ghcr.io — free for public images, uses GITHUB_TOKEN automatically
  
Deploying to AWS?
  YES → Amazon ECR — tight AWS integration, pay per storage
  
Public open-source project?
  YES → Docker Hub — maximum visibility, rate limited on free tier

Deploying to GCP?
  YES → Google Artifact Registry

Need self-hosted?
  YES → Harbor (enterprise), Nexus, GitLab Registry
```

## Deployment Platform Decision Tree

```
Learning / Side project / MVP?
  → Railway     (simplest, free tier, Docker support)
  → Render      (free tier, auto-deploy from GitHub)
  → Fly.io      (cheap, global edge, Docker native)

Production startup / growing team?
  → DigitalOcean App Platform ($12/month, simple)
  → DigitalOcean Droplet      ($6/month, full control, best learning)
  → Render Pro                ($7/month)

Enterprise / AWS ecosystem?
  → AWS ECS (managed containers, recommended starting point)
  → AWS EKS (Kubernetes, most powerful, most complex)

Enterprise / GCP?
  → Google Cloud Run (serverless containers, excellent auto-scaling)
  → Google GKE (best managed Kubernetes)

Need Kubernetes but cost-conscious?
  → DigitalOcean Kubernetes ($12/month, cheapest managed K8s)
  → k3s on VPS (self-managed, ~$6/month)
```


---
# PART II — VERSION CONTROL
---

# 4. Git Deep Dive

## How Git Actually Works

```
Working Directory → Staging Area → Local Repo → Remote Repo
(your files)         (git add)      (git commit)   (git push)

Blob   = file content (stored by SHA hash)
Tree   = directory structure
Commit = snapshot of entire repo at a point in time
Branch = lightweight pointer to a commit
HEAD   = pointer to current branch/commit
Tag    = permanent pointer to a specific commit (for releases)
```

## Complete Git Command Reference

### Setup
```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
git config --global core.editor "code --wait"       # VS Code
git config --global core.autocrlf input             # Mac/Linux
git config --global core.autocrlf true              # Windows
git config --global init.defaultBranch main
git config --list                                   # view all config
```

### Repository
```bash
git init
git clone https://github.com/user/repo.git
git clone --depth 1 https://...         # shallow clone (CI uses this, faster)
git remote -v                           # show remotes
git remote add origin <url>
git remote set-url origin <url>         # change remote URL
git remote remove origin
```

### Staging & Committing
```bash
git status
git status -s                           # short format
git diff                                # unstaged changes
git diff --staged                       # staged changes
git diff HEAD                           # all changes since last commit
git diff main..develop                  # diff between branches

git add .                               # stage everything
git add -p                              # interactive (choose per hunk)
git add src/main/

git commit -m "feat: add user endpoint"
git commit -am "fix: quick typo"        # stage tracked + commit
git commit --amend                      # edit last commit message
git commit --amend --no-edit            # add staged to last commit

git restore --staged file.java          # unstage
git restore file.java                   # discard changes (CAREFUL)
git clean -fd                           # remove untracked files (CAREFUL)
```

### Branches
```bash
git branch                              # list local
git branch -a                           # list all (local + remote)
git branch -v                           # with last commit
git branch --merged                     # merged into current
git branch --no-merged                  # not merged

git checkout -b feature/name            # create + switch
git switch -c feature/name              # modern syntax
git checkout develop                    # switch
git switch develop                      # modern syntax

git branch -d feature/name              # safe delete (merged only)
git branch -D feature/name              # force delete
git push origin --delete feature/name  # delete remote branch
git remote prune origin                 # clean stale remote refs

git branch -m old-name new-name         # rename local
```

### Merging & Rebasing
```bash
# Merge — preserves history, creates merge commit
git checkout develop
git merge feature/my-feature

# Rebase — rewrites history, linear
git checkout feature/my-feature
git rebase develop

# Interactive rebase — squash/edit commits
git rebase -i HEAD~3                    # last 3 commits

# When to use which:
# merge  → feature → main/develop (preserves context of when work happened)
# rebase → keep feature branch up to date with develop (cleaner history)
# squash → clean up messy "WIP" commits before PR

git merge --no-ff feature               # always create merge commit
git merge --squash feature              # squash all into one commit
git merge --ff-only feature             # only if fast-forward possible
```

### Stashing
```bash
git stash                               # stash current changes
git stash save "WIP: user auth"        # stash with message
git stash list                          # list all stashes
git stash pop                           # apply latest + remove
git stash apply stash@{1}              # apply specific (keep it)
git stash drop stash@{0}               # delete specific stash
git stash clear                         # delete all
git stash branch feature/new           # create branch from stash
```

### History
```bash
git log
git log --oneline
git log --oneline --graph --all         # visual branch tree
git log -5                              # last 5
git log --since="2 weeks ago"
git log --author="Alice"
git log -- src/main/java/               # commits affecting path
git log --follow src/User.java          # follow renames

git show abc1234                        # show commit details
git blame src/User.java                 # who wrote each line
git bisect start                        # binary search for bug commit
```

### Undoing
```bash
# SAFE — doesn't rewrite history, always use on shared branches
git revert abc1234                      # undo commit with new commit
git revert HEAD                         # undo last commit

# UNSAFE — rewrites history, NEVER use on shared branches
git reset --soft HEAD~1                 # undo commit, keep changes staged
git reset --mixed HEAD~1                # undo commit, keep changes unstaged
git reset --hard HEAD~1                 # undo commit, LOSE ALL CHANGES

# Recover from hard reset (within ~30 days)
git reflog                              # find lost SHA
git checkout -b recovery abc1234        # recover it
```

### Tags (for releases)
```bash
git tag v1.0.0                          # lightweight
git tag -a v1.0.0 -m "Release 1.0.0"   # annotated (recommended)
git push origin v1.0.0                  # push specific tag
git push origin --tags                  # push all tags
git tag -d v1.0.0                       # delete local
git push origin --delete v1.0.0         # delete remote
```

### File Permissions (Critical for CI)
```bash
# THE most common CI/CD problem from Windows developers
git ls-files --stage mvnw
# 100644 = no execute bit = BROKEN on Linux CI runner
# 100755 = has execute bit = CORRECT

git update-index --chmod=+x mvnw        # fix permission in git
git add .
git commit -m "fix: add execute permission to mvnw"
# This fix persists — every checkout gets 100755 from now on

# Why it happens:
# Windows NTFS doesn't have Unix permissions
# Git on Windows commits mvnw as 100644
# Linux CI runner checks out → mvnw not executable → exit 126
```

---

# 5. Branch Strategies — All Options

## Strategy 1: GitFlow (Classic)

```
BEST FOR: Libraries, versioned software, scheduled releases

Branches:
  main        → production releases ONLY, tagged
  develop     → integration branch, always stable
  feature/*   → new features (branch from develop)
  release/*   → release preparation (from develop)
  hotfix/*    → emergency production fixes (from main)

Flow:
  feature/x → develop → release/1.0 → main → tag v1.0.0
  hotfix/y  → main → tag v1.0.1 → back-merge to develop

PROS: Clear structure, good for scheduled releases, well understood
CONS: Complex, long-lived branches → merge conflicts, slow release cycle

WHEN TO MIGRATE AWAY:
  When team starts releasing daily
  When merge conflicts become a daily problem
  When release/* branches feel like theater
```

## Strategy 2: GitHub Flow (Simple)

```
BEST FOR: Web apps, SaaS, continuous deployment, small teams

Branches:
  main        → always deployable, always protected
  feature/*   → ALL work branches off main

Flow:
  main → feature/* → PR → CI → review → merge → deploy

Rules:
  1. Anything in main is deployable NOW
  2. Create branches from main, merge back to main
  3. Open PR early for visibility and discussion
  4. Deploy immediately after merge to main

PROS: Simple (2 branch types), forces continuous deployment mindset
CONS: No built-in staging environment, need feature flags for WIP features

WHEN TO MIGRATE TO:
  When you want to deploy multiple times daily
  When GitFlow feels like overhead
  When your team is < 5 people
```

## Strategy 3: Trunk-Based Development (Elite)

```
BEST FOR: High-maturity teams, continuous deployment

Branches:
  main/trunk  → single shared branch, EVERYONE commits here
  feature/*   → very short-lived (max 2 days), no PR sometimes

Rules:
  1. Commit to trunk at LEAST once per day
  2. NEVER break the build (tests must always pass)
  3. Use feature flags for incomplete work
  4. All changes small and incremental

PROS: Fastest integration, no merge conflicts, used by Google/Meta/Netflix
CONS: Requires >80% test coverage, requires feature flag infra, scary for juniors

WHEN TO MIGRATE TO:
  When your team has excellent test coverage
  When merge conflicts are your #1 pain point
  When deploying multiple times per day is the goal
```

## Strategy 4: Our Approach (Balanced — What We Built)

```
BEST FOR: Learning, growing startups, teams deploying daily

Branches:
  main        → production (protected)
  develop     → staging (protected)
  feature/*   → daily work (CI only, no deploy)
  hotfix/*    → emergency fixes → main + develop

This is GitFlow simplified:
  - No release branches (too much ceremony)
  - No long-lived feature branches
  - Staging environment built-in
  - Simple enough to learn on

MIGRATION PATH:
  This approach → GitHub Flow (when you outgrow staging separation)
                → Trunk-based (when you need maximum deployment speed)
```

## Comparing Strategies

```
Strategy        | Releases       | Complexity | Staging | Best for
─────────────────────────────────────────────────────────────────────
GitFlow         | Scheduled      | High       | ✅      | Libraries, versioned apps
GitHub Flow     | Continuous     | Low        | ❌      | SaaS, small teams
Trunk-based     | Continuous     | Low*       | ❌      | Elite teams
Our approach    | Daily-weekly   | Medium     | ✅      | Learning + growing teams

*Low branch complexity but HIGH discipline required
```

---

# 6. Commit Standards

## Conventional Commits — Complete Reference

```
Format: <type>(<scope>): <subject>
        <blank line>
        [optional body — what changed and WHY]
        <blank line>
        [optional footer — breaking changes, issue refs]

TYPES:
  feat      → new feature               → bumps MINOR version
  fix       → bug fix                   → bumps PATCH version
  docs      → documentation only
  style     → formatting, no logic
  refactor  → restructure, no feature/fix
  perf      → performance improvement
  test      → tests only
  build     → build system, dependencies
  ci        → CI/CD configuration
  chore     → maintenance, no production code
  revert    → reverting a previous commit

SCOPE (optional):
  Part of codebase affected
  Examples: user, auth, payment, db, api, docker, ci

BREAKING CHANGE:
  Add ! after type:  feat!: redesign API
  OR add in footer:  BREAKING CHANGE: user id changed from Long to UUID

SUBJECT RULES:
  Imperative mood: "add" not "added" or "adds"
  Lowercase first letter
  No period at end
  Max 72 characters
  Complete this sentence: "If applied, this commit will: <subject>"

GOOD EXAMPLES:
  feat(user): add email verification on registration
  fix(auth): resolve JWT expiry not checked on token refresh
  fix(user): correct email and role field swap in toDTO mapping
  docs: update README with Docker setup instructions
  ci: pin github actions to node24 compatible versions
  ci: add chmod +x mvnw to fix ci permission error
  chore(deps): bump spring boot from 3.3.0 to 3.4.5
  feat!: user id changed from Long to UUID
  test(user): add edge cases for duplicate email handling
  refactor(service): extract user mapper to dedicated class

BAD EXAMPLES:
  fixed bug              ❌ (no type, vague)
  WIP                    ❌ (not a commit message)
  asdf                   ❌ (meaningless)
  feat: added some stuff ❌ (past tense, vague)
  FEAT: Add User         ❌ (uppercase type)
```

## Why Conventional Commits Matter for CI/CD

```
1. AUTOMATED SEMANTIC VERSIONING:
   feat commits → bumps MINOR (1.0.0 → 1.1.0)
   fix commits  → bumps PATCH (1.0.0 → 1.0.1)
   BREAKING     → bumps MAJOR (1.0.0 → 2.0.0)
   Tools: semantic-release, standard-version

2. AUTOMATED CHANGELOG:
   Every feat/fix becomes a CHANGELOG.md entry automatically
   No manual release notes writing

3. PIPELINE DECISIONS:
   Skip deploy if only docs/chore commits?
   Only build Docker on feat/fix?
   These decisions read commit types.

4. TEAM COMMUNICATION:
   git log --oneline becomes readable history
   Not: "WIP", "fix", "asdf", "more changes"
   But: "feat(user): add search", "fix(auth): resolve race condition"
```

---
# PART III — THE APPLICATION
---

# 7. Spring Boot Production Setup

## Correct vs Incorrect Artifact Names

```xml
<!-- THESE EXIST (use these): -->
spring-boot-starter-web                 REST API (includes Tomcat + Jackson)
spring-boot-starter-webflux             Reactive (non-blocking)
spring-boot-starter-data-jpa            JPA + Hibernate
spring-boot-starter-data-mongodb        MongoDB
spring-boot-starter-data-redis          Redis
spring-boot-starter-security            Spring Security
spring-boot-starter-validation          Bean Validation
spring-boot-starter-actuator            Health + Metrics
spring-boot-starter-test                ALL test tools (JUnit5+Mockito+MockMvc)
spring-boot-starter-mail                Email
spring-boot-starter-cache               Caching abstraction
spring-boot-starter-aop                 Aspect-Oriented Programming
spring-boot-starter-batch               Batch processing

<!-- THESE DON'T EXIST (common mistakes): -->
spring-boot-starter-webmvc              ❌ use spring-boot-starter-web
spring-boot-h2console                   ❌ use com.h2database:h2
spring-boot-starter-data-jpa-test       ❌ doesn't exist
spring-boot-starter-actuator-test       ❌ doesn't exist
spring-boot-starter-validation-test     ❌ doesn't exist
spring-boot-starter-webmvc-test         ❌ doesn't exist
```

## Maven Dependency Scopes

```xml
<!-- compile (default): available everywhere, bundled in JAR -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-web</artifactId>
</dependency>

<!-- runtime: not needed to compile, needed to run -->
<!-- DB drivers: code compiles without them, JVM needs them at runtime -->
<dependency>
  <groupId>org.postgresql</groupId>
  <artifactId>postgresql</artifactId>
  <scope>runtime</scope>
</dependency>

<!-- test: only available in test classpath -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-test</artifactId>
  <scope>test</scope>
</dependency>

<!-- optional: not inherited by dependents, not in final JAR -->
<dependency>
  <groupId>org.projectlombok</groupId>
  <artifactId>lombok</artifactId>
  <optional>true</optional>
</dependency>
```

## Reserved SQL Keywords — Always Use @Table

```java
// These class names BREAK Hibernate without @Table:
// Hibernate generates: CREATE TABLE user  ← SQL SYNTAX ERROR in H2/PostgreSQL

@Entity
@Table(name = "users")      // ← ALWAYS add this
public class User { }

@Entity
@Table(name = "app_groups") // "group" is reserved
public class Group { }

@Entity
@Table(name = "orders")     // "order" is reserved
public class Order { }

// RULE: Add @Table(name = "...") to EVERY entity, no exceptions.
// Use plural snake_case: users, orders, order_items, product_categories
```

## Complete Production application.yml

```yaml
# application.yml — base config (no secrets, no DB, inherited by all profiles)
spring:
  application:
    name: ${APP_NAME:userservice}
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:dev}

server:
  port: ${PORT:8080}
  compression:
    enabled: true
    mime-types: application/json,text/plain
  error:
    include-message: never        # don't expose internal errors to users
    include-binding-errors: never
    include-stacktrace: never

management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when-authorized
      probes:
        enabled: true             # /actuator/health/liveness + /readiness
  metrics:
    tags:
      application: ${spring.application.name}

---
# application-dev.yml
spring:
  config:
    activate:
      on-profile: dev
  datasource:
    url: jdbc:postgresql://localhost:5432/myapp_dev
    username: devuser
    password: devpass
    hikari:
      maximum-pool-size: 5
  jpa:
    open-in-view: false           # ALWAYS false — avoids N+1 in views
    hibernate:
      ddl-auto: validate          # use Flyway for schema, not Hibernate
    show-sql: true
    properties:
      hibernate:
        format_sql: true
  flyway:
    enabled: true

logging:
  level:
    com.yourcompany: DEBUG
    org.hibernate.SQL: DEBUG
    org.hibernate.type.descriptor.sql: TRACE

---
# application-test.yml (H2, fast tests, no Docker needed)
spring:
  config:
    activate:
      on-profile: test
  datasource:
    url: jdbc:h2:mem:testdb;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE
    driver-class-name: org.h2.Driver
    username: sa
    password:
  jpa:
    open-in-view: false
    hibernate:
      ddl-auto: create-drop       # ok for tests, fresh DB each run
    show-sql: false
  flyway:
    enabled: false                # Flyway off for H2 (use ddl-auto for tests)

logging:
  level:
    root: WARN
    com.yourcompany: INFO

---
# application-prod.yml (ALL values from environment variables)
spring:
  config:
    activate:
      on-profile: prod
  datasource:
    url: ${DB_URL}                # NEVER hardcoded
    username: ${DB_USER}
    password: ${DB_PASSWORD}
    hikari:
      maximum-pool-size: ${DB_POOL_MAX:10}
      minimum-idle: ${DB_POOL_MIN:2}
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
      connection-test-query: SELECT 1
  jpa:
    open-in-view: false
    hibernate:
      ddl-auto: validate          # NEVER create/update in prod
    show-sql: false
  flyway:
    enabled: true

server:
  error:
    include-message: never
    include-binding-errors: never
    include-stacktrace: never

logging:
  level:
    root: WARN
    com.yourcompany: INFO
```

## Spring Boot Config Override Priority (highest first)

```
1. Command line args:    --server.port=9090
2. SPRING_APPLICATION_JSON env var
3. OS environment vars:  SERVER_PORT=9090
4. JVM system props:     -Dserver.port=9090
5. application-{profile}.yml
6. application.yml
7. @Value defaults

Env var naming: dots and hyphens → underscores, all uppercase
  spring.datasource.url → SPRING_DATASOURCE_URL
  spring.profiles.active → SPRING_PROFILES_ACTIVE
  server.port → SERVER_PORT
```

---

# 8. Maven vs Gradle

```
Feature              | Maven          | Gradle
────────────────────────────────────────────────────────
Config format        | XML (verbose)  | Groovy/Kotlin DSL
Build speed          | Slower         | Faster (incremental builds)
Learning curve       | Lower          | Steeper
Industry share       | ~60%           | ~40% (growing fast)
Android              | Limited        | Official (required)
Spring Boot support  | Excellent      | Excellent
Caching              | Local ~/.m2    | Local + remote build cache
Plugin ecosystem     | Huge/mature    | Large and growing

Choose Maven when:
  Team familiar with Maven, enterprise environment,
  XML doesn't bother you, Spring-heavy project

Choose Gradle when:
  Performance critical (large projects), Android dev,
  Need programmatic build logic, multi-project builds

Gradle equivalent commands:
  ./mvnw clean package -DskipTests → ./gradlew clean build -x test
  ./mvnw test                      → ./gradlew test
  ./mvnw spring-boot:run           → ./gradlew bootRun
  ./mvnw checkstyle:check          → ./gradlew checkstyleMain
```

---

# 9. Database Options

## Choosing Your Database

```
H2 (in-memory):
  USE FOR: Unit/integration tests, local dev without Docker
  AVOID FOR: Production, any persistent data
  SPEED: Very fast (no network, no disk I/O)
  GOTCHA: H2 dialect differs from PostgreSQL — some queries work
          in H2 but fail in production PostgreSQL
  FIX: Use MODE=PostgreSQL: jdbc:h2:mem:testdb;MODE=PostgreSQL

PostgreSQL:
  USE FOR: Most applications, production standard
  WHY: Most feature-rich OSS RDBMS, best JSON support (JSONB),
       best Hibernate integration, most cloud-managed options
  VERSIONS: Always use 15 or 16 in new projects

MySQL/MariaDB:
  USE FOR: Legacy systems, when team is most familiar
  GOTCHA: Different default behaviors in strict mode,
          case-insensitive collation by default
  WHEN TO CHOOSE: Migrating existing MySQL app, team expertise

MongoDB:
  USE FOR: Document data, flexible/changing schema, high write throughput
  AVOID FOR: Complex relational queries, ACID transactions (use v4.0+)
  SPRING: Use Spring Data MongoDB, NOT JPA (different paradigm)

Redis:
  USE FOR: Caching, sessions, real-time features, rate limiting
  NOT FOR: Primary data storage (data can be lost)
```

## Migrating H2 → PostgreSQL

```
1. Add PostgreSQL driver to pom.xml (keep H2 for tests)

2. Update application-dev.yml:
   url: jdbc:postgresql://localhost:5432/mydb
   driver-class-name: org.postgresql.Driver

3. Keep application-test.yml using H2 with PostgreSQL mode:
   url: jdbc:h2:mem:testdb;MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE

4. Fix entity reserved words (@Table annotations)

5. Run PostgreSQL locally:
   docker run -d \
     -e POSTGRES_DB=mydb -e POSTGRES_USER=dev -e POSTGRES_PASSWORD=pass \
     -p 5432:5432 postgres:16-alpine

6. Fix column type differences:
   H2 is lenient, PostgreSQL is strict:
   - BOOLEAN (not TINYINT(1))
   - Case-sensitive identifiers
   - Stricter NULL handling
```

---

# 10. Database Migrations — Flyway vs Liquibase

## Why You Need Migrations (Not ddl-auto)

```
WITHOUT migrations:
  ddl-auto: update adds columns but NEVER removes them
  No history of what changed or when
  Prod and staging diverge over time
  Can't safely rollback a bad schema change
  "The DB is different on prod for some reason..."

WITH Flyway/Liquibase:
  Every change is a versioned SQL file in git
  Applied automatically in order at startup
  Full audit trail of all schema changes
  Environments stay in sync
  Safer deployments
```

## Flyway — Recommended Choice

```
WHY: Simpler, plain SQL, excellent Spring Boot auto-config,
     most widely used, easy to understand

Migration file naming convention:
  V{version}__{description}.sql    ← versioned, applied once
  R__{description}.sql             ← repeatable, re-runs when content changes
  U{version}__{description}.sql    ← undo (Flyway Teams paid feature)

  V1__create_users_table.sql
  V2__add_phone_to_users.sql
  V3__create_orders_table.sql
  V3.1__add_index_to_orders.sql    ← can use sub-versions

RULES:
  Location: src/main/resources/db/migration/
  NEVER edit an applied migration file (Flyway checksums it)
  NEVER delete a migration file
  NEVER reorder migration files
  Versioning can be: 1, 1.1, 2, 20240101, 20240101.1
```

### Flyway Migration Examples

```sql
-- V1__create_users_table.sql
CREATE TABLE users (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    email      VARCHAR(255) NOT NULL,
    role       VARCHAR(50)  NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_users_email UNIQUE (email)
);

CREATE INDEX idx_users_email ON users(email);

-- V2__create_orders_table.sql
CREATE TABLE orders (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT      NOT NULL,
    status     VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    total      DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status  ON orders(status);

-- V3__add_phone_to_users.sql
-- SAFE: adding nullable column — existing rows unaffected
ALTER TABLE users ADD COLUMN phone VARCHAR(20);

-- V4__add_soft_delete.sql
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP;
ALTER TABLE users ADD COLUMN is_active  BOOLEAN NOT NULL DEFAULT TRUE;
```

### Zero-Downtime Schema Changes

```sql
-- WRONG: Adding NOT NULL column without default (breaks existing rows)
-- V5__bad_example.sql
ALTER TABLE users ADD COLUMN age INT NOT NULL;  ❌ FAILS if rows exist

-- CORRECT: Multi-step approach

-- V5__add_age_nullable.sql (deploy with new code that writes age)
ALTER TABLE users ADD COLUMN age INT;

-- V6__backfill_age.sql (run after all rows written by new code)
UPDATE users SET age = 0 WHERE age IS NULL;

-- V7__add_age_not_null.sql (safe now, all rows have value)
ALTER TABLE users ALTER COLUMN age SET NOT NULL;
```

### Flyway Configuration

```yaml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true     # for existing DB that predates Flyway
    validate-on-migrate: true     # verify checksums on startup
    out-of-order: false           # don't apply V3 if V4 already applied
  jpa:
    hibernate:
      ddl-auto: validate          # MUST be validate when using Flyway
```

## Liquibase — The Alternative

```
WHY CHOOSE OVER FLYWAY:
  - Need rollback support (built-in, free)
  - Support multiple DB types in one project
  - Team prefers XML/YAML/JSON over SQL
  - More granular change tracking

Format options: XML, YAML, JSON, SQL

Example (XML format):
```

```xml
<!-- db/changelog/db.changelog-master.xml -->
<databaseChangeLog>

  <changeSet id="001" author="developer">
    <createTable tableName="users">
      <column name="id" type="BIGINT" autoIncrement="true">
        <constraints primaryKey="true" nullable="false"/>
      </column>
      <column name="email" type="VARCHAR(255)">
        <constraints nullable="false" unique="true"/>
      </column>
    </createTable>
  </changeSet>

  <changeSet id="002" author="developer">
    <addColumn tableName="users">
      <column name="phone" type="VARCHAR(20)"/>
    </addColumn>
    <!-- Explicit rollback -->
    <rollback>
      <dropColumn tableName="users" columnName="phone"/>
    </rollback>
  </changeSet>

</databaseChangeLog>
```

## Flyway vs Liquibase Decision

```
Choose Flyway when:
  New project, team knows SQL, simplicity preferred,
  Spring Boot project, single database type

Choose Liquibase when:
  Need rollback support, support multiple DB types,
  Existing Liquibase project, prefer declarative XML/YAML

Migration Flyway → Liquibase:
  1. Export current schema as Liquibase baseline changeset
  2. Mark existing data as already applied (tagDatabase)
  3. Remove flyway-core, add liquibase-core
  4. spring.flyway.enabled: false + spring.liquibase.enabled: true
  5. New changes → Liquibase changesets
```


---
# PART IV — CONTAINERIZATION
---

# 11. Docker Deep Dive

## Container vs VM

```
Virtual Machine:              Container:
────────────────              ──────────────
Full OS kernel copy           Shares host kernel
500MB+ overhead               ~5MB overhead
Minutes to start              Milliseconds to start
Strong isolation              Process-level isolation
Runs any OS                   Same kernel as host
```

## Layer Caching — The Most Important Concept

```
Each Dockerfile instruction = one cached layer
Layer key = SHA256 hash of instruction + content
If content unchanged = CACHE HIT = 0 seconds
If content changed = CACHE MISS = rebuild from here down

OPTIMAL ORDER (most stable → most volatile):
  FROM base-image              → never changes → always cached
  RUN adduser                  → never changes → always cached
  COPY pom.xml mvnw ./         → changes rarely (~5% of commits)
  RUN mvnw dependency:go-offline → changes when pom.xml changes
  COPY src ./                  → changes every commit
  RUN mvnw package             → changes every commit

WORST ORDER (what not to do):
  COPY . .                     → copies everything including src
  RUN mvnw dependency:go-offline → ALWAYS rebuilds (src changed!)
  Result: 5 minute build every commit

With optimal order:
  Most commits → only last 2 layers rebuild → 20 second builds
```

## Multi-Platform Builds

```bash
# Why: amd64 = Intel/AMD servers, arm64 = AWS Graviton + Apple M1
# Build for both in one command:

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/user/myapp:latest \
  --push .

# In GitHub Actions:
- uses: docker/setup-qemu-action@v3.2.0      # enables ARM emulation
- uses: docker/setup-buildx-action@v3.6.1    # enables multi-platform
- uses: docker/build-push-action@v5.4.0
  with:
    platforms: linux/amd64,linux/arm64
```

## Complete Docker Command Reference

```bash
# ── Build ──────────────────────────────────────────────────
docker build -t myapp:local .
docker build -t myapp:local -f Dockerfile .
docker build --no-cache -t myapp:local .        # force full rebuild
docker build --target builder .                 # build specific stage only

# ── Images ─────────────────────────────────────────────────
docker images
docker images myapp
docker rmi myapp:local
docker image prune                              # remove dangling images
docker image prune -a                          # remove all unused images

# ── Containers ─────────────────────────────────────────────
docker run -d -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=dev \
  --name myapp \
  --restart unless-stopped \
  myapp:local

docker ps                                       # running containers
docker ps -a                                    # all containers
docker stop myapp
docker start myapp
docker restart myapp
docker rm myapp
docker rm -f myapp                             # force stop + remove

# ── Debugging ──────────────────────────────────────────────
docker logs myapp
docker logs -f myapp                           # follow
docker logs --tail 100 myapp
docker exec -it myapp sh                       # interactive shell
docker exec myapp whoami                       # check user
docker inspect myapp                           # full JSON config
docker inspect --format='{{.State.Health.Status}}' myapp
docker stats                                   # live resource usage
docker stats myapp

# ── Registry ───────────────────────────────────────────────
docker login ghcr.io -u USERNAME
docker tag myapp:local ghcr.io/user/myapp:1.0.0
docker push ghcr.io/user/myapp:1.0.0
docker pull ghcr.io/user/myapp:1.0.0

# ── Cleanup ────────────────────────────────────────────────
docker system prune                            # clean unused resources
docker system prune -a                         # include unused images
docker volume prune                            # clean unused volumes
docker system df                               # show disk usage
```

---

# 12. Dockerfile — Every Option Explained

## Production Dockerfile (Fully Annotated)

```dockerfile
# ─────────────────────────────────────────────────────────
# STAGE 1: BUILD
# eclipse-temurin = recommended OpenJDK (was AdoptOpenJDK)
# 21-jdk-alpine = Java 21 JDK on Alpine Linux (minimal OS, ~340MB)
# AS builder = name this stage for reference in stage 2
# ─────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder

# WORKDIR: all subsequent commands run from /app
# Creates directory if it doesn't exist
WORKDIR /app

# COPY dependency files FIRST (separate cached layer)
# These change rarely → cache hit ~95% of builds
# IMPORTANT: .mvn/ folder is required for mvnw to work
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./

# Fix Windows line endings AND add execute permission
# chmod +x = make executable
# sed 's/\r$//' = remove Windows CRLF (\r\n → \n)
# && chains in ONE layer (fewer layers = smaller image)
RUN chmod +x mvnw && sed -i 's/\r$//' mvnw

# Download all Maven dependencies into .m2 cache
# -B = batch mode (no interactive prompts, clean CI output)
# dependency:go-offline = download everything needed
# THIS LAYER IS CACHED as long as pom.xml doesn't change
# Cache hit: this step takes 0 seconds instead of 2-3 minutes
RUN ./mvnw dependency:go-offline -B

# Copy source code AFTER downloading deps
# Source changes every commit, but deps don't
COPY src ./src

# Build the JAR
# -DskipTests: tests already ran in CI, skip here
# -B: batch mode for clean output
RUN ./mvnw clean package -DskipTests -B

# Extract Spring Boot layered JAR
# Spring Boot 3+ supports layered JARs for Docker optimization
# Creates 4 directories ordered by change frequency:
#   dependencies/          → external JARs (Spring, Hibernate, etc.)
#   spring-boot-loader/    → Spring Boot JAR launcher
#   snapshot-dependencies/ → SNAPSHOT versions
#   application/           → YOUR compiled code
# Benefit: docker layer per category → only application/ changes per commit
RUN java -Djarmode=layertools \
    -jar target/userservice-0.0.1-SNAPSHOT.jar extract \
    --destination target/extracted

# ─────────────────────────────────────────────────────────
# STAGE 2: RUNTIME
# eclipse-temurin:21-jre-alpine = JRE only (no compiler)
# ~200MB vs ~340MB for JDK
# Security: no compilation tools in production image
# ─────────────────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runtime

WORKDIR /app

# Create dedicated non-root user and group
# -S = system user (no home dir, no login shell)
# Running as root: ANY exploit in your app = root on server
# Running as appuser: exploit is contained to appuser's permissions
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy ONLY the extracted layers from builder stage
# Builder stage is DISCARDED after this — not in final image
# ORDER MATTERS: least-changed first (best Docker layer cache)
# dependencies/ changes: when you add/update a library (~5% of commits)
COPY --from=builder /app/target/extracted/dependencies/ ./
# spring-boot-loader/ changes: almost never
COPY --from=builder /app/target/extracted/spring-boot-loader/ ./
# snapshot-dependencies/ changes: SNAPSHOT version updates
COPY --from=builder /app/target/extracted/snapshot-dependencies/ ./
# application/ changes: EVERY commit (your code)
COPY --from=builder /app/target/extracted/application/ ./

# Switch to non-root user for all subsequent operations
USER appuser

# EXPOSE: document that port 8080 is used
# Does NOT publish the port — use -p 8080:8080 on docker run
# Used by docker inspect and docker-compose for documentation
EXPOSE 8080

# HEALTHCHECK: how Docker checks if container is healthy
# --interval=30s: run check every 30 seconds
# --timeout=10s: check must respond within 10 seconds
# --start-period=60s: don't count failures in first 60s (startup time)
# --retries=3: 3 consecutive failures = container marked "unhealthy"
#              → triggers restart policy
# wget -qO-: quiet, output to stdout (-O -)
# grep '"status":"UP"': verify actually UP not just responding
# || exit 1: if command fails, return 1 (unhealthy signal)
HEALTHCHECK --interval=30s \
            --timeout=10s \
            --start-period=60s \
            --retries=3 \
    CMD wget -qO- http://localhost:8080/actuator/health | \
        grep -q '"status":"UP"' || exit 1

# ENV: default JVM options (overrideable at runtime)
# +UseContainerSupport: JVM reads Docker memory limits
#   WITHOUT: JVM sees host RAM (16GB), allocates 4GB heap for 512MB container → OOM
#   WITH: JVM sees container limit (512MB), allocates 384MB heap → correct
# MaxRAMPercentage=75: max 75% of container limit for heap
# InitialRAMPercentage=50: start heap at 50% of container limit
# -Djava.security.egd: use /dev/urandom (non-blocking) vs /dev/random
#   /dev/random blocks if insufficient entropy → slow startup
#   /dev/urandom is good enough for most security needs
ENV JAVA_OPTS="-XX:+UseContainerSupport \
               -XX:MaxRAMPercentage=75.0 \
               -XX:InitialRAMPercentage=50.0 \
               -Djava.security.egd=file:/dev/./urandom \
               -Dfile.encoding=UTF-8"

# ENTRYPOINT vs CMD:
# ENTRYPOINT: executable, not easily overridden
# CMD: default args, easily overridden
# Using sh -c to allow $JAVA_OPTS variable expansion
# JarLauncher: Spring Boot's layered JAR launcher
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS org.springframework.boot.loader.launch.JarLauncher"]
```

## Dockerfile Anti-Patterns to Avoid

```dockerfile
# ❌ 1: Full JDK in production (huge + insecure)
FROM openjdk:17                 # 700MB, includes compiler
# ✅ Use: FROM eclipse-temurin:21-jre-alpine

# ❌ 2: Running as root
FROM eclipse-temurin:21-jre-alpine
# (no USER instruction)
# ✅ Add: RUN addgroup -S ag && adduser -S au -G ag && USER au

# ❌ 3: No health check
# ✅ Add HEALTHCHECK instruction

# ❌ 4: Secrets baked into image
ENV DB_PASSWORD=mysecret123     # visible in docker history!
# ✅ Pass at runtime: docker run -e DB_PASSWORD=$PASSWORD

# ❌ 5: Unpinned base image
FROM postgres:latest            # breaks when major version releases
# ✅ Use: FROM postgres:16-alpine

# ❌ 6: Copying everything before downloading dependencies
COPY . .                        # copies src/ too early
RUN mvnw dependency:go-offline  # ALWAYS cache miss — src changed!
# ✅ COPY pom.xml first, then deps, then COPY src

# ❌ 7: Multiple layers for same concern
RUN chmod +x mvnw
RUN sed -i 's/\r$//' mvnw      # two separate layers
# ✅ RUN chmod +x mvnw && sed -i 's/\r$//' mvnw  (one layer)
```

---

# 13. Docker Compose — Complete Reference

## Complete docker-compose.yml

```yaml
services:

  postgres:
    image: postgres:16-alpine
    container_name: myapp-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: myapp_db
      POSTGRES_USER: ${DB_USER:-devuser}      # env var with fallback default
      POSTGRES_PASSWORD: ${DB_PASSWORD:-devpass}
    ports:
      - "5432:5432"                           # host:container
    volumes:
      - postgres_data:/var/lib/postgresql/data  # named volume (persists)
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U devuser -d myapp_db"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 10s
    networks:
      - myapp-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  app:
    image: myapp:local                        # use pre-built (production pattern)
    container_name: myapp-app
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      SPRING_PROFILES_ACTIVE: dev
      # CRITICAL: use service name "postgres", NOT "localhost"
      # Inside Docker network, containers find each other by service name
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/myapp_db
      SPRING_DATASOURCE_USERNAME: devuser
      SPRING_DATASOURCE_PASSWORD: devpass
    depends_on:
      postgres:
        condition: service_healthy            # wait for postgres health check
    healthcheck:
      test: ["CMD-SHELL", "wget -qO- http://localhost:8080/actuator/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    networks:
      - myapp-network

volumes:
  postgres_data:
    name: myapp-postgres-data               # explicit name survives compose down

networks:
  myapp-network:
    name: myapp-network
    driver: bridge
```

## Docker Compose Command Reference

```bash
# Start
docker compose up                           # start, stream logs
docker compose up -d                        # start detached
docker compose up --build -d                # rebuild then start
docker compose up --force-recreate          # recreate even if unchanged
docker compose up app                       # start one service only
docker compose up --scale app=3             # start 3 app replicas

# Stop
docker compose down                         # stop + remove containers
docker compose down -v                      # ALSO delete volumes (wipes DB!)
docker compose down --rmi all              # ALSO delete images
docker compose stop                         # stop (keep containers)
docker compose start                        # start stopped containers

# Logs
docker compose logs -f                      # all logs, follow
docker compose logs -f app                  # one service, follow
docker compose logs --tail 100 postgres     # last 100 lines
docker compose logs --since 30m app         # last 30 minutes

# Status
docker compose ps                           # service status + health
docker compose top                          # running processes

# Execute
docker compose exec app sh
docker compose exec postgres psql -U devuser -d myapp_db
docker compose exec app wget -qO- http://localhost:8080/actuator/health

# Config
docker compose config                       # view merged config
docker compose config --services            # list service names

# Clean rebuild
docker compose down
docker compose build --no-cache
docker compose up -d

# Using different compose file
docker compose -f docker-compose-dev.yml up -d   # DB only
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Critical Networking Rule

```
RULE: Inside Docker network, use SERVICE NAME, not localhost

Why:
  "localhost" inside a container = that container itself
  "postgres"  inside a container = the postgres service by service name

Example:
  ❌ SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/db
     (app container connects to itself — no PostgreSQL there)
  
  ✅ SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/db
     (app container connects to 'postgres' service)

Works because: both containers are on myapp-network
Docker DNS resolves service names to container IPs automatically
```

## Restart Policies

```
no:             never restart (default)
always:         restart always (even on successful exit)
on-failure:     restart only on non-zero exit code
unless-stopped: restart always EXCEPT when manually stopped ← recommended
```

---

# 14. Container Registries — All Options

## Registry Comparison

```
Registry        | Cost              | Best for           | Auth in CI
───────────────────────────────────────────────────────────────────────
ghcr.io         | Free public       | GitHub projects    | GITHUB_TOKEN
Docker Hub      | Free public       | Open source        | Username + token
Amazon ECR      | $0.10/GB/month    | AWS deployments    | AWS IAM
Google AR       | $0.10/GB/month    | GCP deployments    | Service account
Azure ACR       | $0.167/GB/month   | Azure deployments  | Service principal
Harbor (self)   | Free (run it)     | Private/compliance | Username + token
```

## ghcr.io Setup and Usage

```bash
# Login
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Tag
docker tag myapp:local ghcr.io/username/myapp:1.0.0

# Push
docker push ghcr.io/username/myapp:1.0.0

# Make image public (so Railway/other platforms can pull without auth):
# GitHub → Your Profile → Packages → image → Package Settings
# → Change visibility → Public

# Image URL patterns:
ghcr.io/username/image:tag          # personal account
ghcr.io/organization/image:tag      # org account
```

## CI/CD Login for Each Registry

```yaml
# ghcr.io (no extra secrets needed)
- uses: docker/login-action@v3.3.0
  with:
    registry: ghcr.io
    username: ${{ github.actor }}
    password: ${{ secrets.GITHUB_TOKEN }}   # automatic, zero config

# Docker Hub
- uses: docker/login-action@v3.3.0
  with:
    username: ${{ secrets.DOCKERHUB_USERNAME }}
    password: ${{ secrets.DOCKERHUB_TOKEN }}

# Amazon ECR
- uses: aws-actions/configure-aws-credentials@v4
  with:
    aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
    aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    aws-region: us-east-1
- id: login-ecr
  uses: aws-actions/amazon-ecr-login@v2
# Then use: ${{ steps.login-ecr.outputs.registry }}/image:tag
```

## Image Tagging Strategy

```bash
# What your CI pipeline should produce:
ghcr.io/user/myapp:latest            # latest from main branch only
ghcr.io/user/myapp:1.2.3             # semantic version (from git tag)
ghcr.io/user/myapp:main-a1b2c3d      # branch + git SHA (most traceable)
ghcr.io/user/myapp:develop           # develop branch latest
ghcr.io/user/myapp:pr-42             # pull request (for review environments)

# NEVER use only :latest in production
# :latest is mutable — you can't roll back to "the previous latest"
# Use SHA-tagged images for rollbacks

# In GitHub Actions metadata-action:
tags: |
  type=ref,event=branch              # branch name: develop, main, feature-x
  type=sha,prefix={{branch}}-        # main-a1b2c3d (branch + SHA)
  type=semver,pattern={{version}}    # 1.2.3 (from git tag v1.2.3)
  type=raw,value=latest,enable=${{ github.ref == 'refs/heads/main' }}
```


---
# PART V — CI PIPELINE
---

# 15. CI Tools Comparison

```
GitHub Actions:
  BEST FOR: GitHub repos, small-medium teams, fast setup
  COST: 2000 free min/month (private), unlimited public
  SETUP: Zero — just create .github/workflows/*.yml
  PROS: Native GitHub integration, huge marketplace, GITHUB_TOKEN auto-auth
  CONS: Vendor lock-in, limited beyond 2000 mins without payment

Jenkins:
  BEST FOR: Self-hosted, enterprise, complex pipelines
  COST: Free software (you pay for servers)
  SETUP: Install Jenkins server, configure agents
  PROS: Most flexible, huge plugin ecosystem, runs anywhere
  CONS: High maintenance, complex setup, outdated UI
  MIGRATE TO when: On-premise required, code can't leave your servers

GitLab CI:
  BEST FOR: GitLab repos, integrated DevOps platform
  COST: Free tier (400 min/month), $19+/month paid
  SETUP: .gitlab-ci.yml in root
  PROS: Built-in container registry, environments, deployment tracking
  MIGRATE TO when: Moving from GitHub to GitLab

CircleCI:
  BEST FOR: Performance, parallelism, fast builds
  COST: Free tier (6000 min/month), $15+/month paid
  SETUP: .circleci/config.yml
  PROS: Faster builds, better caching, orbs (reusable config)
  MIGRATE TO when: Build speed is pain point

Migrating GitHub Actions → Jenkins:
  1. Install Jenkins + plugins (Docker, GitHub, Pipeline)
  2. Create Jenkinsfile from your ci.yml
  3. Point GitHub webhooks to Jenkins
  4. Test parity between pipelines
  5. Cut over once confident

Migrating GitHub Actions → GitLab CI:
  1. Mirror repo to GitLab
  2. Create .gitlab-ci.yml (equivalent syntax)
  3. Configure GitLab CI variables (equivalent to GitHub Secrets)
  4. Test pipeline
  5. Move DNS/webhooks
```

---

# 16. GitHub Actions — Complete Reference

## Complete Syntax Guide

```yaml
name: Pipeline Name

# ── TRIGGERS ────────────────────────────────────────────────
on:
  push:
    branches: [main, develop, 'feature/**', 'hotfix/**']
    tags: ['v*']                    # trigger on version tags
    paths-ignore: ['**.md', 'docs/**']  # skip on doc-only changes

  pull_request:
    branches: [main, develop]
    types: [opened, synchronize, reopened]  # default: all

  schedule:
    - cron: '0 2 * * 1-5'          # 2am Mon-Fri UTC
    # cron format: min hour day month weekday

  workflow_dispatch:                 # manual trigger from UI
    inputs:
      environment:
        description: 'Deploy to'
        type: choice
        options: [staging, production]
        required: true

  workflow_call:                     # called by another workflow
    inputs:
      image-tag:
        type: string
        required: true

# ── CONCURRENCY ─────────────────────────────────────────────
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true          # cancel stale runs on same branch
  # NEVER set cancel-in-progress: true for deployment jobs

# ── GLOBAL ENV VARS ─────────────────────────────────────────
env:
  JAVA_VERSION: '21'
  REGISTRY: ghcr.io
  IMAGE_FULL: ghcr.io/${{ github.repository_owner }}/myapp

# ── JOBS ────────────────────────────────────────────────────
jobs:
  build:
    name: Build and Test
    runs-on: ubuntu-latest          # ubuntu-22.04, windows-latest, macos-latest
    needs: []                       # no dependencies
    if: always()                    # conditional execution

    timeout-minutes: 30             # cancel if takes too long

    permissions:                    # LEAST PRIVILEGE principle
      contents: read
      packages: write
      security-events: write

    environment:                    # links to GitHub Environment
      name: production
      url: https://myapp.com

    strategy:                       # matrix builds
      fail-fast: false
      matrix:
        java: [17, 21]
        os: [ubuntu-latest, windows-latest]

    outputs:                        # pass data to other jobs
      image-tag: ${{ steps.meta.outputs.version }}

    steps:
      # ── Checkout ────────────────────────────────────────
      - uses: actions/checkout@v4.2.2
        with:
          fetch-depth: 0            # full history (for git describe, semantic-release)
          token: ${{ secrets.PAT }} # use PAT if need to push back

      # ── Java ────────────────────────────────────────────
      - uses: actions/setup-java@v4.7.0
        with:
          java-version: ${{ env.JAVA_VERSION }}
          distribution: 'temurin'   # eclipse-temurin (recommended)
          cache: 'maven'            # auto-cache ~/.m2

      # ── Set step output ─────────────────────────────────
      - name: Get version
        id: version
        run: |
          VERSION=$(./mvnw help:evaluate -Dexpression=project.version -q -DforceStdout)
          echo "version=$VERSION" >> $GITHUB_OUTPUT
          echo "tag=v$VERSION" >> $GITHUB_OUTPUT

      # ── Use step output ─────────────────────────────────
      - name: Use version
        run: echo "Building version ${{ steps.version.outputs.version }}"

      # ── Conditional step ────────────────────────────────
      - name: Only on main
        if: github.ref == 'refs/heads/main'
        run: echo "deploying to production"

      # ── Multi-line with error handling ──────────────────
      - name: Build
        shell: bash
        run: |
          set -e                    # exit on error
          set -o pipefail           # exit on pipe failure
          chmod +x mvnw
          ./mvnw clean package -DskipTests -B

      # ── With secrets ────────────────────────────────────
      - name: Deploy
        env:
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
          PUBLIC_URL: ${{ vars.PUBLIC_URL }}      # non-secret variable
        run: curl -H "Auth: $DEPLOY_TOKEN" $PUBLIC_URL

      # ── Upload artifact ─────────────────────────────────
      - uses: actions/upload-artifact@v4.6.2
        if: always()               # upload even on test failure
        with:
          name: test-results
          path: target/surefire-reports/
          retention-days: 7

      # ── Download artifact ───────────────────────────────
      - uses: actions/download-artifact@v4
        with:
          name: test-results
          path: target/
```

## Context Variables Reference

```yaml
# GitHub context
${{ github.ref }}              # refs/heads/main
${{ github.ref_name }}         # main
${{ github.sha }}              # abc1234def5678... (full SHA)
${{ github.actor }}            # username that triggered
${{ github.repository }}       # owner/repo
${{ github.repository_owner }} # owner
${{ github.event_name }}       # push, pull_request, schedule
${{ github.workspace }}        # /home/runner/work/repo/repo
${{ github.run_number }}       # sequential build number
${{ github.run_id }}           # unique run ID

# Runner context
${{ runner.os }}               # Linux, Windows, macOS
${{ runner.arch }}             # X64, ARM64

# Job context
${{ job.status }}              # success, failure, cancelled

# Secrets
${{ secrets.MY_SECRET }}
${{ secrets.GITHUB_TOKEN }}    # auto-provided, zero setup

# Variables (non-secret)
${{ vars.MY_VAR }}

# Job outputs
${{ needs.build.outputs.image-tag }}

# Conditional expressions
${{ github.ref == 'refs/heads/main' }}
${{ contains(github.ref, 'feature') }}
${{ startsWith(github.ref, 'refs/tags/v') }}
```

## If Conditions Reference

```yaml
# Branch conditions
if: github.ref == 'refs/heads/main'
if: github.ref == 'refs/heads/develop'
if: startsWith(github.ref, 'refs/heads/feature/')
if: startsWith(github.ref, 'refs/tags/v')

# Multiple conditions
if: >
  github.ref == 'refs/heads/main' ||
  github.ref == 'refs/heads/develop'

# Event conditions
if: github.event_name == 'push'
if: github.event_name == 'pull_request'
if: github.event_name != 'schedule'

# Status conditions
if: success()              # previous steps/jobs all succeeded
if: failure()              # a previous step/job failed
if: always()               # run regardless of previous status
if: cancelled()            # workflow was cancelled

# Combined
if: github.ref == 'refs/heads/main' && success()
if: failure() && github.ref == 'refs/heads/main'
```

---

# 17. Testing Strategy in CI

## Test Types and When to Run Each

```
Unit Tests:
  WHAT: Test one class in isolation, mock all dependencies
  SPEED: Milliseconds per test
  RUN: Every push to every branch
  TOOLS: JUnit 5, Mockito, AssertJ

Integration Tests:
  WHAT: Test with real DB, real HTTP, real external services
  SPEED: Seconds to minutes
  RUN: Every PR, every push to develop/main
  TOOLS: Testcontainers, MockMvc, @SpringBootTest

E2E Tests:
  WHAT: Full user journey through the UI
  SPEED: Minutes
  RUN: Nightly, or before production deploy
  TOOLS: Selenium, Playwright, Cypress

Contract Tests:
  WHAT: Verify API contract between services
  RUN: On API changes
  TOOLS: Spring Cloud Contract, Pact
```

## Unit Tests with Mockito

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock UserRepository userRepository;
    @InjectMocks UserServiceImpl userService;

    @Test
    void createUser_success() {
        // ARRANGE
        UserRequestDTO dto = new UserRequestDTO();
        dto.setName("Alice");
        dto.setEmail("alice@test.com");
        dto.setRole("ADMIN");

        User saved = User.builder().id(1L).name("Alice")
            .email("alice@test.com").role("ADMIN").build();

        when(userRepository.existsByEmail("alice@test.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(saved);

        // ACT
        UserResponseDTO result = userService.createUser(dto);

        // ASSERT
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getEmail()).isEqualTo("alice@test.com");
        verify(userRepository, times(1)).save(any(User.class));
        verifyNoMoreInteractions(userRepository);
    }

    @Test
    void createUser_duplicateEmail_throwsException() {
        UserRequestDTO dto = new UserRequestDTO();
        dto.setEmail("dup@test.com");

        when(userRepository.existsByEmail("dup@test.com")).thenReturn(true);

        assertThrows(IllegalArgumentException.class,
            () -> userService.createUser(dto));

        verify(userRepository, never()).save(any());
    }
}
```

## Integration Tests with Testcontainers

```java
// Real PostgreSQL in Docker, automatically managed by Testcontainers
@SpringBootTest(webEnvironment = RANDOM_PORT)
@Testcontainers
@ActiveProfiles("test")
class UserControllerIT {

    @Container
    static PostgreSQLContainer<?> postgres =
        new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("testdb")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.flyway.enabled", () -> "true");
    }

    @Autowired TestRestTemplate restTemplate;
    @Autowired UserRepository userRepository;

    @BeforeEach void clean() { userRepository.deleteAll(); }

    @Test
    void createUser_validRequest_persistsAndReturns201() {
        UserRequestDTO dto = new UserRequestDTO();
        dto.setName("Alice");
        dto.setEmail("alice@test.com");
        dto.setRole("ADMIN");

        var response = restTemplate.postForEntity(
            "/api/v1/users", dto, UserResponseDTO.class);

        assertThat(response.getStatusCode()).isEqualTo(CREATED);
        assertThat(response.getBody().getEmail()).isEqualTo("alice@test.com");
        assertThat(userRepository.count()).isEqualTo(1);
    }
}
```

---

# 18. Code Quality Tools

## Checkstyle — Style Enforcement

```xml
<!-- checkstyle.xml — complete config -->
<?xml version="1.0"?>
<!DOCTYPE module PUBLIC
    "-//Checkstyle//DTD Checkstyle Configuration 1.3//EN"
    "https://checkstyle.org/dtds/configuration_1_3.dtd">
<module name="Checker">
  <property name="severity" value="error"/>
  <module name="FileTabCharacter"/>      <!-- no tabs anywhere -->
  <module name="NewlineAtEndOfFile"/>

  <module name="TreeWalker">
    <!-- Imports -->
    <module name="UnusedImports"/>
    <module name="AvoidStarImport"/>     <!-- no import java.util.* -->
    <module name="IllegalImport"/>

    <!-- Braces — always required even for single-line ifs -->
    <module name="NeedBraces"/>
    <module name="LeftCurly"/>
    <module name="RightCurly"/>

    <!-- Whitespace -->
    <module name="WhitespaceAround"/>
    <module name="EmptyLineSeparator"/> <!-- blank line between methods -->

    <!-- Size limits -->
    <module name="MethodLength"><property name="max" value="50"/></module>
    <module name="LineLength"><property name="max" value="120"/></module>
    <module name="ParameterNumber"><property name="max" value="7"/></module>

    <!-- Complexity -->
    <module name="CyclomaticComplexity"><property name="max" value="10"/></module>

    <!-- Best practices -->
    <module name="EqualsHashCode"/>
    <module name="StringLiteralEquality"/>  <!-- no str == "literal" -->
    <module name="MissingSwitchDefault"/>
  </module>
</module>
```

## Common Violations and Fixes

```java
// ❌ Wildcard import
import jakarta.persistence.*;
// ✅ Explicit imports
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Column;

// ❌ Tab character (line 9 has a tab)
	private String name;     // tab (\t)
// ✅ Spaces (4 spaces)
    private String name;     // 4 spaces

// ❌ Missing braces
if (x > 0)
    doSomething();
// ✅ Braces required
if (x > 0) {
    doSomething();
}

// ❌ Star import in controller
import org.springframework.web.bind.annotation.*;
// ✅ Explicit
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
// etc.
```

## IDE Auto-Fix (Prevent Violations)

```
IntelliJ:
  Settings → Editor → Code Style → Java
    Tabs and Indents: Use tab character = OFF, Indent = 4
  Settings → Tools → Actions on Save
    ✅ Reformat code
    ✅ Optimize imports

VS Code — settings.json:
  "editor.formatOnSave": true,
  "editor.tabSize": 4,
  "editor.insertSpaces": true,
  "[java]": {
    "editor.defaultFormatter": "redhat.java"
  }
```

---

# 19. Security Scanning

## Trivy — Container Vulnerability Scanning

```yaml
- name: Trivy image scan
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ghcr.io/user/myapp:latest
    format: 'sarif'
    output: 'trivy-results.sarif'
    severity: 'CRITICAL,HIGH'
    ignore-unfixed: true           # skip unfixable CVEs
    vuln-type: 'os,library'

- uses: github/codeql-action/upload-sarif@v3
  if: always()
  with:
    sarif_file: 'trivy-results.sarif'
# Results visible in: GitHub → Security → Code scanning alerts
```

## OWASP Dependency Check

```xml
<!-- pom.xml -->
<plugin>
  <groupId>org.owasp</groupId>
  <artifactId>dependency-check-maven</artifactId>
  <version>9.0.9</version>
  <configuration>
    <failBuildOnCVSS>7</failBuildOnCVSS>    <!-- fail on HIGH/CRITICAL -->
    <suppressionFile>owasp-suppressions.xml</suppressionFile>
  </configuration>
</plugin>
```

```yaml
# In CI:
- name: OWASP Dependency Check
  run: ./mvnw org.owasp:dependency-check-maven:check -B
  continue-on-error: true          # report but don't fail build (optional)
```

## Secret Scanning (Prevent Committing Secrets)

```yaml
# Scan PR/push for accidentally committed secrets
- name: Secret Scan
  uses: trufflesecurity/trufflehog@main
  with:
    path: ./
    base: ${{ github.event.repository.default_branch }}
    head: HEAD

# Alternative: gitleaks
- uses: gitleaks/gitleaks-action@v2
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```


---
# PART VI — CD PIPELINE & DEPLOYMENT
---

# 20. Deployment Strategies

## Strategy 1: Recreate (Has Downtime)

```
OLD running → STOP → DEPLOY NEW → START NEW
              ↑ downtime here (seconds to minutes)

WHEN TO USE: Dev/staging only, apps that tolerate downtime
HOW: docker stop + docker run with new image
ROLLBACK: docker stop + docker run with old image tag
```

## Strategy 2: Rolling Update (Recommended)

```
3 pods of v1: [v1][v1][v1]
Step 1:       [v2][v1][v1]  ← update one
Step 2:       [v2][v2][v1]  ← update another
Step 3:       [v2][v2][v2]  ← update last

PROS: No downtime, gradual, easy rollback
CONS: Both versions in production simultaneously
REQUIREMENT: Code must be backward compatible with old DB schema

In Kubernetes:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1           # max extra pods during rollout
      maxUnavailable: 0     # never go below desired count
```

## Strategy 3: Blue/Green (Zero Downtime + Instant Rollback)

```
BLUE  = current production → all traffic
GREEN = new version → no traffic

1. Deploy new version to GREEN
2. Test GREEN thoroughly
3. Switch load balancer: all traffic → GREEN
4. Keep BLUE running for quick rollback
5. After confidence: scale down BLUE

ROLLBACK: Switch load balancer back to BLUE (seconds)
COST: 2x infrastructure during deployment window
BEST FOR: Critical apps, high-risk deployments
```

## Strategy 4: Canary (Gradual Traffic Shift)

```
Canary = small percentage of users get new version first

[v2] → 5% traffic    ← canary
[v1] → 95% traffic   ← stable

Monitor: error rates, latency, business metrics
If good: 5% → 25% → 50% → 100%
If bad:  0% immediately (instant rollback, minimal user impact)

TOOLS: Kubernetes + Argo Rollouts, AWS CodeDeploy, Flagger
BEST FOR: High-traffic apps, risk-averse teams
```

## Strategy 5: Feature Flags

```
Deploy code but hide feature behind a flag
Flag = OFF for users while testing internally
Toggle ON gradually: 0% → 1% → 5% → 100% of users
Kill switch: toggle OFF instantly if issues arise

BENEFITS:
  Deploy != Release (decouple the two)
  Instant rollback without redeployment
  A/B testing
  Dark launches (deploy early, release later)

TOOLS: LaunchDarkly, Unleash (OSS), Split.io, Flagsmith

Simple feature flag in Spring Boot:
  @Value("${feature.newUserFlow:false}")
  private boolean newUserFlowEnabled;
  
  if (newUserFlowEnabled) { newFlow(); } else { oldFlow(); }
```

---

# 21. Deployment Targets — Complete Guide

## Railway

```
BEST FOR: Learning, MVP, side projects
COST: Free tier ($5 credit/month), $20/month hobby
DOCKER: Yes — connect Docker image from registry
SETUP TIME: 5 minutes

Key IDs (found in URL):
  Project ID: railway.com/project/{PROJECT-ID}/...
  Service ID: .../service/{SERVICE-ID}/...

Project Token (for CI/CD):
  Project → Settings → Tokens → Generate
  NOT Account Settings → Tokens (different scope!)

Deploy Hook (simplest CI/CD):
  Service → Settings → Deploy → Generate Deploy Hook
  Returns URL: https://backboard.railway.app/hooks/deploy/xxx
  Use in CI: run: curl -X POST "${{ secrets.RAILWAY_DEPLOY_HOOK }}"

Environment Variables:
  Service → Variables tab
  Required:
    SPRING_PROFILES_ACTIVE = prod
    PORT = 8080
    DB_URL = (from postgres service)
    DB_USER = (PGUSER from postgres service)
    DB_PASSWORD = (PGPASSWORD from postgres service)

railway.toml:
  [build]
  builder = "dockerfile"
  dockerfilePath = "Dockerfile"

  [deploy]
  healthcheckPath = "/actuator/health"
  healthcheckTimeout = 60
  restartPolicyType = "on_failure"
```

## DigitalOcean Droplet (Best for Learning DevOps)

```
WHY: Raw Linux server — you learn everything
COST: $6/month (1vCPU, 1GB RAM) — enough for learning
BEST EXPERIENCE: More educational than managed platforms

Setup (one-time):
  1. Create Droplet → Ubuntu 22.04
  2. Install Docker: curl -fsSL https://get.docker.com | sh
  3. Create deploy user: useradd -m deploy && usermod -aG docker deploy
  4. Add SSH key for deploy user
  5. Install nginx: apt install nginx
  6. Configure nginx reverse proxy to localhost:8080
  7. SSL with certbot: certbot --nginx -d yourdomain.com

CI/CD SSH deploy:
- uses: appleboy/ssh-action@v1.0.3
  with:
    host: ${{ secrets.DROPLET_IP }}
    username: deploy
    key: ${{ secrets.SSH_PRIVATE_KEY }}
    script: |
      docker pull ghcr.io/${{ github.repository_owner }}/myapp:latest
      docker stop myapp || true
      docker rm myapp || true
      docker run -d --name myapp --restart unless-stopped \
        -p 8080:8080 \
        -e SPRING_PROFILES_ACTIVE=prod \
        -e DB_URL=${{ secrets.DB_URL }} \
        ghcr.io/${{ github.repository_owner }}/myapp:latest
      sleep 10
      curl -f http://localhost:8080/actuator/health || exit 1
```

## AWS ECS (Production Standard)

```
WHAT: AWS-managed container service, no Kubernetes complexity
COST: Pay per vCPU + memory (roughly $15-50/month small app)
WHEN: AWS ecosystem, production scale

Key concepts:
  Task Definition → what to run (image, CPU, memory, env vars)
  Service         → how many tasks, scaling rules
  Cluster         → group of servers running tasks
  ALB             → Application Load Balancer in front

CI/CD to ECS:
  1. Build and push image to ECR
  2. Update task definition with new image tag
  3. Deploy task definition to ECS service
  4. ECS handles rolling update
  5. Health check validates each new task before old one stops
```

## Google Cloud Run (Serverless Containers)

```
WHAT: Run containers without managing servers, scales to zero
COST: Pay per request (can be nearly free for low traffic)
BEST FOR: Variable traffic, microservices, event-driven

Deploy from CI:
  - uses: google-github-actions/deploy-cloudrun@v2
    with:
      service: userservice
      region: us-central1
      image: gcr.io/project/userservice:${{ github.sha }}

Pros: Zero infra management, automatic HTTPS, scales to zero
Cons: Cold starts, 60min request timeout, stateless only
```

## Render

```
BEST FOR: Heroku replacements, simple deployments
COST: Free tier (sleeps after 15min), $7/month always-on
DOCKER: Deploy from Dockerfile

render.yaml (infra as code):
  services:
    - type: web
      name: userservice
      env: docker
      dockerfilePath: ./Dockerfile
      healthCheckPath: /actuator/health
      envVars:
        - key: SPRING_PROFILES_ACTIVE
          value: prod
        - key: PORT
          value: 8080
  databases:
    - name: userdb
      databaseName: myapp
```

## Fly.io

```
BEST FOR: Global edge deployment, Docker-native, cost-effective
COST: Free for basic apps (~$3-10/month small app)
DIFFERENTIATOR: Deploy to multiple regions cheaply

fly.toml:
  app = "myapp"
  primary_region = "iad"    # IAD = Ashburn VA (US East)

  [build]
  dockerfile = "Dockerfile"

  [env]
  PORT = "8080"
  SPRING_PROFILES_ACTIVE = "prod"

  [http_service]
  internal_port = 8080
  force_https = true

  [[vm]]
  memory = "512mb"
  cpus = 1

CI/CD deploy:
  - uses: superfly/flyctl-actions/setup-flyctl@master
  - run: flyctl deploy --remote-only
    env:
      FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

---

# PART VII — PRODUCTION ENGINEERING
---

# 22. Secrets Management

## Why Secrets in Code = Security Incident

```
Secrets in git = permanently compromised
Even if deleted from files, they're in git history:
  git log --all --full-history -- .env
  → shows the deleted .env file with your password

GitHub searches public repos for secrets.
Bots scan GitHub 24/7.
Your password is stolen within minutes of a public push.
```

## Level 1: GitHub Secrets (Start Here)

```
Types:
  Repository secrets  → available to all workflows
  Environment secrets → only in specific environment workflows
  Organization secrets → shared across org repos

Setting secrets:
  GitHub → repo → Settings → Secrets and variables → Actions → New secret

Accessing:
  ${{ secrets.MY_SECRET }}
  ${{ secrets.GITHUB_TOKEN }}    ← automatic, no setup needed

Best practices:
  Different secret per environment:
    STAGING_DB_PASSWORD  (in staging environment)
    PROD_DB_PASSWORD     (in production environment)
  
  Never print secrets:
  ❌ run: echo ${{ secrets.PASSWORD }}
  ✅ env: { PASS: ${{ secrets.PASSWORD }} }
     run: curl -u user:$PASS ...
```

## Level 2: Environment-Specific Secrets

```
GitHub → Settings → Environments → staging → Add secret
GitHub → Settings → Environments → production → Add secret

# In workflow — staging secrets only available in staging environment:
deploy-staging:
  environment: staging      # this environment's secrets injected
  steps:
    - run: curl -X POST "${{ secrets.RAILWAY_DEPLOY_HOOK }}"
    # RAILWAY_DEPLOY_HOOK comes from staging environment, not repo secrets

deploy-production:
  environment: production   # production environment's secrets
  steps:
    - run: curl -X POST "${{ secrets.RAILWAY_DEPLOY_HOOK }}"
    # RAILWAY_DEPLOY_HOOK here is DIFFERENT (prod hook vs staging hook)
```

## Level 3: Doppler (Team Secret Sync)

```
WHAT: Central secret management, sync to all environments
WHY: One place to update secrets, propagates everywhere
COST: Free tier available

Workflow:
  Doppler web UI → set secrets
  Local dev: doppler run -- ./mvnw spring-boot:run
  CI: doppler secrets download --no-file --format env → inject to pipeline
  Production: Doppler injects into Railway/AWS/GCP directly

Integration with Spring Boot:
  doppler run -- java -jar app.jar
  Doppler injects all secrets as env vars → Spring reads ${SECRET_NAME}
```

## Level 4: HashiCorp Vault (Enterprise)

```
WHAT: Enterprise secrets management (self-hosted or cloud)
WHEN: Compliance, secret rotation, audit requirements
KILLER FEATURES: Dynamic secrets, auto-rotation, audit log

Dynamic secrets example:
  App requests DB credentials → Vault creates temp PostgreSQL user
  Credentials valid for 1 hour → automatically revoked
  No long-lived passwords
  Every request gets unique credentials

Spring Boot:
  spring-cloud-starter-vault-config
  bootstrap.yml:
    spring.cloud.vault:
      uri: https://vault.company.com
      authentication: TOKEN
      token: ${VAULT_TOKEN}
      kv:
        enabled: true
        application-name: myapp
```

---

# 23. Health Checks & Readiness

## Three Types of Health in Production

```
LIVENESS:   Is the application alive at all?
            NO → restart the container (might be stuck)
            Check: JVM alive, basic response
            URL: /actuator/health/liveness

READINESS:  Can the application serve requests right now?
            NO → remove from load balancer (don't send traffic)
            Don't restart, it might just be warming up
            Check: DB connected, caches warm, dependencies available
            URL: /actuator/health/readiness

STARTUP:    Has the application finished starting up?
            Separate from liveness — apps can take 60+ seconds
            Once passed, liveness and readiness checks begin
            URL: /actuator/health (during startup period)
```

## Spring Boot Actuator Configuration

```yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus,liveness,readiness
  endpoint:
    health:
      show-details: when-authorized   # anonymous: {status:UP}, auth: full details
      probes:
        enabled: true                 # enables /liveness and /readiness
      group:
        readiness:
          include: readinessState,db  # fail readiness if DB down
        liveness:
          include: livenessState      # only JVM state for liveness
```

## Custom Health Indicator

```java
@Component
public class DatabaseHealthIndicator implements HealthIndicator {
    private final UserRepository userRepository;

    @Override
    public Health health() {
        try {
            userRepository.count();                     // test DB connectivity
            return Health.up()
                .withDetail("database", "connected")
                .withDetail("responseTime", "< 100ms")
                .build();
        } catch (Exception e) {
            return Health.down()
                .withDetail("database", "unreachable")
                .withException(e)
                .build();
        }
    }
}
```

---

# 24. Monitoring & Alerting

## The Observability Stack

```
METRICS → Prometheus + Grafana
  What: numbers over time (request rate, error rate, latency, memory)
  Collection: Prometheus scrapes /actuator/prometheus every 15s
  Visualization: Grafana dashboards

LOGS → Loki + Grafana (or ELK: Elasticsearch + Logstash + Kibana)
  What: text events with timestamps
  Collection: stdout → log aggregator
  Query: find all ERRORs in last hour

TRACES → Jaeger or Zipkin (with OpenTelemetry)
  What: full request path across services
  Query: why did this request take 2 seconds?

ALERTS → AlertManager → Slack/PagerDuty/Email
  What: fire when metrics cross threshold
  Example: "error rate > 5% for 5 consecutive minutes"
```

## Prometheus + Grafana with Docker Compose

```yaml
# Add to docker-compose.yml:
  prometheus:
    image: prom/prometheus:v2.47.0
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
    networks:
      - myapp-network

  grafana:
    image: grafana/grafana:10.1.0
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    ports:
      - "3000:3000"                   # http://localhost:3000
    depends_on:
      - prometheus
    networks:
      - myapp-network
```

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
scrape_configs:
  - job_name: 'spring-boot'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['app:8080']
```

## Key Metrics to Alert On

```
HTTP Error Rate:
  Alert when: sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m])) /
              sum(rate(http_server_requests_seconds_count[5m])) > 0.05
  Threshold: > 5% error rate for 5 minutes

P99 Latency:
  Alert when: histogram_quantile(0.99, http_server_requests_seconds_bucket) > 1
  Threshold: > 1 second P99 for 2 minutes

JVM Memory:
  Alert when: jvm_memory_used_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"} > 0.85
  Threshold: > 85% heap for 5 minutes

DB Connection Pool:
  Alert when: hikaricp_connections_pending > 0
  Threshold: Any pending connections for > 1 minute
```

---

# 25. Rollbacks & Recovery

## Rollback by Re-deploying Previous Image

```bash
# Every deploy tagged with branch + SHA:
# main-a1b2c3d → current (broken)
# main-b2c3d4e → previous (good)

# Railway:
railway redeploy --image ghcr.io/user/myapp:main-b2c3d4e --yes

# Docker (DigitalOcean VPS):
docker stop myapp && docker rm myapp
docker run -d --name myapp \
  ghcr.io/user/myapp:main-b2c3d4e

# Kubernetes:
kubectl rollout undo deployment/myapp -n production

# LESSON: Always tag with SHA, never only :latest
# :latest can't be rolled back (what was "latest" an hour ago?)
```

## Database Rollback (The Hard Part)

```
APPLICATION rollback = easy (redeploy previous image)
DATABASE rollback    = HARD (data may have been written)

Safe migration patterns:
  ADD column as nullable first → deploy code → backfill → add NOT NULL
  NEVER drop column in same deploy as removing code reference
  NEVER rename column (add new, migrate, remove old)
  NEVER change column type without migration period

Flyway rollback (paid Flyway Teams):
  U2__undo_add_phone.sql
  ALTER TABLE users DROP COLUMN IF EXISTS phone;
  Run: flyway undo

Manual rollback script (free alternative):
  Keep V_undo_scripts/ directory with manual rollback SQL
  Apply manually if needed

BEST APPROACH: Write backward-compatible migrations
  Never need rollback if both old and new code work with same schema
```

## Incident Response

```
SEVERITY 1: Production down (all users affected)
  0min  → Page on-call
  2min  → New deploy? Config change? Infrastructure issue?
  5min  → If new deploy: ROLLBACK IMMEDIATELY, ask questions later
  5min  → Post status update to stakeholders
  15min → Root cause investigation
  30min → Post-mortem scheduled

SEVERITY 2: Degraded (some users affected)
  5min  → Check metrics: error rate spike? latency increase?
  10min → Identify affected endpoints/users
  15min → Fix forward or rollback
  60min → Post-mortem scheduled

POST-MORTEM (always blameless):
  Q: What happened?
  Q: Timeline of events (when was it deployed? when detected? when resolved?)
  Q: Root cause (the REAL cause, not symptoms)
  Q: What went well?
  Q: What went wrong?
  Q: Action items (with owners and deadlines)
  Q: How do we prevent recurrence?
```

---
# PART VIII — ADVANCED TOPICS
---

# 26. Kubernetes — When and Why

## When NOT to Use Kubernetes

```
DON'T use Kubernetes if:
  - Single application
  - Team < 5 engineers
  - Less than 10 microservices
  - No dedicated DevOps engineer
  - Railway/Render/Fly.io meets your needs

"We use Kubernetes" is not impressive if:
  - You have 2 services and 3 engineers
  - You spend more time managing K8s than building features
  - Your team doesn't understand it

Real cost of Kubernetes:
  - 3-6 months learning curve for the team
  - Dedicated ops time to maintain
  - $70+/month for managed Kubernetes (EKS, GKE, DOKS)
  - More complex debugging
  - More things that can go wrong
```

## When You Need Kubernetes

```
DO use Kubernetes when:
  - 10+ microservices
  - Need auto-scaling (traffic varies 10x during the day)
  - Complex traffic routing between services
  - Need advanced deploy strategies (canary, blue/green at scale)
  - Compliance requires workload isolation
  - Running on-premise with multiple servers
  - Team has K8s expertise and time to maintain it
```

## Spring Boot Kubernetes Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: userservice
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: userservice
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: userservice
    spec:
      containers:
        - name: userservice
          image: ghcr.io/user/userservice:1.0.0
          ports:
            - containerPort: 8080
          env:
            - name: SPRING_PROFILES_ACTIVE
              value: prod
            - name: DB_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: db-credentials
                  key: password
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
            initialDelaySeconds: 60
            periodSeconds: 30
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
            initialDelaySeconds: 30
            periodSeconds: 10
            failureThreshold: 3
```

---

# 27. Migration Paths

## Local → Docker Compose

```
BEFORE: ./mvnw spring-boot:run, local Postgres installed

STEPS:
1. Write Dockerfile
2. Build: docker build -t myapp:local .
3. Write docker-compose.yml
4. Update application-dev.yml to use postgres service name
5. Test: docker compose up

GOTCHAS:
  localhost:5432 → postgres:5432 (service name in Docker network)
  mvnw permissions need fixing (chmod)
  First build slow, subsequent builds fast (layer cache)
```

## Docker Compose → CI/CD

```
BEFORE: Manual docker build + manual deploy

STEPS:
1. Push code to GitHub
2. Create .github/workflows/ci.yml
3. Get pipeline running (build + test)
4. Add Docker build job (push to ghcr.io)
5. Connect deployment platform
6. Add deploy job to cd.yml
7. Test auto-deploy on feature branch → develop merge

AFTER: Every develop merge auto-deploys to staging
```

## Monolith → Microservices (Strangler Fig Pattern)

```
NEVER do a big-bang rewrite.

SAFE approach (Strangler Fig):
1. Identify a bounded context to extract (e.g., notifications)
2. Build it as a new microservice, deployed separately
3. Route: new notification requests → new service
4. Keep old notification code in monolith as fallback
5. Gradually migrate more features to new service
6. Eventually decommission monolith notification code
7. Repeat for next bounded context

SIGNS YOU'RE READY:
  Different parts need different scaling
  Different teams own different parts
  Deploy one part = deploy everything (painful)
  Different reliability requirements per part

SIGNS YOU'RE NOT READY:
  Team < 10 engineers
  No service mesh / distributed tracing
  No CI/CD for multiple services yet
  Domain boundaries not well understood
```

## GitHub Actions → Self-Hosted Runners

```
WHY MIGRATE:
  Cost (>2000 private build minutes/month)
  Access to internal resources (private DB, internal APIs)
  Compliance (code can't leave your servers)
  Faster builds (no VM spin-up time)

SETUP:
  GitHub → Repo → Settings → Actions → Runners → New self-hosted runner
  Follow installation instructions (3 commands)
  Install Docker on runner machine

WORKFLOW CHANGE:
  runs-on: ubuntu-latest      → runs-on: self-hosted
  runs-on: ubuntu-latest      → runs-on: [self-hosted, linux, docker]

CONSIDERATIONS:
  You manage the machine (updates, security)
  One runner = one concurrent job
  For autoscaling: GitHub Actions Runner Controller (Kubernetes)
```

---

# 28. Production Checklists

## Code Quality
```
☐ No wildcard imports (AvoidStarImport rule)
☐ No tab characters (spaces only)
☐ No hardcoded credentials anywhere
☐ DTOs for all API inputs/outputs (never expose entities)
☐ @Valid on all @RequestBody parameters
☐ Global exception handler with consistent error format
☐ @Table(name="...") on every entity
☐ spring.jpa.open-in-view: false everywhere
☐ Tests exist and CI enforces them
☐ Test coverage > 70%
☐ No System.out.println (use Slf4j)
☐ No TODO/FIXME in production code
```

## Docker
```
☐ Multi-stage Dockerfile
☐ Non-root user in runtime stage
☐ HEALTHCHECK configured
☐ .dockerignore excludes target/, .git/, .env
☐ JVM container flags: UseContainerSupport, MaxRAMPercentage
☐ JRE (not JDK) in runtime stage
☐ Image < 300MB
☐ mvnw has 100755 permission in git
☐ chmod +x mvnw in Dockerfile AND in CI
```

## CI/CD Pipeline
```
☐ main and develop branches protected
☐ Direct push to protected branches blocked
☐ CI required to pass before merge
☐ All GitHub Actions pinned to specific versions (not @v4)
☐ chmod +x mvnw step in pipeline
☐ Staging auto-deploys on develop merge
☐ Production requires manual approval
☐ Secrets in GitHub Secrets, not in code
☐ Different secrets per environment
☐ Pipeline runs in < 10 minutes
☐ Concurrency: cancel-in-progress: false for deploys
```

## Database
```
☐ Flyway or Liquibase for schema management
☐ ddl-auto: validate in production
☐ No breaking schema changes (backward compatible migrations)
☐ Database backups configured and tested
☐ Connection pool configured (HikariCP)
☐ Connection pool size appropriate for container count
```

## Security
```
☐ HTTPS only (SSL certificate)
☐ No secrets in any code or config files
☐ Container running as non-root
☐ Minimal container permissions
☐ Security scanning in CI (Trivy, OWASP)
☐ Dependencies up to date (no critical CVEs)
☐ Health endpoint doesn't expose sensitive info to anonymous
```

---

# 29. Troubleshooting Bible

## GitHub Actions

```
Problem: ./mvnw: Permission denied (exit code 126)
Cause:   Windows committed mvnw without execute bit
Fix:     git update-index --chmod=+x mvnw && git commit
         OR add step: run: chmod +x mvnw

Problem: Action download failed (URI not found)
Cause:   GitHub CDN hiccup
Fix:     Re-run the job. Use pinned versions: @v4.7.0 not @v4

Problem: Workflow shows 0 runs on Actions tab
Cause:   ci.yml not in default/base branch yet
Fix:     Merge PR containing ci.yml to main/develop first

Problem: Required status check can't be added
Cause:   GitHub hasn't seen the job name yet
Fix:     Run pipeline once, then job name appears in dropdown

Problem: GITHUB_TOKEN permission denied for ghcr.io
Fix:     Add to job: permissions: { packages: write }

Problem: Docker build in CI failing (bake mode on Windows)
Cause:   Docker Compose bake mode bug
Fix:     docker build -t image:tag . && docker compose up -d
         OR set COMPOSE_BAKE=false

Problem: CI shows 0 checks on PR
Cause:   Workflow triggers on push to feature/*, not pull_request
Fix:     Add pull_request trigger to on: section
```

## Spring Boot

```
Problem: "drop table [*]user" syntax error
Cause:   'user' is reserved SQL keyword
Fix:     @Table(name = "users") on User entity

Problem: "Unable to find @SpringBootConfiguration"
Cause:   Test class in wrong package
Fix:     Match package to main application class
         OR @SpringBootTest(classes = YourApp.class)

Problem: open-in-view warning on startup
Fix:     spring.jpa.open-in-view: false

Problem: DTO field mapping wrong (email gets role value)
Cause:   Wrong field reference in toDTO() method
Fix:     Check each line: user.getEmail() not user.getRole()
Debug:   log.info("email={}", dto.getEmail()) before mapping

Problem: Data disappears after restart
Cause:   H2 in-memory DB with create-drop
Fix:     Use PostgreSQL via Docker Compose for persistence

Problem: "BeanCreationException" on startup
Fix:     Read the full error — it's always below the BeanCreationException line
         Scroll up to find: "Caused by: ..." — that's the real error
```

## Docker

```
Problem: Container exits immediately
Fix:     docker logs containerName
         docker run -it image sh (interactive, see real error)

Problem: Port already in use
Fix:     Windows: netstat -ano | findstr 8080 → taskkill /PID xxx /F
         Mac/Linux: lsof -i :8080 → kill -9 PID
         Or use different port: -p 8081:8080

Problem: Changes not reflected after rebuild
Fix:     docker stop + docker rm + docker build + docker run
         docker build --no-cache -t image:tag . (force full rebuild)

Problem: App can't reach DB in Docker Compose
Cause:   Using localhost in datasource URL
Fix:     SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/db
         (postgres = service name, not localhost)

Problem: Container is unhealthy
Fix:     docker inspect --format='{{json .State.Health}}' container
         docker exec container wget -qO- http://localhost:8080/actuator/health

Problem: "no configuration file provided" in Docker Compose
Fix:     Run from directory containing docker-compose.yml
         ls docker-compose.yml to verify location
```

## Railway

```
Problem: Railpack can't determine how to build
Cause:   Service pointing to GitHub repo, not Docker image
Fix:     Settings → Source → Connect Image → ghcr.io/user/image:tag

Problem: Invalid RAILWAY_TOKEN
Cause:   Using account-level token (wrong type)
Fix:     Project → Settings → Tokens → Generate Token

Problem: App crashes - DB connection refused
Fix:     Check DB_URL references Railway internal hostname
         Use DATABASE_URL from PostgreSQL service variables tab

Problem: Railway ignoring PORT, app listening on 8080
Fix:     server.port: ${PORT:8080} in application.yml
         Railway injects PORT environment variable dynamically

Problem: Image pull fails (private ghcr.io)
Fix:     GitHub → Packages → image → Change visibility → Public
         OR add registry credentials in Railway service settings
```

## Git

```
Problem: "refusing to merge unrelated histories"
Fix:     git pull origin main --allow-unrelated-histories

Problem: Committed sensitive data
Fix:     1. Rotate credential IMMEDIATELY (treat as compromised)
         2. git rm --cached .env
         3. Add to .gitignore
         4. BFG Repo Cleaner to remove from all history
         5. Force push (coordinate with team)
         6. All team members re-clone

Problem: Merge conflict
Fix:     git status (see conflicted files)
         Edit files, resolve <<< === >>> markers
         git add resolved-files
         git commit

Problem: Committed to wrong branch
Fix:     git log --oneline -3 (note SHA)
         git reset HEAD~1 (undo commit, keep changes)
         git stash (save changes)
         git checkout correct-branch
         git stash pop
         git commit -m "message"
```

---

# COMPLETE TEMPLATE FILES

## Minimal Dockerfile (Copy-Paste Ready)

```dockerfile
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && sed -i 's/\r$//' mvnw
RUN ./mvnw dependency:go-offline -B
COPY src ./src
RUN ./mvnw clean package -DskipTests -B
RUN java -Djarmode=layertools -jar target/*.jar extract --destination target/extracted

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /app/target/extracted/dependencies/ ./
COPY --from=builder /app/target/extracted/spring-boot-loader/ ./
COPY --from=builder /app/target/extracted/snapshot-dependencies/ ./
COPY --from=builder /app/target/extracted/application/ ./
USER appuser
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget -qO- http://localhost:8080/actuator/health || exit 1
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS org.springframework.boot.loader.launch.JarLauncher"]
```

## Minimal CI Pipeline (Copy-Paste Ready)

```yaml
name: CI
on:
  push:
    branches: [main, develop, 'feature/**']
  pull_request:
    branches: [main, develop]
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4.2.2
      - uses: actions/setup-java@v4.7.0
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: 'maven'
      - run: chmod +x mvnw
      - run: ./mvnw test -B
        env:
          SPRING_PROFILES_ACTIVE: test
      - run: ./mvnw package -DskipTests -B
  docker:
    runs-on: ubuntu-latest
    needs: build-and-test
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4.2.2
      - id: meta
        uses: docker/metadata-action@v5.5.1
        with:
          images: ghcr.io/${{ github.repository_owner }}/userservice
          tags: |
            type=ref,event=branch
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable=${{ github.ref == 'refs/heads/main' }}
      - uses: docker/setup-buildx-action@v3.6.1
      - uses: docker/login-action@v3.3.0
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5.4.0
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

## Minimal CD Pipeline (Copy-Paste Ready)

```yaml
name: CD
on:
  push:
    branches: [develop, main]
concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: false
jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
      - name: Deploy to Staging
        run: curl -X POST "${{ secrets.RAILWAY_DEPLOY_HOOK }}"
  deploy-production:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - name: Deploy to Production
        run: curl -X POST "${{ secrets.RAILWAY_DEPLOY_HOOK_PROD }}"
```

## railway.toml (Copy-Paste Ready)

```toml
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile"

[deploy]
healthcheckPath = "/actuator/health"
healthcheckTimeout = 60
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10
```

## checkstyle.xml (Copy-Paste Ready)

```xml
<?xml version="1.0"?>
<!DOCTYPE module PUBLIC
    "-//Checkstyle//DTD Checkstyle Configuration 1.3//EN"
    "https://checkstyle.org/dtds/configuration_1_3.dtd">
<module name="Checker">
  <property name="severity" value="error"/>
  <module name="FileTabCharacter"/>
  <module name="TreeWalker">
    <module name="UnusedImports"/>
    <module name="AvoidStarImport"/>
    <module name="NeedBraces"/>
    <module name="WhitespaceAround"/>
    <module name="MethodLength"><property name="max" value="50"/></module>
    <module name="LineLength"><property name="max" value="120"/></module>
  </module>
</module>
```

---

*Built from real production CI/CD experience — every section reflects actual pain points, solutions, and hard-won lessons.*

*Version 2.0 | Comprehensive Edition | 2026*

---
# APPENDIX A — VERSION REFERENCE
---

## Where to Find Latest Versions

```
Spring Boot:
  https://start.spring.io (always shows latest stable)
  https://spring.io/projects/spring-boot#learn

Maven Central (any Java library):
  https://search.maven.org
  https://mvnrepository.com
  Search: groupId:artifactId → see all versions

GitHub Actions (pinned versions):
  https://github.com/actions/checkout/releases
  https://github.com/actions/setup-java/releases
  https://github.com/actions/upload-artifact/releases
  https://github.com/docker/build-push-action/releases
  https://github.com/docker/login-action/releases
  https://github.com/docker/metadata-action/releases
  https://github.com/docker/setup-buildx-action/releases
  https://github.com/docker/setup-qemu-action/releases
  https://github.com/aquasecurity/trivy-action/releases
  Rule: always check the releases tab of each action's repo

Docker Base Images:
  https://hub.docker.com/_/eclipse-temurin/tags
    Filter: 21-jdk-alpine, 21-jre-alpine, 17-jre-alpine
  https://hub.docker.com/_/postgres/tags
    Filter: 16-alpine, 15-alpine

Node.js / npm:
  https://www.npmjs.com/package/@railway/cli

Railway CLI:
  https://docs.railway.app/develop/cli
```

## Pinned Versions Used in This Guide (check for updates)

```yaml
# GitHub Actions
actions/checkout:              v4.2.2
actions/setup-java:            v4.7.0
actions/upload-artifact:       v4.6.2
actions/download-artifact:     v4
actions/cache:                 v4
docker/metadata-action:        v5.5.1
docker/setup-qemu-action:      v3.2.0
docker/setup-buildx-action:    v3.6.1
docker/login-action:           v3.3.0
docker/build-push-action:      v5.4.0
aquasecurity/trivy-action:     master (or pin to a release)
github/codeql-action:          v3
appleboy/ssh-action:           v1.0.3

# Docker images
eclipse-temurin:               21-jdk-alpine (build), 21-jre-alpine (runtime)
postgres:                      16-alpine
prom/prometheus:               v2.47.0
grafana/grafana:               10.1.0

# Spring Boot
spring-boot-starter-parent:    3.4.5
java.version:                  21

# Maven plugins
maven-checkstyle-plugin:       3.3.1
spotbugs-maven-plugin:         4.8.3.1
jacoco-maven-plugin:           (managed by Spring Boot BOM)
```

## Version Pinning Strategy

```yaml
# GitHub Actions — ALWAYS pin to specific version
uses: actions/setup-java@v4.7.0      # ✅ pinned
uses: actions/setup-java@v4          # ❌ floating — can change silently

# Why pinning matters:
# - @v4 is a mutable tag (action owner can update it)
# - Supply chain attack: malicious update to @v4 affects everyone
# - Pinned SHA or version: only changes when YOU update it
# - This is security best practice, not optional paranoia

# Docker base images — pin major.minor
FROM postgres:16-alpine               # ✅ (minor patch updates ok)
FROM postgres:latest                  # ❌ unpredictable breaks

# Maven dependencies — let Spring Boot BOM manage Spring versions
# For non-Spring deps, always specify version:
<version>3.3.1</version>             # ✅ explicit
# (no version)                       # ✅ for Spring Boot starters (BOM manages)
```

---
# APPENDIX B — COMMANDS QUICK REFERENCE
---

## Git Commands One-Liner Reference

```bash
# Setup
git config --global user.name "Name" && git config --global user.email "e@mail.com"

# Daily workflow
git status                              # what's changed
git add . && git commit -m "feat: x"   # stage and commit
git push origin feature/my-feature     # push feature branch
git pull origin develop                 # pull latest develop

# Branches
git checkout -b feature/name           # create + switch
git branch -D feature/name             # force delete local
git push origin --delete feature/name  # delete remote

# Fix mistakes
git restore file.java                  # discard file changes
git reset HEAD~1                       # undo last commit (keep changes)
git revert HEAD                        # undo with new commit (safe)

# CI-critical
git update-index --chmod=+x mvnw      # fix mvnw permissions
git ls-files --stage mvnw             # verify: 100755 = good
```

## Maven Commands One-Liner Reference

```bash
chmod +x mvnw                              # fix permission locally
./mvnw clean                               # delete target/
./mvnw compile                             # compile only
./mvnw test -B                             # run all tests (CI mode)
./mvnw test -Dtest=UserServiceTest -B      # run specific test
./mvnw package -DskipTests -B             # build JAR
./mvnw clean package -DskipTests -B       # clean + build JAR
./mvnw spring-boot:run                     # run locally
./mvnw dependency:go-offline -B           # pre-download deps (Docker)
./mvnw checkstyle:check -B                # check code style
./mvnw spotbugs:check -B                  # static analysis
./mvnw verify -B                          # test + quality + package
./mvnw help:evaluate -Dexpression=project.version -q -DforceStdout  # get version
```

## Docker Commands One-Liner Reference

```bash
# Build
docker build -t myapp:local .
docker build --no-cache -t myapp:local .   # force full rebuild

# Run
docker run -d -p 8080:8080 -e SPRING_PROFILES_ACTIVE=dev --name myapp myapp:local
docker run -d -p 8080:8080 --restart unless-stopped --name myapp myapp:local

# Inspect
docker ps                                   # running containers
docker ps -a                                # all containers
docker logs -f myapp                        # follow logs
docker exec -it myapp sh                    # shell into container
docker inspect --format='{{.State.Health.Status}}' myapp  # health status
docker stats myapp                          # live resource usage

# Cleanup
docker stop myapp && docker rm myapp        # stop and remove
docker system prune -af                     # clean everything
docker volume prune                         # clean volumes

# Registry
docker tag myapp:local ghcr.io/user/myapp:1.0.0
docker push ghcr.io/user/myapp:1.0.0
```

## Docker Compose Commands One-Liner Reference

```bash
docker compose up -d                        # start detached
docker compose up --build -d                # rebuild + start
docker compose down                         # stop + remove
docker compose down -v                      # stop + remove + wipe volumes
docker compose logs -f app                  # follow app logs
docker compose ps                           # service status
docker compose exec app sh                  # shell into app
docker compose exec postgres psql -U devuser -d myapp_db  # psql shell
docker compose -f docker-compose-dev.yml up -d  # different file
```

---
# APPENDIX C — MENTAL MODELS CHEAT SHEET
---

## The CI/CD Flow in One Diagram

```
Developer
  │
  ├─ git checkout -b feature/add-search
  ├─ (writes code, commits with conventional commits)
  ├─ git push origin feature/add-search
  │
  └─► GitHub
        │
        ├─► CI Pipeline fires (push to feature/*)
        │     ├── Build & Test ──────────────────► ✅ or ❌
        │     └── Code Quality ─────────────────► ✅ or ❌
        │
        ├─► Developer opens PR: feature/add-search → develop
        │     ├── CI fires on PR
        │     ├── All checks must pass to merge
        │     └── Reviewer approves
        │
        ├─► Merge to develop
        │     └─► CD Pipeline fires
        │           ├── Build & Test ────────────► ✅
        │           ├── Docker Build → push :develop to ghcr.io
        │           └── Deploy to Railway (staging)
        │                 └── /actuator/health → UP ✅
        │
        ├─► QA tests on staging URL
        │
        ├─► Developer opens PR: develop → main
        │     └── CI fires, approval required
        │
        └─► Merge to main
              └─► CD Pipeline fires
                    ├── Build & Test ────────────► ✅
                    ├── Docker Build → push :latest to ghcr.io
                    ├── GitHub pauses → sends approval email
                    ├── Human reviews → clicks Approve
                    └── Deploy to Production
                          └── /actuator/health → UP ✅
                                └── 🌍 Live at https://yourapp.com
```

## Docker Layer Caching Mental Model

```
Dockerfile layers = Stack of cached snapshots

Layer 1: FROM eclipse-temurin:21-jre-alpine
  Hash: abc123 (never changes — always cached)

Layer 2: WORKDIR /app
  Hash: def456 (never changes — always cached)

Layer 3: COPY pom.xml mvnw ./
  Hash: ghi789 (changes only when pom.xml changes — cached 95%)

Layer 4: RUN mvnw dependency:go-offline
  Hash: jkl012 (changes when pom.xml changes — cached 95%)
  ↑ This is the expensive layer (2-3 minutes). Cached = 0 seconds.

Layer 5: COPY src ./
  Hash: mno345 (changes EVERY commit — never cached)

Layer 6: RUN mvnw package
  Hash: pqr678 (changes every commit — rebuilds from here)

Rule: Change layer N → ALL layers below N must rebuild
Rule: Put stable layers first, volatile layers last
```

## Branch Protection Mental Model

```
PUSH to main ──────────────────────────────────────► REJECTED
  Error: "Changes must be made through a pull request"

PUSH to feature/* ─────────────────────────────────► ALLOWED
  CI runs automatically on push

PR feature/* → develop ────────────────────────────► ALLOWED
  CI must pass + review before merge

PR develop → main ─────────────────────────────────► ALLOWED
  CI must pass + approval before merge
  After merge → CD runs → production deploy needs approval

RESULT:
  Bad code literally CANNOT reach production
  Every deployment is traceable (who approved? what commit? when?)
  Rollback always possible (images tagged with SHA)
```

## Secret Hierarchy Mental Model

```
GitHub Repository Secrets
  └── Available to ALL workflows in the repo
  └── Use for: shared non-environment-specific secrets
  └── Examples: DOCKERHUB_USERNAME, SONAR_TOKEN

GitHub Environment Secrets (staging)
  └── Available ONLY when environment: staging is specified
  └── Use for: staging-specific secrets
  └── Examples: RAILWAY_DEPLOY_HOOK (staging hook)

GitHub Environment Secrets (production)
  └── Available ONLY when environment: production is specified
  └── ALSO requires manual approval from designated reviewers
  └── Use for: production-specific secrets
  └── Examples: RAILWAY_DEPLOY_HOOK_PROD (production hook)

Auto-provided by GitHub
  └── GITHUB_TOKEN — always available, no setup needed
  └── Permissions: controlled per job with permissions: block
  └── Use for: pushing to ghcr.io, commenting on PRs, creating releases
```

---
# APPENDIX D — DECISION RECORDS
---

## Why We Made Each Choice

```
CHOICE: Spring Boot (not Quarkus, Micronaut, Node.js)
REASON: Most widely used Java framework, best ecosystem,
        most documentation, most job market demand,
        excellent Docker/K8s support, mature CI/CD tooling

CHOICE: PostgreSQL (not MySQL, MongoDB, H2 for prod)
REASON: Most feature-rich OSS RDBMS, best JSON support,
        best Hibernate integration, best cloud managed options,
        MySQL has gotchas in strict mode,
        H2 dialect differences cause prod bugs

CHOICE: Flyway (not Liquibase, ddl-auto)
REASON: Simpler, plain SQL (no new syntax to learn),
        excellent Spring Boot auto-config, most used,
        ddl-auto is not safe for production

CHOICE: Docker multi-stage (not single-stage, not buildpacks)
REASON: Smallest image size, security (non-root, JRE only),
        layer caching for fast CI, reproducible builds,
        buildpacks are magic — you don't learn from magic

CHOICE: ghcr.io (not Docker Hub, ECR)
REASON: Free, integrated with GitHub, GITHUB_TOKEN works automatically,
        no extra setup needed for CI, easy to make public

CHOICE: GitHub Actions (not Jenkins, GitLab CI, CircleCI)
REASON: Native GitHub integration, zero setup, huge marketplace,
        GITHUB_TOKEN auto-provided, free 2000 min/month

CHOICE: Railway (not Heroku, Render, AWS)
REASON: Simplest to start, free tier, Docker image support,
        deploy hook is dead simple, fast for learning,
        real CI/CD concepts apply identically to AWS later

CHOICE: Our branch strategy (not GitFlow, GitHub Flow)
REASON: GitFlow = too complex, slow for learning
        GitHub Flow = no staging environment
        Our approach = staging env + simple workflow + learning friendly
```

---

*This document represents the collective knowledge needed to build, ship, and maintain production-grade software with modern DevOps practices.*

*Total: ~3400 lines | Covers: CI/CD, Git, Docker, Spring Boot, GitHub Actions, Railway, AWS, PostgreSQL, Flyway, Monitoring, Security, Kubernetes intro, Infrastructure as Code, Migration paths, and complete troubleshooting*
