// Quick smoke test — run the pipeline on the seeded data and print metrics.
// Usage: bun run scripts/smoke.ts

import { db } from "../src/lib/db";
import { ReconPipeline } from "../src/lib/recon/pipeline";
import type { BankCredit, InternalOrder, RazorpaySettlement } from "../src/lib/recon/types";

async function main() {
  const [ordersDb, settlementsDb, bankCreditsDb] = await Promise.all([
    db.internalOrder.findMany(),
    db.razorpaySettlement.findMany(),
    db.bankCredit.findMany(),
  ]);
  const orders: InternalOrder[] = ordersDb.map((o) => ({
    orderId: o.orderId, merchantId: o.merchantId, customerName: o.customerName,
    amount: o.amount, currency: o.currency, paymentMethod: o.paymentMethod as InternalOrder["paymentMethod"],
    status: o.status, createdAt: o.createdAt.toISOString(), refundAmount: o.refundAmount,
    routeSplit: o.routeSplitJson ? JSON.parse(o.routeSplitJson) : null, notes: o.notes,
  }));
  const settlements: RazorpaySettlement[] = settlementsDb.map((s) => ({
    settlementId: s.settlementId, orderId: s.orderId, amount: s.amount, feeAmount: s.feeAmount,
    refundAmount: s.refundAmount, settlementStatus: s.settlementStatus,
    settlementDate: s.settlementDate.toISOString().slice(0, 10), utr: s.utr,
  }));
  const bankCredits: BankCredit[] = bankCreditsDb.map((b) => ({
    txnDate: b.txnDate.toISOString().slice(0, 10), narration: b.narration, amount: b.amount,
    referenceNumber: b.referenceNumber, status: b.status,
  }));

  console.log(`Loaded ${orders.length} orders, ${settlements.length} settlements, ${bankCredits.length} bank credits`);
  console.log("Running pipeline (this may take 1-2 minutes due to LLM calls)...\n");

  const pipeline = new ReconPipeline().onProgress((ev) => {
    console.log(`[stage ${ev.stage}/${ev.phase}] ${ev.message}`);
  });
  const report = await pipeline.run({ orders, settlements, bankCredits });

  console.log("\n═══ METRICS ═══");
  console.log(JSON.stringify(report.metrics, null, 2));
  console.log(`\n═══ EXCEPTIONS (${report.exceptions.length}) ═══`);
  for (const e of report.exceptions) {
    console.log(`  ${e.orderId ?? e.recordRef} [${e.category}] — ${e.reason}`);
  }
  console.log(`\n═══ AUDIT TRAIL (${report.auditTrail.length} entries) ═══`);
  for (const a of report.auditTrail.slice(-15)) {
    console.log(`  ${a.seq}. [${a.stage ?? "—"}] ${a.event}`);
  }
  await db.$disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
