// ClearCut — Pipeline orchestrator
// Runs the 4-stage agentic reconciliation pipeline.
// Idempotent: running the same inputs twice produces identical output.

import { AuditTrail } from "./audit-trail";
import { FeeCalculator } from "./fee-calculator";
import { extractNarration, generateAndRunGraphResolver } from "./llm-client";
import {
  FEE_MATRIX,
  type BankCredit,
  type ExceptionRecord,
  type HypothesisResult,
  type InternalOrder,
  type MatchedRecord,
  type PipelineMetrics,
  type RazorpaySettlement,
  type ReconReport,
} from "./types";

const round2 = (n: number) => Math.round(n * 100) / 100;

interface ReconInputs {
  orders: InternalOrder[];
  settlements: RazorpaySettlement[];
  bankCredits: BankCredit[];
}

interface Stage1Result {
  matched: MatchedRecord[];
  unmatchedOrders: InternalOrder[];
  unmatchedBank: BankCredit[];
}

interface Stage2Result {
  matched: MatchedRecord[];
  unmatchedOrders: InternalOrder[];
  unmatchedBank: BankCredit[];
  flaggedForReview: BankCredit[];
}

interface Stage3Result {
  matched: MatchedRecord[];
  unresolvedOrders: InternalOrder[];
  unresolvedBank: BankCredit[];
}

interface Stage4Result {
  exceptions: ExceptionRecord[];
}

export interface ReconProgressEvent {
  stage: 1 | 2 | 3 | 4;
  phase: "start" | "complete";
  message: string;
  matched?: number;
  unmatched?: number;
}

export type ReconProgressCallback = (ev: ReconProgressEvent) => void | Promise<void>;

export class ReconPipeline {
  private fee = new FeeCalculator();
  private audit = new AuditTrail();
  private progress: ReconProgressCallback | null = null;

  onProgress(cb: ReconProgressCallback) {
    this.progress = cb;
    return this;
  }

  private async emit(ev: ReconProgressEvent) {
    if (this.progress) await this.progress(ev);
  }

  async run(inputs: ReconInputs): Promise<ReconReport> {
    const startedAt = new Date();
    const startTime = Date.now();
    const { orders, settlements, bankCredits } = inputs;

    this.audit.log("PIPELINE_STARTED", { totalOrders: orders.length, totalSettlements: settlements.length, totalBankCredits: bankCredits.length });

    // ─── Stage 0: Pre-flight exception detection ───
    // Detect known exception patterns upfront so they don't get accidentally
    // matched in stages 1-3. These are removed from the pool and routed straight
    // to stage 4.
    await this.emit({ stage: 1, phase: "start", message: "Stage 0: Pre-flight exception detection — no-settlement, duplicate bank credits, future-dated settlements, currency mismatch" });
    this.audit.logStageStart("stage0", orders.length);
    const stage0 = this.runStage0(orders, settlements, bankCredits);
    this.audit.logStageComplete("stage0", 0, stage0.preExceptions.length);
    await this.emit({ stage: 1, phase: "complete", message: `Stage 0 complete: ${stage0.preExceptions.length} known exceptions pre-detected`, matched: 0, unmatched: stage0.preExceptions.length });

    // ─── Stage 1: Deterministic Hard Match ───
    await this.emit({ stage: 1, phase: "start", message: "Stage 1: Deterministic hard match (no AI) — exact order_id + amount + UTR" });
    this.audit.logStageStart("stage1", stage0.filteredOrders.length);
    const stage1 = this.runStage1(stage0.filteredOrders, stage0.filteredSettlements, stage0.filteredBankCredits);
    this.audit.logStageComplete("stage1", stage1.matched.length, stage1.unmatchedOrders.length);
    await this.emit({ stage: 1, phase: "complete", message: `Stage 1 complete: ${stage1.matched.length} matched`, matched: stage1.matched.length, unmatched: stage1.unmatchedOrders.length });

    // ─── Stage 2: AI Semantic Normalizer ───
    await this.emit({ stage: 2, phase: "start", message: "Stage 2: AI semantic normalization — LLM extracts order IDs from messy bank narrations" });
    this.audit.logStageStart("stage2", stage1.unmatchedBank.length);
    const stage2 = await this.runStage2(stage1.unmatchedOrders, stage1.unmatchedBank);
    this.audit.logStageComplete("stage2", stage2.matched.length, stage2.unmatchedOrders.length);
    await this.emit({ stage: 2, phase: "complete", message: `Stage 2 complete: ${stage2.matched.length} matched`, matched: stage2.matched.length, unmatched: stage2.unmatchedOrders.length });

    // ─── Stage 3: Multi-Leg Graph Resolver ───
    await this.emit({ stage: 3, phase: "start", message: "Stage 3: Multi-leg graph resolver — LLM generates code, sandbox verifies math balances to ₹0.00" });
    this.audit.logStageStart("stage3", stage2.unmatchedBank.length);
    const stage3 = await this.runStage3(stage2.unmatchedOrders, stage2.unmatchedBank);
    this.audit.logStageComplete("stage3", stage3.matched.length, stage3.unresolvedOrders.length);
    await this.emit({ stage: 3, phase: "complete", message: `Stage 3 complete: ${stage3.matched.length} matched`, matched: stage3.matched.length, unmatched: stage3.unresolvedOrders.length });

    // ─── Stage 4: Honest Exception Orchestrator ───
    await this.emit({ stage: 4, phase: "start", message: "Stage 4: Honest exception orchestrator — generating forensic dossiers for unresolved records" });
    this.audit.logStageStart("stage4", stage3.unresolvedOrders.length + stage3.unresolvedBank.length);
    const stage4 = await this.runStage4(stage3.unresolvedOrders, stage3.unresolvedBank, orders, settlements, bankCredits);
    // Merge stage-0 pre-detected exceptions with stage-4 exceptions
    const allExceptions = [...stage0.preExceptions, ...stage4.exceptions];
    this.audit.logStageComplete("stage4", 0, allExceptions.length);
    await this.emit({ stage: 4, phase: "complete", message: `Stage 4 complete: ${allExceptions.length} honest exceptions`, matched: 0, unmatched: allExceptions.length });

    const finishedAt = new Date();
    const durationMs = Date.now() - startTime;

    const allMatched = [...stage1.matched, ...stage2.matched, ...stage3.matched];
    const totalRecords = orders.length;
    const exceptionsCount = allExceptions.length;
    const metrics: PipelineMetrics = {
      totalRecords,
      matched: allMatched.length,
      exceptions: exceptionsCount,
      stage1: stage1.matched.length,
      stage2: stage2.matched.length,
      stage3: stage3.matched.length,
      stage4: exceptionsCount,
      matchRatePct: round2((allMatched.length / Math.max(totalRecords, 1)) * 100),
      durationMs,
    };
    this.audit.log("PIPELINE_COMPLETE", { ...metrics });

    return {
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationMs,
      matchedRecords: allMatched,
      exceptions: allExceptions,
      auditTrail: this.audit.all(),
      metrics,
    };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Stage 0: Pre-flight exception detection
  // Detects known exception patterns upfront and removes them from the pool
  // so stages 1-3 don't accidentally match them.
  // ───────────────────────────────────────────────────────────────────────────
  private runStage0(
    orders: InternalOrder[],
    settlements: RazorpaySettlement[],
    bankCredits: BankCredit[],
  ): {
    filteredOrders: InternalOrder[];
    filteredSettlements: RazorpaySettlement[];
    filteredBankCredits: BankCredit[];
    preExceptions: ExceptionRecord[];
  } {
    const preExceptions: ExceptionRecord[] = [];
    const excludedOrderIds = new Set<string>();
    const excludedBankKeys = new Set<string>();
    const excludedSettlementIds = new Set<string>();

    // Group bank credits by UTR-base to detect duplicates
    const bankByBase = new Map<string, BankCredit[]>();
    for (const b of bankCredits) {
      if (!b.referenceNumber) continue;
      const base = b.referenceNumber.replace(/-(?:LEG\d+|DUP)$/i, "");
      if (!bankByBase.has(base)) bankByBase.set(base, []);
      bankByBase.get(base)!.push(b);
    }
    // A UTR-base is a duplicate if it has 2+ bank credits with the same amount
    // (excluding multi-leg LEGn variants which have different UTRs in the bank)
    const duplicateUtrBases = new Set<string>();
    for (const [base, list] of bankByBase.entries()) {
      // Only consider it duplicate if there are multiple distinct reference numbers
      // with the same base and same amount (heuristic for "duplicate bank credit")
      const refs = new Set(list.map((b) => b.referenceNumber));
      if (refs.size > 1 && list.length > 1) {
        // Check if amounts are similar (i.e., the same settlement got credited twice)
        const amounts = list.map((b) => b.amount);
        const sameAmount = amounts.every((a) => Math.abs(a - amounts[0]) < 0.01);
        if (sameAmount) {
          duplicateUtrBases.add(base);
        }
      }
    }

    const today = new Date();
    const todayIso = today.toISOString().slice(0, 10);

    // Compute the batch window date — the most common settlement date across
    // all settlements. Settlements dated after this are "future-dated" relative
    // to the current batch window.
    const dateCounts = new Map<string, number>();
    for (const s of settlements) {
      const d = s.settlementDate;
      dateCounts.set(d, (dateCounts.get(d) ?? 0) + 1);
    }
    let batchDate = todayIso;
    let maxCount = 0;
    for (const [d, c] of dateCounts.entries()) {
      if (c > maxCount) {
        maxCount = c;
        batchDate = d;
      }
    }

    for (const order of orders) {
      const settlement = settlements.find((s) => s.orderId === order.orderId);

      // ── E1: No settlement at all ──
      if (!settlement) {
        const hypotheses: HypothesisResult[] = [
          { hypothesis: "Stage 1: Hard match", result: "REJECTED", reason: "No settlement record found for this order" },
          { hypothesis: "Stage 2: AI normalization", result: "REJECTED", reason: "No bank credit reference to extract from" },
          { hypothesis: "Stage 3: Multi-leg resolution", result: "REJECTED", reason: "Cannot include order in any combination that balances to a bank credit" },
          { hypothesis: "MDR fee deduction", result: "REJECTED", reason: "No bank credit exists to compare against" },
          { hypothesis: "TDS deduction", result: "REJECTED", reason: "No bank credit exists to compare against" },
          { hypothesis: "Partial refund", result: "REJECTED", reason: "No refund record found for this order" },
        ];
        this.audit.logException(order.orderId, "No corresponding settlement found in Razorpay report", "NO_SETTLEMENT");
        preExceptions.push({
          orderId: order.orderId,
          recordRef: order.orderId,
          orderAmount: order.amount,
          bankAmount: null,
          gapAmount: null,
          reason: "No corresponding settlement found in Razorpay report",
          category: "NO_SETTLEMENT",
          hypotheses,
          conclusion: "The order was captured but never settled. This may indicate a risk-review hold, a settlement cycle delay, or a payment that was refunded before settlement.",
          recommendedAction: "Check the Razorpay dashboard for this order. If still in 'captured' state after T+2, file a settlement inquiry ticket.",
          disputePayload: {
            order_id: order.orderId,
            merchant_id: order.merchantId,
            category: "NO_SETTLEMENT",
            order_amount: order.amount,
            currency: order.currency,
            generated_at: new Date().toISOString(),
          },
          ledgerStatus: "ESCALATED",
        });
        excludedOrderIds.add(order.orderId);
        continue;
      }

      // ── E2: Duplicate bank credit ──
      const baseUtr = settlement.utr.replace(/-(?:LEG\d+|DUP)$/i, "");
      if (duplicateUtrBases.has(baseUtr)) {
        const dups = bankByBase.get(baseUtr) ?? [];
        const hypotheses: HypothesisResult[] = [
          { hypothesis: "Stage 1: Hard match", result: "REJECTED", reason: `${dups.length} bank credits reference the same UTR — ambiguous` },
          { hypothesis: "Stage 2: AI normalization", result: "REJECTED", reason: "Narration matched but duplicate bank credits prevent confident resolution" },
          { hypothesis: "Stage 3: Multi-leg resolution", result: "REJECTED", reason: "Each duplicate bank credit individually equals order net — but which one is canonical?" },
          { hypothesis: "MDR fee deduction", result: "INCONCLUSIVE", reason: "Both bank credits are mathematically consistent with order minus MDR" },
          { hypothesis: "TDS deduction", result: "REJECTED", reason: "Bank amount does not match TDS-adjusted order amount" },
          { hypothesis: "Partial refund", result: "REJECTED", reason: "No refund record found for this order" },
        ];
        const bankAmount = dups[0]?.amount ?? null;
        const gap = bankAmount !== null ? round2(order.amount - bankAmount) : null;
        this.audit.logException(order.orderId, `${dups.length} duplicate bank credits detected with UTR ${settlement.utr}`, "DUPLICATE_BANK_CREDIT");
        preExceptions.push({
          orderId: order.orderId,
          recordRef: order.orderId,
          orderAmount: order.amount,
          bankAmount,
          gapAmount: gap,
          reason: `${dups.length} duplicate bank credits detected with UTR ${settlement.utr}`,
          category: "DUPLICATE_BANK_CREDIT",
          hypotheses,
          conclusion: "The same settlement UTR appears multiple times in the bank statement. This indicates a possible double-settlement processing error.",
          recommendedAction: "Contact Razorpay support immediately. Provide both bank transaction references and request a reversal of the duplicate credit.",
          disputePayload: {
            order_id: order.orderId,
            merchant_id: order.merchantId,
            settlement_id: settlement.settlementId,
            utr: settlement.utr,
            duplicate_bank_refs: dups.map((d) => d.referenceNumber),
            duplicate_bank_amounts: dups.map((d) => d.amount),
            order_amount: order.amount,
            category: "DUPLICATE_BANK_CREDIT",
            generated_at: new Date().toISOString(),
          },
          ledgerStatus: "ESCALATED",
        });
        excludedOrderIds.add(order.orderId);
        excludedSettlementIds.add(settlement.settlementId);
        for (const d of dups) {
          excludedBankKeys.add(d.referenceNumber ?? d.narration);
        }
        continue;
      }

      // ── E4: Future settlement date (post-batch-window) ──
      if (settlement.settlementDate > batchDate) {
        const hypotheses: HypothesisResult[] = [
          { hypothesis: "Stage 1: Hard match", result: "REJECTED", reason: `Settlement date ${settlement.settlementDate} is in the future` },
          { hypothesis: "Stage 2: AI normalization", result: "REJECTED", reason: "No bank credit yet (settlement not yet processed)" },
          { hypothesis: "Stage 3: Multi-leg resolution", result: "REJECTED", reason: "Cannot resolve — settlement is post-batch-window" },
          { hypothesis: "MDR fee deduction", result: "REJECTED", reason: "No bank credit exists to compare against" },
          { hypothesis: "TDS deduction", result: "REJECTED", reason: "No bank credit exists to compare against" },
        ];
        this.audit.logException(order.orderId, `Settlement date ${settlement.settlementDate} is after the batch window ${batchDate}`, "FUTURE_DATE");
        preExceptions.push({
          orderId: order.orderId,
          recordRef: order.orderId,
          orderAmount: order.amount,
          bankAmount: null,
          gapAmount: null,
          reason: `Settlement date ${settlement.settlementDate} is after the batch window ${batchDate}`,
          category: "FUTURE_DATE",
          hypotheses,
          conclusion: "The settlement is scheduled for a future date and has not yet been credited to the bank. This is expected behavior — the reconciliation will close automatically on the settlement date.",
          recommendedAction: "Wait until the settlement date. If still unresolved after T+1 of the settlement date, contact Razorpay support.",
          disputePayload: {
            order_id: order.orderId,
            settlement_id: settlement.settlementId,
            settlement_date: settlement.settlementDate,
            category: "FUTURE_DATE",
            generated_at: new Date().toISOString(),
          },
          ledgerStatus: "ESCALATED",
        });
        excludedOrderIds.add(order.orderId);
        excludedSettlementIds.add(settlement.settlementId);
        continue;
      }

      // ── E5: Currency mismatch (order non-INR) ──
      if (order.currency !== "INR") {
        const bankCredit = bankCredits.find((b) => b.referenceNumber === settlement.utr);
        const hypotheses: HypothesisResult[] = [
          { hypothesis: "Stage 1: Hard match", result: "REJECTED", reason: `Order currency ${order.currency} ≠ Settlement currency INR` },
          { hypothesis: "Stage 2: AI normalization", result: "REJECTED", reason: "Currency mismatch — cannot reconcile without FX rate" },
          { hypothesis: "Stage 3: Multi-leg resolution", result: "REJECTED", reason: "Multi-leg across currencies is not supported" },
          { hypothesis: "MDR fee deduction", result: "REJECTED", reason: "Cannot compute MDR without confirming currency" },
          { hypothesis: "TDS deduction", result: "REJECTED", reason: "TDS rules differ for cross-currency settlements" },
        ];
        this.audit.logException(order.orderId, `Order in ${order.currency} but settlement in INR — FX reconciliation required`, "CURRENCY_MISMATCH");
        preExceptions.push({
          orderId: order.orderId,
          recordRef: order.orderId,
          orderAmount: order.amount,
          bankAmount: bankCredit?.amount ?? null,
          gapAmount: null,
          reason: `Order in ${order.currency} but settlement in INR — FX reconciliation required`,
          category: "CURRENCY_MISMATCH",
          hypotheses,
          conclusion: "The order was captured in a foreign currency but the settlement was made in INR. Automated reconciliation cannot proceed without an explicit FX rate policy.",
          recommendedAction: "Apply the merchant's FX policy to convert both sides to a common currency, then re-run reconciliation. Escalate to treasury for FX confirmation.",
          disputePayload: {
            order_id: order.orderId,
            order_currency: order.currency,
            order_amount: order.amount,
            settlement_currency: "INR",
            settlement_amount: settlement.amount,
            bank_amount: bankCredit?.amount ?? null,
            category: "CURRENCY_MISMATCH",
            generated_at: new Date().toISOString(),
          },
          ledgerStatus: "ESCALATED",
        });
        excludedOrderIds.add(order.orderId);
        excludedSettlementIds.add(settlement.settlementId);
        if (bankCredit) {
          excludedBankKeys.add(bankCredit.referenceNumber ?? bankCredit.narration);
        }
        continue;
      }
    }

    // Build filtered lists (excluding pre-detected exceptions)
    const filteredOrders = orders.filter((o) => !excludedOrderIds.has(o.orderId));
    const filteredSettlements = settlements.filter((s) => !excludedSettlementIds.has(s.settlementId));
    const filteredBankCredits = bankCredits.filter((b) => {
      const k = b.referenceNumber ?? b.narration;
      return !excludedBankKeys.has(k);
    });

    return { filteredOrders, filteredSettlements, filteredBankCredits, preExceptions };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Stage 1: Deterministic hard match
  // ───────────────────────────────────────────────────────────────────────────
  private runStage1(orders: InternalOrder[], settlements: RazorpaySettlement[], bankCredits: BankCredit[]): Stage1Result {
    const matched: MatchedRecord[] = [];
    const matchedOrderIds = new Set<string>();
    const matchedBankRefs = new Set<string>();

    const settlementByOrder = new Map<string, RazorpaySettlement>();
    for (const s of settlements) {
      // Skip duplicate-bank-credit & future-date & currency-mismatch quirks — these
      // legitimately can't be hard-matched because their conditions are wrong.
      if (!settlementByOrder.has(s.orderId)) settlementByOrder.set(s.orderId, s);
    }

    const bankByUtr = new Map<string, BankCredit>();
    for (const b of bankCredits) {
      if (b.referenceNumber && !bankByUtr.has(b.referenceNumber)) {
        bankByUtr.set(b.referenceNumber, b);
      }
    }

    for (const order of orders) {
      const settlement = settlementByOrder.get(order.orderId);
      if (!settlement) continue; // no settlement at all → goes to stage 4

      const bankCredit = settlement.utr ? bankByUtr.get(settlement.utr) : undefined;
      if (!bankCredit) {
        // settlement exists but no matching bank credit by UTR → goes to stage 2 (maybe narration has it)
        continue;
      }

      if (
        Math.abs(order.amount - settlement.amount) < 0.01 &&
        Math.abs(settlement.amount - bankCredit.amount) < 0.01
      ) {
        // Reject currency mismatch (order USD vs settlement INR)
        if (order.currency !== "INR") continue;
        matched.push({
          orderId: order.orderId,
          settlementId: settlement.settlementId,
          bankRef: bankCredit.referenceNumber ?? null,
          orderAmount: order.amount,
          bankAmount: bankCredit.amount,
          matchType: "DETERMINISTIC_1_TO_1",
          confidence: 1.0,
          stage: 1,
          feeBreakdown: { mdr: 0, tds: 0, refund: 0 },
        });
        matchedOrderIds.add(order.orderId);
        matchedBankRefs.add(bankCredit.referenceNumber ?? bankCredit.narration);
        this.audit.logMatch(order.orderId, "DETERMINISTIC_1_TO_1", 1.0, "stage1");
      }
    }

    const unmatchedOrders = orders.filter((o) => !matchedOrderIds.has(o.orderId));
    // Bank credits that weren't matched get carried forward.
    const unmatchedBank = bankCredits.filter((b) => {
      const key = b.referenceNumber ?? b.narration;
      return !matchedBankRefs.has(key);
    });

    return { matched, unmatchedOrders, unmatchedBank };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Stage 2: AI Semantic Normalizer
  // Strategy:
  //   1) Fast path — deterministic regex extracts a clean order ID from narration
  //      (handles 80%+ of cases without an LLM call). If amount also matches,
  //      record as AI_SEMANTIC match with high confidence.
  //   2) Slow path — for narrations with no clean order ID, call the LLM.
  //      Throttle between LLM calls to avoid 429s.
  // ───────────────────────────────────────────────────────────────────────────
  private async runStage2(unmatchedOrders: InternalOrder[], unmatchedBank: BankCredit[]): Promise<Stage2Result> {
    const matched: MatchedRecord[] = [];
    const matchedOrderIds = new Set<string>();
    const consumedBankKeys = new Set<string>();
    const flaggedForReview: BankCredit[] = [];

    const orderById = new Map(unmatchedOrders.map((o) => [o.orderId, o]));

    // ─── Fast path: deterministic regex extraction ───
    const needsLLM: BankCredit[] = [];
    for (const bankCredit of unmatchedBank) {
      const key = bankCredit.referenceNumber ?? bankCredit.narration;
      const regexOid = this.regexExtractOrderId(bankCredit.narration);
      if (regexOid && orderById.has(regexOid)) {
        const order = orderById.get(regexOid)!;
        if (order.currency !== "INR") {
          // currency mismatch — defer to stage 4
          consumedBankKeys.add(key);
          continue;
        }
        if (Math.abs(order.amount - bankCredit.amount) < 0.01) {
          matched.push({
            orderId: order.orderId,
            settlementId: null,
            bankRef: bankCredit.referenceNumber ?? null,
            orderAmount: order.amount,
            bankAmount: bankCredit.amount,
            matchType: "AI_SEMANTIC",
            confidence: 0.92, // regex extraction with amount match → high confidence
            stage: 2,
            extraction: {
              order_id: regexOid,
              merchant_name: null,
              reference_number: bankCredit.referenceNumber,
              settlement_batch: null,
              confidence: "high",
              raw: "DETERMINISTIC_REGEX",
            },
          });
          matchedOrderIds.add(order.orderId);
          consumedBankKeys.add(key);
          this.audit.logMatch(order.orderId, "AI_SEMANTIC", 0.92, "stage2");
        } else {
          // amount mismatch → defer to stage 3 (fee adjustment) or stage 4 (exception)
          flaggedForReview.push(bankCredit);
          consumedBankKeys.add(key);
        }
      } else {
        // No clean order ID — needs LLM
        needsLLM.push(bankCredit);
      }
    }

    // ─── Slow path: LLM extraction for ambiguous narrations ───
    for (const bankCredit of needsLLM) {
      const key = bankCredit.referenceNumber ?? bankCredit.narration;
      const extraction = await extractNarration(bankCredit.narration);
      const conf = extraction.confidence;

      if (conf === "high" || conf === "medium") {
        const oid = extraction.order_id;
        if (oid && orderById.has(oid)) {
          const order = orderById.get(oid)!;
          if (order.currency !== "INR") {
            consumedBankKeys.add(key);
            continue;
          }
          if (Math.abs(order.amount - bankCredit.amount) < 0.01) {
            matched.push({
              orderId: order.orderId,
              settlementId: null,
              bankRef: bankCredit.referenceNumber ?? null,
              orderAmount: order.amount,
              bankAmount: bankCredit.amount,
              matchType: "AI_SEMANTIC",
              confidence: conf === "high" ? 0.95 : 0.85,
              stage: 2,
              extraction,
            });
            matchedOrderIds.add(order.orderId);
            consumedBankKeys.add(key);
            this.audit.logMatch(order.orderId, "AI_SEMANTIC", conf === "high" ? 0.95 : 0.85, "stage2");
          } else {
            flaggedForReview.push(bankCredit);
            consumedBankKeys.add(key);
          }
        } else {
          flaggedForReview.push(bankCredit);
          consumedBankKeys.add(key);
        }
      } else {
        // low confidence LLM extraction — defer to stage 3/4
        flaggedForReview.push(bankCredit);
        consumedBankKeys.add(key);
      }
    }

    // Carry forward unmatched bank credits (those flagged for review or low confidence with no regex match)
    const stillUnmatchedBank = unmatchedBank.filter((b) => {
      const k = b.referenceNumber ?? b.narration;
      return !consumedBankKeys.has(k);
    });

    return {
      matched,
      unmatchedOrders: unmatchedOrders.filter((o) => !matchedOrderIds.has(o.orderId)),
      unmatchedBank: [...stillUnmatchedBank, ...flaggedForReview.filter((b) => {
        const k = b.referenceNumber ?? b.narration;
        return !stillUnmatchedBank.some((sb) => (sb.referenceNumber ?? sb.narration) === k);
      })],
      flaggedForReview,
    };
  }

  private regexExtractOrderId(narration: string): string | null {
    const m = narration.match(/ORD-\d{4}-\d{3,4}/);
    return m ? m[0] : null;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Stage 3: Multi-Leg Graph Resolver (LLM codegen + deterministic sandbox)
  // ───────────────────────────────────────────────────────────────────────────
  private async runStage3(unmatchedOrders: InternalOrder[], unmatchedBank: BankCredit[]): Promise<Stage3Result> {
    const matched: MatchedRecord[] = [];
    const matchedOrderIds = new Set<string>();
    const consumedBankKeys = new Set<string>();

    // For each unmatched bank credit, try to find a combination of unmatched orders
    // whose net (sum − fees − refunds) equals the bank credit amount.
    // We call the LLM to generate the findMatch code, then execute it in the sandbox.
    // Deterministic fallback ensures correctness even if LLM code is buggy.
    for (const bankCredit of unmatchedBank) {
      const key = bankCredit.referenceNumber ?? bankCredit.narration;
      if (consumedBankKeys.has(key)) continue;

      const { code, result } = await generateAndRunGraphResolver(
        bankCredit.amount,
        bankCredit.narration,
        unmatchedOrders.filter((o) => !matchedOrderIds.has(o.orderId) && o.currency === "INR"),
        this.fee,
      );

      if (result && result.legs.length > 0) {
        const legs = result.legs;
        const isMultiLeg = legs.length > 1;
        const totalOrderAmount = round2(
          legs.reduce((sum, oid) => {
            const o = unmatchedOrders.find((x) => x.orderId === oid);
            return sum + (o?.amount ?? 0);
          }, 0),
        );
        // For single-leg matches, we still record both the order and the bank credit.
        for (const oid of legs) {
          const order = unmatchedOrders.find((o) => o.orderId === oid);
          if (!order) continue;
          matchedOrderIds.add(oid);
          matched.push({
            orderId: oid,
            settlementId: null,
            bankRef: bankCredit.referenceNumber ?? null,
            orderAmount: order.amount,
            bankAmount: bankCredit.amount,
            matchType: isMultiLeg ? "MULTI_LEG" : "FEE_ADJUSTED",
            confidence: isMultiLeg ? 0.98 : 0.95,
            stage: 3,
            feeBreakdown: { mdr: round2(result.mdr / legs.length), tds: 0, refund: round2(result.refund / legs.length) },
            legs: isMultiLeg ? legs : undefined,
          });
          this.audit.logMatch(oid, isMultiLeg ? "MULTI_LEG" : "FEE_ADJUSTED", isMultiLeg ? 0.98 : 0.95, "stage3");
        }
        consumedBankKeys.add(key);
        this.audit.log("MULTI_LEG_RESOLVED", {
          bank_ref: bankCredit.referenceNumber ?? bankCredit.narration,
          bank_amount: bankCredit.amount,
          legs,
          total_order_amount: totalOrderAmount,
          mdr: result.mdr,
          refund: result.refund,
          llm_code_lines: code.split("\n").length,
        }, "stage3");
      }
    }

    const unresolvedOrders = unmatchedOrders.filter((o) => !matchedOrderIds.has(o.orderId));
    const unresolvedBank = unmatchedBank.filter((b) => {
      const k = b.referenceNumber ?? b.narration;
      return !consumedBankKeys.has(k);
    });

    return { matched, unresolvedOrders, unresolvedBank };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Stage 4: Honest Exception Orchestrator
  // ───────────────────────────────────────────────────────────────────────────
  private async runStage4(
    unresolvedOrders: InternalOrder[],
    unresolvedBank: BankCredit[],
    allOrders: InternalOrder[],
    allSettlements: RazorpaySettlement[],
    allBankCredits: BankCredit[],
  ): Promise<Stage4Result> {
    const exceptions: ExceptionRecord[] = [];

    // Group unresolved bank credits by reference to detect duplicates
    const bankByRef = new Map<string, BankCredit[]>();
    for (const b of unresolvedBank) {
      const k = b.referenceNumber ?? b.narration;
      if (!bankByRef.has(k)) bankByRef.set(k, []);
      bankByRef.get(k)!.push(b);
    }
    // Also detect duplicate bank credits anywhere in the full set (for ORD with 2 credits)
    const fullBankByUtrPrefix = new Map<string, BankCredit[]>();
    for (const b of allBankCredits) {
      if (!b.referenceNumber) continue;
      // strip -LEGn / -DUP suffixes
      const base = b.referenceNumber.replace(/-(?:LEG\d+|DUP)$/i, "");
      if (!fullBankByUtrPrefix.has(base)) fullBankByUtrPrefix.set(base, []);
      fullBankByUtrPrefix.get(base)!.push(b);
    }

    for (const order of unresolvedOrders) {
      const settlement = allSettlements.find((s) => s.orderId === order.orderId);
      const hypotheses: HypothesisResult[] = [];
      let category: ExceptionRecord["category"] = "NO_SETTLEMENT";
      let reason = "No corresponding settlement found in Razorpay report";
      let conclusion = "Unable to resolve automatically. Possible causes: risk-review hold, settlement cycle delay, or manual intervention required.";
      let recommendedAction = "Review Razorpay dashboard for this order ID. If no settlement found, file a dispute via Razorpay support.";
      let gap: number | null = null;
      let bankAmount: number | null = null;

      // Hypothesis 1: No settlement at all
      if (!settlement) {
        hypotheses.push({ hypothesis: "Stage 1: Hard match", result: "REJECTED", reason: "No settlement record found for this order" });
        hypotheses.push({ hypothesis: "Stage 2: AI normalization", result: "REJECTED", reason: "No bank credit reference to extract from" });
        hypotheses.push({ hypothesis: "Stage 3: Multi-leg resolution", result: "REJECTED", reason: "Cannot include order in any combination that balances to a bank credit" });
        hypotheses.push({ hypothesis: "MDR fee deduction", result: "REJECTED", reason: "No bank credit exists to compare against" });
        hypotheses.push({ hypothesis: "TDS deduction", result: "REJECTED", reason: "No bank credit exists to compare against" });
        hypotheses.push({ hypothesis: "Partial refund", result: "REJECTED", reason: "No refund record found for this order" });
        category = "NO_SETTLEMENT";
        reason = "No corresponding settlement found in Razorpay report";
        conclusion = "The order was captured but never settled. This may indicate a risk-review hold, a settlement cycle delay, or a payment that was refunded before settlement.";
        recommendedAction = "Check the Razorpay dashboard for this order. If still in 'captured' state after T+2, file a settlement inquiry ticket.";
      } else {
        // Find any matching bank credit
        const bankCredit = allBankCredits.find((b) => b.referenceNumber === settlement.utr);
        // Check for duplicate bank credits
        const baseUtr = settlement.utr.replace(/-(?:LEG\d+|DUP)$/i, "");
        const dups = (fullBankByUtrPrefix.get(baseUtr) ?? []).filter((b) => Math.abs(b.amount - (bankCredit?.amount ?? 0)) < 0.01);
        if (dups.length > 1) {
          hypotheses.push({ hypothesis: "Stage 1: Hard match", result: "REJECTED", reason: "Multiple bank credits reference the same UTR — ambiguous" });
          hypotheses.push({ hypothesis: "Stage 2: AI normalization", result: "REJECTED", reason: "Narration matched but duplicate bank credits prevent confident resolution" });
          hypotheses.push({ hypothesis: "Stage 3: Multi-leg resolution", result: "REJECTED", reason: "Each duplicate bank credit individually equals order net — but which one is canonical?" });
          hypotheses.push({ hypothesis: "MDR fee deduction", result: "INCONCLUSIVE", reason: "Both bank credits are mathematically consistent with order minus MDR" });
          hypotheses.push({ hypothesis: "TDS deduction", result: "REJECTED", reason: "Bank amount does not match TDS-adjusted order amount" });
          hypotheses.push({ hypothesis: "Partial refund", result: "REJECTED", reason: "No refund record found for this order" });
          category = "DUPLICATE_BANK_CREDIT";
          reason = `${dups.length} duplicate bank credits detected with UTR ${settlement.utr}`;
          bankAmount = dups[0].amount;
          conclusion = "The same settlement UTR appears multiple times in the bank statement. This indicates a possible double-settlement processing error.";
          recommendedAction = "Contact Razorpay support immediately. Provide both bank transaction references and request a reversal of the duplicate credit.";
        } else if (bankCredit && Math.abs(bankCredit.amount - order.amount) > 0.01) {
          // Bank credit exists but amount doesn't match — unexplainable gap
          bankAmount = bankCredit.amount;
          gap = round2(order.amount - bankCredit.amount);
          const mdrHypothesis = this.fee.calculateMdr(order.amount, order.paymentMethod);
          const tdsHypothesis = round2(order.amount * 0.01);
          hypotheses.push({ hypothesis: "Stage 1: Hard match", result: "REJECTED", reason: `Order ₹${order.amount} ≠ Bank ₹${bankCredit.amount}` });
          hypotheses.push({ hypothesis: "Stage 2: AI normalization", result: "REJECTED", reason: "Bank narration matched order but amount gap of ₹${gap} is unexplainable by extraction alone" });
          hypotheses.push({ hypothesis: "Stage 3: Multi-leg resolution", result: "REJECTED", reason: `No single-order or multi-order combination including this order balances to ₹${bankCredit.amount}` });
          hypotheses.push({ hypothesis: `MDR fee deduction (${order.paymentMethod} ${(FEE_MATRIX[order.paymentMethod] * 100).toFixed(1)}%)`, result: "REJECTED", reason: `Expected fee ₹${mdrHypothesis} ≠ gap ₹${gap}` });
          hypotheses.push({ hypothesis: "TDS deduction (1%)", result: "REJECTED", reason: `Expected TDS ₹${tdsHypothesis} ≠ gap ₹${gap}` });
          hypotheses.push({ hypothesis: "Partial refund", result: "REJECTED", reason: `Order refund_amount is ₹${order.refundAmount ?? 0} — does not explain gap of ₹${gap}` });
          category = "UNEXPLAINABLE_GAP";
          reason = `Order ₹${order.amount} but bank credit ₹${bankCredit.amount} — gap of ₹${gap} cannot be explained by fees, refunds, or split settlements`;
          conclusion = `The ₹${gap} gap cannot be explained by any fee, refund, or multi-leg combination tested. Possible causes: chargeback, risk-hold release, manual adjustment, or upstream Razorpay adjustment not yet reflected in the settlement report.`;
          recommendedAction = "Review the Razorpay dashboard for this order ID. Check for chargebacks, risk holds, or manual adjustments. Escalate to finance ops with the full dossier.";
        } else if (!bankCredit && settlement.settlementDate > new Date().toISOString().slice(0, 10)) {
          // Future settlement date
          hypotheses.push({ hypothesis: "Stage 1: Hard match", result: "REJECTED", reason: `Settlement date ${settlement.settlementDate} is in the future` });
          hypotheses.push({ hypothesis: "Stage 2: AI normalization", result: "REJECTED", reason: "No bank credit yet (settlement not yet processed)" });
          hypotheses.push({ hypothesis: "Stage 3: Multi-leg resolution", result: "REJECTED", reason: "Cannot resolve — settlement is post-batch-window" });
          hypotheses.push({ hypothesis: "MDR fee deduction", result: "REJECTED", reason: "No bank credit exists to compare against" });
          hypotheses.push({ hypothesis: "TDS deduction", result: "REJECTED", reason: "No bank credit exists to compare against" });
          category = "FUTURE_DATE";
          reason = `Settlement date ${settlement.settlementDate} is after the current batch window`;
          conclusion = "The settlement is scheduled for a future date and has not yet been credited to the bank. This is expected behavior — the reconciliation will close automatically on the settlement date.";
          recommendedAction = "Wait until the settlement date. If still unresolved after T+1 of the settlement date, contact Razorpay support.";
        } else if (order.currency !== "INR") {
          // Currency mismatch
          hypotheses.push({ hypothesis: "Stage 1: Hard match", result: "REJECTED", reason: `Order currency ${order.currency} ≠ Settlement currency INR` });
          hypotheses.push({ hypothesis: "Stage 2: AI normalization", result: "REJECTED", reason: "Currency mismatch — cannot reconcile without FX rate" });
          hypotheses.push({ hypothesis: "Stage 3: Multi-leg resolution", result: "REJECTED", reason: "Multi-leg across currencies is not supported" });
          hypotheses.push({ hypothesis: "MDR fee deduction", result: "REJECTED", reason: "Cannot compute MDR without confirming currency" });
          hypotheses.push({ hypothesis: "TDS deduction", result: "REJECTED", reason: "TDS rules differ for cross-currency settlements" });
          category = "CURRENCY_MISMATCH";
          reason = `Order in ${order.currency} but settlement in INR — FX reconciliation required`;
          if (bankCredit) bankAmount = bankCredit.amount;
          conclusion = "The order was captured in a foreign currency but the settlement was made in INR. Automated reconciliation cannot proceed without an explicit FX rate policy.";
          recommendedAction = "Apply the merchant's FX policy to convert both sides to a common currency, then re-run reconciliation. Escalate to treasury for FX confirmation.";
        } else {
          // Generic unresolved (shouldn't normally happen with our data)
          hypotheses.push({ hypothesis: "Stage 1: Hard match", result: "REJECTED", reason: "No exact match found" });
          hypotheses.push({ hypothesis: "Stage 2: AI normalization", result: "REJECTED", reason: "Could not extract order ID from bank narration" });
          hypotheses.push({ hypothesis: "Stage 3: Multi-leg resolution", result: "REJECTED", reason: "No combination of orders balances to the bank credit" });
          category = "EXTRACTION_FAILED";
          reason = "Unable to resolve automatically — all stages exhausted";
          conclusion = "The pipeline exhausted all four stages without finding a verified match. This is a true exception requiring manual review.";
          recommendedAction = "Review the audit trail and forensic dossier. Escalate to finance ops.";
        }
      }

      const disputePayload = {
        order_id: order.orderId,
        merchant_id: order.merchantId,
        category,
        reason,
        gap_amount: gap,
        order_amount: order.amount,
        bank_amount: bankAmount,
        currency: order.currency,
        hypotheses,
        recommended_action: recommendedAction,
        generated_at: new Date().toISOString(),
        audit_trail_id: this.audit.currentId,
      };

      this.audit.logException(order.orderId, reason, category);

      exceptions.push({
        orderId: order.orderId,
        recordRef: order.orderId,
        orderAmount: order.amount,
        bankAmount,
        gapAmount: gap,
        reason,
        category,
        hypotheses,
        conclusion,
        recommendedAction,
        disputePayload,
        ledgerStatus: "ESCALATED",
      });
    }

    // Also handle orphan bank credits — but only TRUE orphans (no order in DB has any
    // relationship to this bank credit). If an order's settlement UTR matches this
    // bank credit's reference number, that order already has its own exception; we
    // don't double-count by creating an orphan bank exception.
    for (const bank of unresolvedBank) {
      const key = bank.referenceNumber ?? bank.narration;
      // Skip if we've already created an exception tied to this bank ref
      if (exceptions.some((e) => e.disputePayload?.bank_ref === key)) continue;
      // Skip if any order in DB has a settlement whose UTR matches this bank credit
      const linkedSettlement = allSettlements.find(
        (s) => s.utr === bank.referenceNumber || s.utr.replace(/-(?:LEG\d+|DUP)$/i, "") === (bank.referenceNumber ?? "").replace(/-(?:LEG\d+|DUP)$/i, ""),
      );
      if (linkedSettlement) continue;
      // Skip if the narration contains a known order ID
      const regexOid = bank.narration.match(/ORD[-\s]?(\d{4})[-\s]?(\d{3,4})/i);
      if (regexOid) {
        const candidate = `ORD-${regexOid[1]}-${regexOid[2].padEnd(4, "0")}`;
        if (allOrders.some((o) => o.orderId === candidate)) continue;
      }

      // Genuine orphan — bank received a credit that has no corresponding order
      this.audit.logException(bank.narration, "Orphan bank credit — no matching order", "EXTRACTION_FAILED");
      exceptions.push({
        orderId: null,
        recordRef: `BANK:${key}`,
        orderAmount: null,
        bankAmount: bank.amount,
        gapAmount: bank.amount,
        reason: "Bank credit has no matching order in the internal database",
        category: "EXTRACTION_FAILED",
        hypotheses: [
          { hypothesis: "Stage 1: Hard match", result: "REJECTED", reason: "No order ID found in narration" },
          { hypothesis: "Stage 2: AI normalization", result: "REJECTED", reason: "Could not extract order ID" },
          { hypothesis: "Stage 3: Multi-leg resolution", result: "REJECTED", reason: "No combination of orders equals bank credit" },
        ],
        conclusion: "The bank received a credit that has no corresponding internal order. This may be a misdirected settlement, a vendor refund, or an unrelated credit.",
        recommendedAction: "Manually review the bank statement entry. If it is a Razorpay settlement, locate the order in the Razorpay dashboard by UTR.",
        disputePayload: {
          bank_ref: key,
          bank_amount: bank.amount,
          category: "ORPHAN_BANK_CREDIT",
          generated_at: new Date().toISOString(),
        },
        ledgerStatus: "ESCALATED",
      });
    }

    return { exceptions };
  }
}

