// GET /api/audit — return the latest audit trail
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const run = await db.pipelineRun.findFirst({
    orderBy: { startedAt: "desc" },
    include: { auditEntries: { orderBy: { seq: "asc" } } },
  });
  if (!run) return NextResponse.json({ audit: [] });
  return NextResponse.json({
    run: {
      id: run.id,
      startedAt: run.startedAt.toISOString(),
      finishedAt: run.finishedAt?.toISOString() ?? null,
      status: run.status,
    },
    audit: run.auditEntries.map((a) => ({
      seq: a.seq,
      timestamp: a.timestamp.toISOString(),
      event: a.event,
      stage: a.stage,
      data: JSON.parse(a.dataJson),
    })),
  });
}
