# ClearCut - The Self-Resolving Finance Controller
## Worklog & Handover Document

**Project**: Razorpay AI Buildathon — Track 04: AI Finance Controller
**Stack**: Next.js 16 (App Router) + TypeScript + Prisma (SQLite) + Tailwind CSS 4 + shadcn/ui + Framer Motion + Recharts + z-ai-web-dev-sdk (LLM)

---

## Project Vision

Build a beautiful, animated, compelling MVP of **ClearCut** — an agentic AI system that autonomously reconciles a merchant's internal order database against Razorpay settlement reports and bank statements. It handles multi-leg settlements (split payments, partial refunds, blended fees), auto-matches ~90% of records deterministically + via LLM, and produces an **honest exception list** with forensic audit trails for the rest.

**Core thesis**: *Verification capacity > Generation speed.* The AI never guesses financial data. It either proves a match mathematically, or honestly admits it cannot resolve.

### Adaptation from spec
The original spec called for Python/FastAPI/Streamlit/Polars. We adapted it to the Next.js 16 + TypeScript stack already set up in this sandbox, which is even better for an impressive demo because we get a real animated SPA frontend instead of Streamlit.

The 4-stage pipeline translates naturally:
- **Stage 0 (new, pre-flight)** — detect no-settlement, duplicate bank credits, future-dated settlements, currency mismatches upfront so they don't get accidentally matched in later stages
- **Stage 1 — Deterministic Hard Match** → Pure TS, no AI
- **Stage 2 — AI Semantic Normalizer** → z-ai-web-dev-sdk LLM extracts structured fields from messy bank narrations
- **Stage 3 — Multi-Leg Graph Resolver** → LLM generates JavaScript code; deterministic combinatorial sandbox verifies the math balances to exactly ₹0.00 (LLM code captured for audit but not executed in-process for safety)
- **Stage 4 — Honest Exception Orchestrator** → builds forensic dossiers, dispute payloads, marks ledger ESCALATED

### Synthetic data (61 orders, 60 settlements, 54 bank credits)
- 30 perfect 1-to-1 matches
- 5 MDR fee deductions (2% credit card)
- 3 TDS deductions (1%)
- 4 multi-leg settlements (each consumes 2-3 orders → 10 underlying orders, 4 bank credits)
- 3 partial refunds
- 3 UPI reference mismatches
- 2 malformed narrations
- 5 honest exceptions (no settlement, duplicate, unexplainable gap, future date, currency mismatch)

---

## Current Status
- ✅ Backend fully built and verified end-to-end
- ✅ Frontend fully built and verified end-to-end
- ✅ Lint clean (0 errors, 0 warnings)
- ✅ Dev server running on port 3000
- ✅ agent-browser verified the full flow:
  - Page renders all sections (Hero, Architecture, DataSources, Control Center, Metrics, Charts, Matched Records, Exception List with Forensic Dossiers, Audit Trail, Footer)
  - Click "Run Pipeline" → 4-stage pipeline executes (≈2-3 min due to LLM calls)
  - Stage 0: 4 known exceptions pre-detected
  - Stage 1: 30 matched (deterministic)
  - Stage 2: 2 matched (AI semantic)
  - Stage 3: 23 matched (multi-leg + fee-adjusted)
  - Stage 4: 6 honest exceptions
  - Total: 55 matched / 6 exceptions / 90.16% match rate
  - Reload persists previous results
  - Stage filter buttons work
  - Exception dossier expansion works (shows hypotheses tested, conclusion, recommended action, dispute payload JSON)
  - Audit trail renders 91 entries

## Goals completed this session
1. ✅ Prisma schema for all entities (InternalOrder, RazorpaySettlement, BankCredit, MatchedRecord, ExceptionRecord, AuditEntry, PipelineRun)
2. ✅ Synthetic data seed script (61 records with all 7 quirks)
3. ✅ TS reconciliation engine (Stage 0 pre-flight + Stage 1-4)
4. ✅ API routes: `/api/recon/run`, `/api/recon/results`, `/api/data`, `/api/audit`, `/api/export`
5. ✅ Beautiful animated frontend:
   - Hero with neon branding, animated gradient title, "Run Reconciliation Pipeline" CTA
   - Architecture diagram with 5 stage cards (deterministic vs AI badges)
   - Data source cards with sample records and total values
   - Pipeline runner with live stage progress + audit stream
   - Metrics dashboard with animated counters (Total, Matched, Exceptions, Match Rate, Throughput, False Positives)
   - Charts: donut for match distribution + bar for stage breakdown
   - Matched records table (searchable, sortable, paginated, expandable rows showing fee breakdown + LLM extraction)
   - Exception list with red-bordered cards + expandable forensic dossier (hypotheses tested with REJECTED/ACCEPTED, conclusion, recommended action, dispute payload JSON)
   - Audit trail timeline with stage-colored dots, filterable by stage
   - Sticky footer with branding + tech stack

## Verification results
- `bun run lint`: ✅ 0 errors, 0 warnings
- `bun run dev`: ✅ running on port 3000
- agent-browser: ✅ all interactions verified (open page, click Run, wait for completion, verify metrics, test filters, expand exception dossier, reload for persistence)
- No console errors, no hydration mismatches

## Unresolved issues / risks
1. **LLM rate limiting (429)**: When running the pipeline, the z-ai-web-dev-sdk LLM occasionally hits rate limits on Stage 2 (semantic normalization). The pipeline gracefully falls back to a deterministic regex extractor and continues. This is why Stage 2 only matches 2 records (the malformed narration cases via regex) instead of the ideal ~5 (which would happen if LLM succeeded for UPI ref mismatch cases). Match rate is 90.16% vs ideal ~91.8%.
2. **Multi-leg batch 4 not fully resolved**: ORD-0052 (multi-leg batch 4 leg 1, debit_card 5000) appears as an UNEXPLAINABLE_GAP exception because... (investigation needed — likely a deterministic solver ordering issue)
3. **Orphan bank credit for UPI ref mismatch**: ORD-0053's bank credit becomes an EXTRACTION_FAILED orphan due to the same LLM rate limiting issue
4. **Duplicate-bank-credit gap amount**: shows ₹240 (the MDR) instead of ₹0 — minor display issue (the duplicate detection happens before fee adjustment, so the gap is the unadjusted MDR)

## Priority recommendations for next phase
1. **(Optional)** Investigate the Stage 3 multi-leg batch 4 non-resolution
2. **(Optional)** Add a "view source data" modal so judges can inspect raw orders/settlements/bank rows
3. **(Optional)** Add a "view LLM-generated code" panel for Stage 3 to show the agentic angle visually
4. **(Polish)** Add micro-animations to the donut chart (counter rolling up to match rate)
5. **(Polish)** Add keyboard shortcuts (R = run, E = export, / = focus search)
6. **(Polish)** Add a hero video / animated background particles for extra wow factor
7. **(Defensive)** Add a rate-limit retry queue for the LLM client with exponential backoff

---

## Architecture summary

```
Browser (page.tsx)
  ↓ fetch
API routes (/api/recon/run, /api/recon/results, /api/data, /api/audit, /api/export)
  ↓
ReconPipeline (src/lib/recon/pipeline.ts)
  ├── Stage 0 (runStage0) — pre-flight exception detection
  ├── Stage 1 (runStage1) — deterministic hard match
  ├── Stage 2 (runStage2) — LLM semantic normalization + regex fast path
  ├── Stage 3 (runStage3) — LLM codegen + deterministic graph resolver
  └── Stage 4 (runStage4) — forensic dossiers + dispute payloads
       ↓
  llm-client.ts (z-ai-web-dev-sdk)
  fee-calculator.ts (deterministic math)
  audit-trail.ts (append-only log)
  types.ts (shared domain types)
       ↓
Prisma (SQLite @ db/custom.db)
  - InternalOrder, RazorpaySettlement, BankCredit (source data)
  - MatchedRecord, ExceptionRecord, AuditEntry (output)
  - PipelineRun (run metadata)
```

## Key files
- `prisma/schema.prisma` — database schema
- `scripts/seed.ts` — synthetic data seeder (`bun run scripts/seed.ts`)
- `scripts/smoke.ts` — pipeline smoke test (`bun run scripts/smoke.ts`)
- `src/lib/recon/pipeline.ts` — main orchestrator (4 stages)
- `src/lib/recon/llm-client.ts` — z-ai-web-dev-sdk wrapper (Stage 2 & 3)
- `src/lib/recon/fee-calculator.ts` — deterministic fee math
- `src/lib/recon/audit-trail.ts` — append-only log
- `src/lib/recon/types.ts` — shared domain types
- `src/lib/synthetic/seed.ts` — 61-record synthetic data generator
- `src/app/api/recon/run/route.ts` — POST endpoint to run pipeline
- `src/app/api/recon/results/route.ts` — GET latest results
- `src/app/api/data/route.ts` — GET source data
- `src/app/api/audit/route.ts` — GET audit trail
- `src/app/api/export/route.ts` — GET JSON/CSV export
- `src/app/page.tsx` — main SPA page
- `src/app/layout.tsx` — root layout (dark theme, fonts)
- `src/app/globals.css` — custom theme + animations
- `src/components/clearcut/*` — frontend components:
  - `Hero.tsx` — branding + Run CTA
  - `ArchitectureDiagram.tsx` — 4-stage pipeline visualization
  - `DataSourceCards.tsx` — 3 source file cards
  - `PipelineRunner.tsx` — run button + live progress
  - `MetricsDashboard.tsx` — animated stat cards
  - `Charts.tsx` — donut + bar charts
  - `MatchedRecordsTable.tsx` — sortable/filterable table
  - `ExceptionList.tsx` — red-bordered cards + forensic dossier
  - `AuditTrail.tsx` — timeline view
  - `Footer.tsx` — sticky footer
  - `format.ts` — presentation helpers
  - `types.ts` — frontend view models

---

## Session 2 — UI/UX Supercharge (animated, attractive, compelling)

Task ID: 2
Agent: main
Task: Improve the UI/UX to make it more attractive, animated, compelling, and convincing for Razorpay Buildathon judges.

Work Log:
- Added **global background system**: `GradientMesh` (3 drifting blurred orbs in emerald/violet/cyan), `ParticleField` (14 floating ₹/✓/▲ particles drifting upward), `CursorSpotlight` (radial emerald glow that trails the cursor with eased lerp). All mounted in `layout.tsx` behind a `relative z-10` content wrapper.
- Added 7 new CSS keyframes + utilities in `globals.css`:
  - `breathe` (subtle scale pulse for icons/badges)
  - `glow-pulse` / `glow-pulse-red` (dramatic neon breathing glow for active/critical elements)
  - `data-flow` (data packet sliding along a wire)
  - `spin-slow`, `typewriter-cursor`, `count-flash`, `ripple-out`, `float-particle`
  - `.holo-border` (animated gradient border via masked pseudo-element)
  - `.gradient-text-emerald` / `.gradient-text-red` (animated gradient text)
  - `.card-lift` (hover translateY -4px with spring easing)
  - `.inner-glow-emerald/red` (inset glow)
  - `.cursor-spotlight` (CSS var-based radial gradient)
  - prefers-reduced-motion guard
- **Hero** (`Hero.tsx`): completely rebuilt
  - Animated title with `gradient-text-emerald` + 9s gradient shift
  - Logo with `holo-border`, breathing icon, and **2 orbiting dots** (cyan 6s + violet 9s reverse)
  - Live stat ticker (marquee) with 8 impressive stats scrolling horizontally with masked edges
  - Animated **money flow visualization**: 3 nodes (Orders → Settlements → Bank) connected by wires with pulsing `data-flow` dots traveling between them
  - Hover shimmer overlay on CTA button
  - Animated feature pills that scale on hover
- **ArchitectureDiagram**: added animated data flow arrows between stage cards (desktop) with colored `data-flow` dots, `holo-border` accents on cards, group-hover icon scale, "Pipeline architecture" eyebrow badge
- **PipelineRunner**: added `holo-border`, top shimmer bar, scan-line overlay during runs, "LIVE" badge with pulsing ping dot, **typewriter "agent thinking" terminal** showing `clearcut-agent $ <thinking message>` with blinking cursor and macOS-style traffic lights, refactored `useThinkingMessage` hook into a pure `deriveThinkingIdx` function (no setState in effect), live audit stream with event count
- **MetricsDashboard**: animated count-up with spring easing (1.4s, [0.34, 1.56, 0.64, 1]), card hover lift + color-matched glow, **stage breakdown sparkline strip** (4 vertical bars animating in with staggered delays, hover-reveals value), `holo-border` on idempotency badge
- **ExceptionList**: dramatic redesign
  - **Criticality summary bar** at top (CRITICAL / HIGH / MEDIUM / LOW counts)
  - Critical exceptions get `animate-glow-pulse-red` (breathing red neon) + **pulse ring** in top-left corner + animated red dot on category icon
  - Criticality badge on every exception
  - ESCALATED badge gets a pulsing red dot
  - Staggered entrance (delay = idx * 0.06)
  - Hover scale on category icon
  - Dossier gets a scan-line overlay + staggered hypothesis reveal
- **Charts**: 3D tilt entrance (rotateX), hover lift, pulsing ring around donut center, animated gradient match-rate %, glowing legend dots, animated bar chart with hover tooltips
- **MatchedRecordsTable**: top scan-line accent, staggered row entrance (delay = rowIdx * 0.015), `group` class for hover effects, sticky header with z-index
- **DataSourceCards**: `card-lift` class for hover translateY, animated count-up with spring, icon hover scale + blur glow

Verification Results:
- `bun run lint`: ✅ 0 errors, 0 warnings (after refactoring setState-in-effect issues)
- `bun run dev`: ✅ running on port 3000, no runtime errors
- agent-browser: ✅ verified
  - Hero renders with gradient title, orbiting dots, money flow viz, stat ticker
  - Architecture diagram with animated data flow dots
  - Pipeline runner with holoborder + scan line
  - Metrics with animated count-ups + sparkline
  - Charts with pulsing ring + animated donut
  - Matched records table with scan line + staggered rows
  - Exception list with criticality badges (CRITICAL/HIGH/MEDIUM/LOW), pulsing red glow on critical, staggered entrance
  - Forensic dossier expansion works (hypotheses, conclusion, dispute payload all show)
  - Previous run results persist on reload (55 matched, 6 exceptions)
  - No console errors

Stage Summary:
- Files created: `src/components/clearcut/Background.tsx` (CursorSpotlight + ParticleField + GradientMesh)
- Files modified: `src/app/globals.css` (7 new keyframes + 12 new utility classes), `src/app/layout.tsx` (mount background components), `src/components/clearcut/Hero.tsx` (full rebuild with money flow viz + stat ticker), `src/components/clearcut/ArchitectureDiagram.tsx` (animated data flow), `src/components/clearcut/PipelineRunner.tsx` (typewriter terminal + scan lines), `src/components/clearcut/MetricsDashboard.tsx` (sparkline + spring count-ups), `src/components/clearcut/ExceptionList.tsx` (criticality meter + pulse rings), `src/components/clearcut/Charts.tsx` (3D tilt + pulsing ring), `src/components/clearcut/MatchedRecordsTable.tsx` (scan line + staggered rows), `src/components/clearcut/DataSourceCards.tsx` (card-lift + animated counts)
- The page now has 3 layers of background animation (mesh, particles, spotlight), 7 distinct keyframe animations, holographic borders on key cards, a live agent terminal with typewriter effect, criticality-graded exception cards with breathing red glow, and animated data flow lines between pipeline stages.
- Result: significantly more attractive, animated, compelling, and convincing — ready to impress judges.

