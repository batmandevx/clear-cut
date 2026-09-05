// GET /api/data — return the seeded dataset (orders + settlements + bank credits)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const orders = await db.internalOrder.findMany({ orderBy: { orderId: "asc" } });
  const settlements = await db.razorpaySettlement.findMany({ orderBy: { settlementId: "asc" } });
  const bankCredits = await db.bankCredit.findMany({ orderBy: { narration: "asc" } });
  const lastRun = await db.pipelineRun.findFirst({ orderBy: { startedAt: "desc" } });

  return NextResponse.json({
    orders: orders.map((o) => ({
      orderId: o.orderId,
      merchantId: o.merchantId,
      customerName: o.customerName,
      amount: o.amount,
      currency: o.currency,
      paymentMethod: o.paymentMethod,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
      refundAmount: o.refundAmount,
      routeSplit: o.routeSplitJson ? JSON.parse(o.routeSplitJson) : null,
      notes: o.notes,
    })),
    settlements: settlements.map((s) => ({
      settlementId: s.settlementId,
      orderId: s.orderId,
      amount: s.amount,
      feeAmount: s.feeAmount,
      refundAmount: s.refundAmount,
      settlementStatus: s.settlementStatus,
      settlementDate: s.settlementDate.toISOString().slice(0, 10),
      utr: s.utr,
    })),
    bankCredits: bankCredits.map((b) => ({
      txnDate: b.txnDate.toISOString().slice(0, 10),
      narration: b.narration,
      amount: b.amount,
      referenceNumber: b.referenceNumber,
      status: b.status,
    })),
    lastRunId: lastRun?.id ?? null,
    counts: {
      orders: orders.length,
      settlements: settlements.length,
      bankCredits: bankCredits.length,
    },
  });
}
