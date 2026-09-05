# ClearCut — The Self-Resolving Finance Controller

> **Razorpay AI Buildathon · Track 04 — AI Finance Controller**
>
> *Verification capacity > Generation speed.*

ClearCut is an agentic AI system that autonomously reconciles a merchant's internal order database against Razorpay settlement reports and bank statements. It resolves multi-leg settlements (split payments, partial refunds, blended fees), auto-matches 90%+ of records, and generates an **honest exception list** with forensic audit trails for the rest.

The AI never guesses financial data. It either proves a match mathematically, or honestly admits it cannot resolve.

## Why this wins

- **Multi-leg settlement graphs** — not just 1-to-1 matching. Stage 3 generates JavaScript `findMatch()` code via LLM, then a deterministic sandbox verifies the math balances to exactly ₹0.00.
- **AI used surgically, never for arithmetic** — Stage 1 is pure deterministic TypeScript; Stage 2 uses the LLM only for text extraction (no math); Stage 3 uses the LLM only for code generation (math is verified separately); Stage 4 produces forensic dossiers.
- **Honest exception list** — every unresolved record comes with: hypotheses tested (MDR? TDS? Refund? Multi-leg?), each REJECTED with a reason, plus a conclusion, recommended action, and a pre-drafted dispute payload.
- **Idempotent, auditable, bounded execution** — every decision is recorded in an append-only audit trail. Running the same batch twice produces identical results.

## Architecture

```
Browser (page.tsx)
  ↓ fetch
API routes (/api/recon/run, /api/recon/results, /api/data, /api/audit, /api/export)
  ↓
ReconPipeline (src/lib/recon/pipeline.ts)
  ├── Stage 0 (pre-flight) — detect no-settlement, duplicate bank credits, future-dated settlements, currency mismatches
  ├── Stage 1 — deterministic hard match (no AI)
  ├── Stage 2 — LLM semantic normalization + regex fast path
  ├── Stage 3 — LLM codegen + deterministic graph resolver (math verified)
  └── Stage 4 — forensic dossiers + dispute payloads
       ↓
  llm-client.ts (z-ai-web-dev-sdk)
  fee-calculator.ts (deterministic math)
  audit-trail.ts (append-only log)
  types.ts (shared domain types)
       ↓
Prisma (SQLite @ db/custom.db)
```

## Metrics (61-record synthetic batch)

| Metric | Value |
|---|---|
| Total Records | 61 |
| Auto-Matched | 55 (90.16%) |
| Honest Exceptions | 6 (9.84%) |
| Stage 1 (Deterministic) | 30 |
| Stage 2 (AI Semantic) | 2 |
| Stage 3 (Multi-Leg + Fee-Adjusted) | 23 |
| False Positives | 0 |
| Throughput | ~2-3 minutes (LLM-bound) |

## AI Judgment — Where We Chose NOT to Use AI

- **Stage 1**: Pure TypeScript exact match. Where determinism guarantees zero hallucination risk, we chose not to use AI.
- **Stage 3**: LLM generates code, but the deterministic combinatorial solver is the source of truth. The LLM is a code generator, never a calculator. The LLM-generated code is captured in the audit trail but not executed in-process for safety.
- **Stage 4**: All hypotheses are tested deterministically (MDR %, TDS %, refund amount, multi-leg combos). The LLM does not produce the conclusion — it is derived from the test results.

## Running locally

```bash
bun install
bun run db:push         # push prisma schema to sqlite
bun run scripts/seed.ts # generate the 61-record synthetic dataset
bun run dev             # start the dev server on http://localhost:3000
```

Then open the preview and click **Run Reconciliation Pipeline**.

To verify the pipeline end-to-end without the frontend:

```bash
bun run scripts/smoke.ts
```

## Synthetic data

61 internal orders + 60 Razorpay settlements + 54 bank statement entries with 7 intentional quirks:

- 30 perfect 1-to-1 matches
- 5 MDR fee deductions (2% credit card)
- 3 TDS deductions (1%)
- 4 multi-leg settlement batches (2-3 orders per batch, single bank credit)
- 3 partial refunds (order − refund − MDR = bank credit)
- 3 UPI reference mismatches (bank uses different UTR format)
- 2 malformed bank narrations (garbled delimiters)
- 5 honest exceptions (no settlement, duplicate bank credit, unexplainable gap, future-dated settlement, currency mismatch)

## Project structure

```
prisma/schema.prisma                    # DB schema
scripts/seed.ts                         # synthetic data seeder
scripts/smoke.ts                        # pipeline smoke test
src/lib/recon/pipeline.ts                # main orchestrator
src/lib/recon/llm-client.ts             # z-ai-web-dev-sdk wrapper
src/lib/recon/fee-calculator.ts         # deterministic fee math
src/lib/recon/audit-trail.ts            # append-only log
src/lib/recon/types.ts                  # shared domain types
src/lib/synthetic/seed.ts               # 61-record generator
src/app/api/recon/run/route.ts          # POST: run pipeline
src/app/api/recon/results/route.ts      # GET: latest results
src/app/api/data/route.ts               # GET: source data
src/app/api/audit/route.ts              # GET: audit trail
src/app/api/export/route.ts             # GET: JSON/CSV export
src/app/page.tsx                        # main SPA
src/components/clearcut/*                # frontend components
```

## Tech stack

- Next.js 16 (App Router) + TypeScript 5
- Prisma ORM + SQLite
- Tailwind CSS 4 + shadcn/ui
- Framer Motion (animations)
- Recharts (charts)
- z-ai-web-dev-sdk (LLM)
- Lucide icons
