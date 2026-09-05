// ClearCut — DB seed script
// Usage: bun run scripts/seed.ts
// Generates the 55+ record synthetic dataset and writes it to SQLite via Prisma.

import { db } from "../src/lib/db";
import { generateSeed } from "../src/lib/synthetic/seed";

async function main() {
  console.log("ClearCut — seeding synthetic data...");
  // Clean previous data
  await db.matchedRecord.deleteMany();
  await db.exceptionRecord.deleteMany();
  await db.auditEntry.deleteMany();
  await db.pipelineRun.deleteMany();
  await db.internalOrder.deleteMany();
  await db.razorpaySettlement.deleteMany();
  await db.bankCredit.deleteMany();

  const seed = generateSeed();
  console.log(`Generated ${seed.orders.length} orders, ${seed.settlements.length} settlements, ${seed.bankCredits.length} bank credits`);

  // Insert in batches
  for (const o of seed.orders) {
    await db.internalOrder.create({
      data: {
        orderId: o.orderId,
        merchantId: o.merchantId,
        customerName: o.customerName,
        amount: o.amount,
        currency: o.currency,
        paymentMethod: o.paymentMethod,
        status: o.status,
        createdAt: new Date(o.createdAt),
        refundAmount: o.refundAmount,
        routeSplitJson: o.routeSplit ? JSON.stringify(o.routeSplit) : null,
        notes: o.notes,
      },
    });
  }
  for (const s of seed.settlements) {
    await db.razorpaySettlement.create({
      data: {
        settlementId: s.settlementId,
        orderId: s.orderId,
        amount: s.amount,
        feeAmount: s.feeAmount,
        refundAmount: s.refundAmount,
        settlementStatus: s.settlementStatus,
        settlementDate: new Date(s.settlementDate),
        utr: s.utr,
      },
    });
  }
  for (const b of seed.bankCredits) {
    await db.bankCredit.create({
      data: {
        txnDate: new Date(b.txnDate),
        narration: b.narration,
        amount: b.amount,
        referenceNumber: b.referenceNumber ?? null,
        status: b.status,
      },
    });
  }

  console.log(`✓ Seeded ${seed.orders.length} orders, ${seed.settlements.length} settlements, ${seed.bankCredits.length} bank credits`);
  console.log(`  Expected: stage1=${seed.expected.stage1}, stage2=${seed.expected.stage2}, stage3_multiLeg=${seed.expected.stage3MultiLeg}, stage3_feeAdjusted=${seed.expected.stage3FeeAdjusted}, exceptions=${seed.expected.exceptions}, matchRate=${seed.expected.matchRatePct}`);
  await db.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
