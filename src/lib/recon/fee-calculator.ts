// ClearCut — Fee calculator (deterministic source of truth)
// Matches the spec: NO AI here. Math only.

import { FEE_MATRIX, TDS_RATE, type InternalOrder, type PaymentMethod } from "./types";

const round2 = (n: number) => Math.round(n * 100) / 100;

export class FeeCalculator {
  calculateMdr(amount: number, method: PaymentMethod): number {
    const rate = FEE_MATRIX[method] ?? 0.02;
    return round2(amount * rate);
  }
  calculateTds(amount: number): number {
    return round2(amount * TDS_RATE);
  }
  /**
   * Net settlement = order amount − MDR − refund.
   * For Route-split orders, vendor amount is already net of platform fee.
   */
  calculateNetSettlement(order: InternalOrder): { net: number; mdr: number; tds: number; refund: number } {
    const refund = order.refundAmount ?? 0;
    if (order.routeSplit) {
      return {
        net: round2(order.routeSplit.vendorAmount - refund),
        mdr: 0,
        tds: 0,
        refund,
      };
    }
    const mdr = this.calculateMdr(order.amount, order.paymentMethod);
    return { net: round2(order.amount - mdr - refund), mdr, tds: 0, refund };
  }
}
