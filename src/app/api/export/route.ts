// GET /api/export?format=json|csv — export the latest run's exception report
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "object" ? JSON.stringify(v) : String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(headers.map((h) => escape(r[h])).join(","));
  }
  return lines.join("\n");
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "json";
  const run = await db.pipelineRun.findFirst({
    orderBy: { startedAt: "desc" },
    include: { exceptions: true, matches: true, auditEntries: true },
  });
  if (!run) {
    return NextResponse.json({ error: "No pipeline run found" }, { status: 404 });
  }

  const payload = {
    run: {
      id: run.id,
      startedAt: run.startedAt.toISOString(),
      finishedAt: run.finishedAt?.toISOString() ?? null,
      durationMs: run.durationMs,
      metrics: {
        totalRecords: run.totalRecords,
        matched: run.matchedCount,
        exceptions: run.exceptionCount,
        stage1: run.stage1Count,
        stage2: run.stage2Count,
        stage3: run.stage3Count,
        stage4: run.stage4Count,
        matchRatePct: run.totalRecords > 0 ? Math.round((run.matchedCount / run.totalRecords) * 1000) / 10 : 0,
      },
    },
    exceptions: run.exceptions.map((e) => ({
      orderId: e.orderId,
      recordRef: e.recordRef,
      category: e.category,
      reason: e.reason,
      orderAmount: e.orderAmount,
      bankAmount: e.bankAmount,
      gapAmount: e.gapAmount,
      conclusion: e.conclusion,
      recommendedAction: e.recommendedAction,
      hypotheses: JSON.parse(e.hypothesisJson),
      disputePayload: e.disputePayloadJson ? JSON.parse(e.disputePayloadJson) : null,
      ledgerStatus: e.ledgerStatus,
    })),
    matches: run.matches.map((m) => ({
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
    })),
  };

  if (format === "csv") {
    const csv = toCsv(
      payload.exceptions.map((e) => ({
        orderId: e.orderId ?? "",
        category: e.category,
        reason: e.reason,
        orderAmount: e.orderAmount ?? "",
        bankAmount: e.bankAmount ?? "",
        gapAmount: e.gapAmount ?? "",
        ledgerStatus: e.ledgerStatus,
        recommendedAction: e.recommendedAction,
      })),
    );
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="clearcut-exceptions-${run.id}.csv"`,
      },
    });
  }

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="clearcut-report-${run.id}.json"`,
    },
  });
}
