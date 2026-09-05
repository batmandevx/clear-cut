// GET /api/recon/results — return the latest pipeline run + all matched/exception/audit records
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const run = await db.pipelineRun.findFirst({
    orderBy: { startedAt: "desc" },
    include: {
      matches: { orderBy: { stage: "asc" } },
      exceptions: { orderBy: { createdAt: "asc" } },
      auditEntries: { orderBy: { seq: "asc" } },
    },
  });

  if (!run) {
    return NextResponse.json({ run: null });
  }

  return NextResponse.json({
    run: {
      id: run.id,
      startedAt: run.startedAt.toISOString(),
      finishedAt: run.finishedAt?.toISOString() ?? null,
      status: run.status,
      durationMs: run.durationMs,
      totalRecords: run.totalRecords,
      matchedCount: run.matchedCount,
      exceptionCount: run.exceptionCount,
      stage1: run.stage1Count,
      stage2: run.stage2Count,
      stage3: run.stage3Count,
      stage4: run.stage4Count,
    },
    matches: run.matches.map((m) => ({
      id: m.id,
      orderId: m.orderId,
      settlementId: m.settlementId,
      bankRef: m.bankRef,
      orderAmount: m.orderAmount,
      bankAmount: m.bankAmount,
      matchType: m.matchType,
      confidence: m.confidence,
      stage: Number(m.stage),
      feeBreakdown: m.feeBreakdownJson ? JSON.parse(m.feeBreakdownJson) : null,
      legs: m.legsJson ? JSON.parse(m.legsJson) : null,
      extraction: m.extractionJson ? JSON.parse(m.extractionJson) : null,
    })),
    exceptions: run.exceptions.map((e) => ({
      id: e.id,
      orderId: e.orderId,
      recordRef: e.recordRef,
      orderAmount: e.orderAmount,
      bankAmount: e.bankAmount,
      gapAmount: e.gapAmount,
      reason: e.reason,
      category: e.category,
      hypotheses: JSON.parse(e.hypothesisJson),
      conclusion: e.conclusion,
      recommendedAction: e.recommendedAction,
      disputePayload: e.disputePayloadJson ? JSON.parse(e.disputePayloadJson) : null,
      ledgerStatus: e.ledgerStatus,
    })),
    audit: run.auditEntries.map((a) => ({
      seq: a.seq,
      timestamp: a.timestamp.toISOString(),
      event: a.event,
      stage: a.stage,
      data: JSON.parse(a.dataJson),
    })),
  });
}
