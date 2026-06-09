# Code Time Machine: Local-First Heuristic Timeline Design

**Date:** 2026-06-08  
**Status:** Approved  
**Target Audience:** Individual developers  
**Primary Integration:** VS Code (side panel + command palette)  
**Cost Model:** Core free, AI features opt-in (user-provided keys)

---

## 1. Core Concept Overview

A VS Code extension that helps developers understand their codebase's evolutionary history by automatically detecting architectural decision points in git history and visualizing the impact of alternative choices—all without requiring API keys or incurring costs for core functionality.

**Primary Value Proposition:** "Instantly see the pivotal moments that shaped your codebase and explore what different choices would have meant—zero setup, zero cost to start."

---

## 2. Key Components

### 2.1 Decision Point Detector (100% Local)

- **Input:** Git repository history (commits, merge messages, file changes)
- **Detection Heuristics:**
  - **Major Refactors:** Commits touching >30% of files or renaming >20% of directories
  - **Framework Shifts:** Adding/removing major dependencies (e.g., introducing React, dropping jQuery)
  - **Pattern Changes:** Introduction/removal of architectural patterns (e.g., first appearance of Dependency Injection, migration to microservices)
  - **Dependency Inflection Points:** Major version upgrades of core libraries (e.g., React 16→18, .NET Framework→.NET Core)
  - **Organizational Signals:** Commit messages containing keywords like "refactor", "architecture", "migration", "redesign", "rewrite"
  - **File Churn Spikes:** Sudden increases/decreases in specific file types (e.g., explosion of .test files indicating testing culture shift)
- **Output:** Timeline of decision points with:
  - Timestamp (commit date)
  - Short description (auto-generated from commit message)
  - Impact score (based on files changed, lines modified, semantic significance)
  - Affected modules/components
  - Suggested alternative (based on rejected dependencies/patterns in commit)

### 2.2 Heuristic Timeline Simulator (Local, No Tokens)

Instead of AI-generated alternate timelines, uses rule-based transformation:
- **For Framework Shifts:** Maps equivalent concepts (e.g., if they adopted React, show what Vue/Angular equivalents would look like based on common patterns)
- **For Pattern Changes:** Applies/refactors using established refactoring rules (e.g., if they added DI, simulate manual instantiation patterns)
- **For Dependency Changes:** Shows equivalent code using the alternative library's API (based on common mapping patterns)
- **Output:** For each decision point, a "What If" panel showing:
  - Side-by-side comparison of current vs. alternate code for affected files
  - Summary of changes: "X files would use Y pattern instead of Z"
  - Estimated impact: "Would reduce boilerplate by ~15% in data access layer"

### 2.3 Interactive Visualizer (VS Code Side Panel)

- **Timeline View:** Horizontal/scrollable timeline of decision points
- **Detail View:** When clicking a decision point:
  - Commit snapshot (what changed)
  - Heuristic impact analysis
  - "Explore Alternatives" button (triggers heuristic simulation)
  - File explorer showing affected modules
- **Cherry-Pick Interface:** 
  - Checkbox selection for specific changes from alternate view
  - "Generate Patch" button creating git-apply compatible diff
  - Conflict detection (flags if alternate change conflicts with current HEAD)

### 2.4 VS Code Integration (Both Panel & Commands)

- **Side Panel:** 
  - Accessible via Activity Bar icon (timeline icon)
  - Shows decision point timeline at a glance
  - Persistent while exploring
- **Command Palette Commands:**
  - `/timeline: analyze` - Run decision point detection on current repo
  - `/timeline: show` - Open/close side panel
  - `/timeline: explore <decision-id>` - Jump to specific decision point
  - `/timeline: export-report` - Generate shareable HTML/Markdown report
  - `/timeline: cherry-pick` - Apply selected changes from alternate timeline
- **Status Bar:** 
  - Shows "🕐 X decision points detected" when analysis complete
  - Click to jump to timeline view
  - Shows analysis progress when running

### 2.5 Export & Sharing (Zero-Token Core)

- **Template-Based Reports:** 
  - HTML timeline visualization (opens in browser)
  - Markdown summary for sharing in issues/PRs
  - Text-based "What If" summary for tweets/LinkedIn
- **AI-Enhanced Export (Optional Opt-In):** 
  - Only if user enables "Use AI for Reports" in settings
  - Uses user's configured AI backend to enhance reports
  - Clear cost warning before enabling: "This will use tokens from your AI provider"

---

## 3. User Experience Flow

### First-Time Use:
1. Install extension → see welcome screen with one-click "Analyze This Repo"
2. Extension runs local decision point detection (5-30s depending on repo size)
3. Side panel populates with timeline: "Found 7 architectural decision points"
4. User clicks earliest point: "Initial project setup (Jan 2022)"
5. Sees: "Created create-react-app vs. vanilla JS setup"
6. Clicks "Explore Alternatives" → sees heuristic diff: "If vanilla JS: 42 fewer files, different build setup"
7. Can export report or cherry-pick specific insights

### Regular Use:
1. Status bar shows decision point count as they code
2. Click status bar → jump to timeline
3. Explore recent decisions during PR review: "Let's see what would've happened if we'd chosen GraphQL here"
4. Use cherry-pick to recover good ideas from old branches: "Oh, that logging pattern from 6 months ago was actually better"

---

## 4. Technical Architecture

### 4.1 Extension Frontend (TypeScript/React)
- VS Code Extension API for UI panels/commands
- Local state management for timeline data
- Diff rendering library (using monaco-diff or similar)
- Settings UI for opt-in AI features

### 4.2 Analysis Engine (Node.js/Python - Local)
- Git history parser (using isomorphic-git or libgit2 bindings)
- Heuristic detectors (pure JS/Python, no external deps)
- Rule-based transformation engine for alternate simulation
- Cache layer (.timeline-cache/) for speed

### 4.3 Communication
- All processing happens in extension host
- No external API calls for core features
- Optional AI features use VS Code's MCP or direct API to user's configured backend (user brings keys)

### 4.4 Storage
- Workspace-level: `.timeline-cache/` (git-ignored by default)
- User settings: Opt-in preferences for AI features
- No telemetry or data collection (to maintain trust)

---

## 5. Data Flow

```
[User Runs Command] 
        ↓
[Git History Reader] ← (repo .git/)
        ↓
[Decision Point Detector] ← (heuristics engine)
        ↓
[Timeline Data Store] ← (.timeline-cache/)
        ↓
[VS Code Side Panel Renderer]
        ↓
[User Clicks Decision Point]
        ↓
[Heuristic Simulator] ← (rule-based transformations)
        ↓
[Diff Generator] ← (monaco-diff or similar)
        ↓
[Side Panel Detail View Update]
        ↓
[User Selects Changes]
        ↓
[Cherry-Pick Engine] ← (git diff/patch generator)
        ↓
[Status: "Patch ready to apply"]
```

---

## 6. Viral Mechanics & Adoption Strategy

### Built-In Shareability:
- **One-Click Export:** `/timeline: export-report` generates:
  - HTML timeline visualization (interactive, opens in browser)
  - Markdown summary: "Key Decisions in [Repo Name]: [List]"
  - Twitter-ready cards: "If we'd chosen X here, we'd have saved Y hours/week"
- **Visual Appeal:** Timeline graphics are inherently shareable (like gitk but more meaningful)
- **Conversation Starters:** "This tool found our team made 3 major pivots we forgot about" → share in team chat

### Adoption Loops:
1. **Individual Developer:** Installs → sees insights in personal repo → shares screenshot: "Check out what this found in my side project!"
2. **Team Adoption:** Teammate tries it → sees their own insights → adds to team onboarding
3. **Open Source:** Maintainer runs on popular repo → shares "Evolution of [Popular Project]" → drives installs
4. **Content Creation:** Devs create YouTube/TikTok: "I ran this on [famous repo] - here's what I learned"

### Differentiation from Existing Tools:
- Unlike GitLens/Git History: Focuses on *architectural meaning* not just commits
- Unlike Codeowners/CodeQL: Looks at *evolution* not just current state
- Unlike Copilot: Helps understand *past decisions* not just write future code
- Zero-cost core vs. trial-then-pay models

---

## 7. Cost & Token Considerations (Core Free, Opt-In AI)

| Feature | Token Usage | Cost Bearer | Notes |
|---------|-------------|-------------|-------|
| Decision Point Detection | 0 tokens | User ($0) | Pure git/heuristic analysis |
| Timeline Visualization | 0 tokens | User ($0) | Frontend rendering only |
| Heuristic Simulation (Alternates) | 0 tokens | User ($0) | Rule-based transformations |
| Cherry-Pick/Patch Generation | 0 tokens | User ($0) | Git diff algorithms |
| Export Reports (Template) | 0 tokens | User ($0) | HTML/Markdown templates |
| **OPTIONAL: AI-Enhanced Reports** | 100-500 tokens/report | User (via API key) | Only if enabled in settings |
| **OPTIONAL: AI Timeline Deep Dive** | 500-5,000 tokens/session | User (via API key) | Only if "Enable AI Simulation" toggled ON |

### Cost Protection Mechanisms:
1. **Explicit Opt-In Required:** All AI features disabled by default
2. **Clear Warnings:** Before enabling AI: "This will consume tokens from your AI provider. Estimated cost: $0.02-$0.10 per exploration."
3. **Usage Transparency:** If AI enabled, status bar shows: "~2k tokens used this session via [provider]"
4. **Zero-Core-Guarantee:** Fundamental value (decision points + heuristic alternates) requires NO API keys
5. **Leverages Existing Spend:** Uses AI subscriptions users likely already have (Cursor, Copilot, Claude Pro)

---

## 8. Testing & Quality Assurance

### Unit Testing:
- Decision point detectors with known git fixture repos
- Heuristic transformation rules test suite
- Diff generation accuracy tests

### Integration Testing:
- Test with real open-source repos (known historical pivots):
  - "What if Twitter stayed with Rails?" 
  - "What if Netflix hadn't moved to microservices?"
  - "What if React had chosen Angular's DI approach?"
- Verify heuristic simulations produce plausible alternates

### Manual Verification Checklist:
- [ ] Decision detection works on repos of various sizes (10 commits → 10k commits)
- [ ] Heuristic alternates are technically sensible (not nonsensical)
- [ ] VS Code UI responsive with large timelines (100+ points)
- [ ] Export reports are readable and shareable
- [ ] Zero telemetry/data collection verified
- [ ] AI opt-in requires explicit user action
- [ ] Clean uninstall removes `.timeline-cache/`

---

## 9. Success Metrics (For Viral Potential)

### Short-Term (Adoption):
- Target: 1k installs in first month from organic sharing
- Key signal: Users sharing timeline screenshots on Twitter/LinkedIn with #CodeTimeMachine

### Medium-Term (Engagement):
- Target: 40% of installed users run analysis on ≥2 different repos
- Key signal: Repeat usage (users coming back to explore new decision points)

### Long-Term (Impact):
- Target: Become "go-to tool for understanding codebase evolution"
- Key signal: Mentioned in blog posts/tutorials about technical debt/architecture

--- 
*Design approved and ready for implementation planning.*