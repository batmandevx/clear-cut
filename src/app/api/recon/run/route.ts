// POST /api/recon/run — execute the 4-stage reconciliation pipeline
// Persists results to the database and returns the full report.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ReconPipeline, type ReconProgressEvent } from "@/lib/recon/pipeline";
import type {
  BankCredit,
  InternalOrder,
  RazorpaySettlement,
} from "@/lib/recon/types";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes — Stage 2/3 LLM calls can be slow

export async function POST() {
  const startedAt = new Date();
  const startTime = Date.now();

  // Load source data
  const [ordersDb, settlementsDb, bankCreditsDb] = await Promise.all([
    db.internalOrder.findMany({ orderBy: { orderId: "asc" } }),
    db.razorpaySettlement.findMany({ orderBy: { settlementId: "asc" } }),
    db.bankCredit.findMany({ orderBy: { narration: "asc" } }),
  ]);

  const orders: InternalOrder[] = ordersDb.map((o) => ({
    orderId: o.orderId,
    merchantId: o.merchantId,
    customerName: o.customerName,
    amount: o.amount,
    currency: o.currency,
    paymentMethod: o.paymentMethod as InternalOrder["paymentMethod"],
    status: o.status,
    createdAt: o.createdAt.toISOString(),
    refundAmount: o.refundAmount,
    routeSplit: o.routeSplitJson ? JSON.parse(o.routeSplitJson) : null,
    notes: o.notes,
  }));
  const settlements: RazorpaySettlement[] = settlementsDb.map((s) => ({
    settlementId: s.settlementId,
    orderId: s.orderId,
    amount: s.amount,
    feeAmount: s.feeAmount,
    refundAmount: s.refundAmount,
    settlementStatus: s.settlementStatus,
    settlementDate: s.settlementDate.toISOString().slice(0, 10),
    utr: s.utr,
  }));
  const bankCredits: BankCredit[] = bankCreditsDb.map((b) => ({
    txnDate: b.txnDate.toISOString().slice(0, 10),
    narration: b.narration,
    amount: b.amount,
    referenceNumber: b.referenceNumber,
    status: b.status,
  }));

  // Create pipeline run record (status=running)
  const run = await db.pipelineRun.create({
    data: {
      startedAt,
      status: "running",
      totalRecords: orders.length,
    },
  });

  // Collect progress events into a transcript we persist after completion
  const progressLog: ReconProgressEvent[] = [];
  const pipeline = new ReconPipeline().onProgress((ev) => {
    progressLog.push(ev);
  });

  let report;
  try {
    report = await pipeline.run({ orders, settlements, bankCredits });
  } catch (err) {
    await db.pipelineRun.update({
      where: { id: run.id },
      data: {
        status: "failed",
        finishedAt: new Date(),
        durationMs: Date.now() - startTime,
      },
    });
    return NextResponse.json(
      { error: "Pipeline failed", message: (err as Error).message },
      { status: 500 },
    );
  }

  const finishedAt = new Date();
  const durationMs = Date.now() - startTime;

  // Persist matched records
  await db.matchedRecord.createMany({
    data: report.matchedRecords.map((m) => ({
      runId: run.id,
      orderId: m.orderId,
      settlementId: m.settlementId,
      bankRef: m.bankRef,
      orderAmount: m.orderAmount,
      bankAmount: m.bankAmount,
      matchType: m.matchType,
      confidence: m.confidence,
      stage: String(m.stage),
      feeBreakdownJson: m.feeBreakdown ? JSON.stringify(m.feeBreakdown) : null,
      legsJson: m.legs ? JSON.stringify(m.legs) : null,
      extractionJson: m.extraction ? JSON.stringify(m.extraction) : null,
    })),
  });
  // Persist exceptions
  await db.exceptionRecord.createMany({
    data: report.exceptions.map((e) => ({
      runId: run.id,
      orderId: e.orderId,
      recordRef: e.recordRef,
      orderAmount: e.orderAmount,
      bankAmount: e.bankAmount,
      gapAmount: e.gapAmount,
      reason: e.reason,
      category: e.category,
      hypothesisJson: JSON.stringify(e.hypotheses),
      conclusion: e.conclusion,
      recommendedAction: e.recommendedAction,
      disputePayloadJson: e.disputePayload ? JSON.stringify(e.disputePayload) : null,
      ledgerStatus: e.ledgerStatus,
    })),
  });
  // Persist audit entries
  await db.auditEntry.createMany({
    data: report.auditTrail.map((a) => ({
      runId: run.id,
      seq: a.seq,
      timestamp: new Date(a.timestamp),
      event: a.event,
      stage: a.stage ?? null,
      dataJson: JSON.stringify(a.data ?? {}),
    })),
  });

  // Update pipeline run with metrics
  await db.pipelineRun.update({
    where: { id: run.id },
    data: {
      status: "completed",
      finishedAt,
      durationMs,
      totalRecords: report.metrics.totalRecords,
      matchedCount: report.metrics.matched,
      exceptionCount: report.metrics.exceptions,
      stage1Count: report.metrics.stage1,
      stage2Count: report.metrics.stage2,
      stage3Count: report.metrics.stage3,
      stage4Count: report.metrics.stage4,
    },
  });

  return NextResponse.json({
    runId: run.id,
    report,
    progressLog,
  });
}
