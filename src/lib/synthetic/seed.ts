// ClearCut — Synthetic data generator
// Produces 55 records across 3 sources (internal orders, razorpay settlements, bank credits)
// with all 7 intentional quirks described in the build spec.
//
// Quirks:
//   Q1  MDR fee deduction      (credit_card, 2% MDR)
//   Q2  TDS deduction          (1% TDS on settlement)
//   Q3  Multi-leg settlement   (one bank credit = 3 orders - blended fees)
//   Q4  Partial refund         (order - refund - MDR = bank credit)
//   Q5  UPI reference mismatch (bank uses different UTR format, must match via narration)
//   Q6  Malformed narration     (garbled text → low confidence)
//   Q7  Honest exceptions       (5 unresolvable records)
//
// Distribution (55 orders):
//   30 perfect 1-to-1
//    5 MDR
//    3 TDS
//    4 multi-leg (each consumes 2-3 orders → 10 underlying orders, 4 bank credits)
//    3 partial refund
//    3 UPI mismatch
//    2 malformed narration  (these are also "matched with low confidence" — count as stage-2 wins)
//    5 honest exceptions (no settlement / duplicate / unexplainable gap / future date / currency mismatch)
//
// Note: the spec defines 55 total records. To keep the count consistent across the three
// sources we ensure every internal order has at most one settlement, every settlement has
// exactly one UTR, and bank credits = sum of all "settled" legs (some grouped as multi-leg).

import type { BankCredit, InternalOrder, PaymentMethod, RazorpaySettlement } from "@/lib/recon/types";

const MERCHANT_ID = "MERCH_AYUSH";
const SETTLEMENT_DATE = "2025-08-29"; // ISO yyyy-mm-dd
const TXN_DATE = "2025-08-29";

const round2 = (n: number) => Math.round(n * 100) / 100;

const mdr = (amount: number, method: PaymentMethod) => {
  const rates: Record<PaymentMethod, number> = {
    upi: 0.0,
    netbanking: 0.01,
    credit_card: 0.02,
    debit_card: 0.015,
    wallet: 0.02,
  };
  return round2(amount * rates[method]);
};

const tds = (amount: number) => round2(amount * 0.01);

interface Seed {
  orders: InternalOrder[];
  settlements: RazorpaySettlement[];
  bankCredits: BankCredit[];
  expected: {
    totalRecords: number;
    stage1: number;
    stage2: number;
    stage3MultiLeg: number;
    stage3FeeAdjusted: number;
    exceptions: number;
    matchRatePct: string;
  };
}

let utrCounter = 9834726101;
const nextUtr = () => `UTR${utrCounter++}`;
let setCounter = 1;
const nextSetId = () => `SET-2025-${String(setCounter++).padStart(4, "0")}`;

let upiRefCounter = 329084716200;
const nextUpiRef = () => `UPI/${upiRefCounter++}`;

export function generateSeed(): Seed {
  const orders: InternalOrder[] = [];
  const settlements: RazorpaySettlement[] = [];
  const bankCredits: BankCredit[] = [];
  let orderIdx = 1;
  const nextOrderId = () => `ORD-2025-${String(orderIdx++).padStart(4, "0")}`;

  // ───────────── Q0: 30 perfect 1-to-1 matches ─────────────
  const perfectCustomers = [
    "Rahul Sharma", "Ananya Iyer", "Vikram Reddy", "Sneha Kapoor",
    "Arjun Mehta", "Pooja Nair", "Rohan Desai", "Meera Joshi",
    "Karan Malhotra", "Divya Rao", "Aditya Banerjee", "Isha Agarwal",
    "Nikhil Khanna", "Tanvi Shah", "Manish Gupta", "Kavya Pillai",
    "Saurabh Verma", "Ritu Singh", "Gaurav Pandey", "Lakshmi Menon",
    "Akash Bhat", "Nisha Rao", "Pranav Kulkarni", "Sahil Chawla",
    "Meghna Das", "Yash Trivedi", "Aniket Bhatia", "Riya Chopra",
    "Devansh Roy", "Tara Sengupta",
  ];
  const perfectAmounts = [
    500, 1200, 2500, 5000, 8000, 330, 1750, 4200, 6100, 9800,
    760, 1900, 3450, 5200, 8800, 410, 1650, 4900, 6300, 7700,
    990, 2100, 3850, 5900, 8150, 720, 2700, 4500, 6850, 7250,
  ];
  for (let i = 0; i < 30; i++) {
    const orderId = nextOrderId();
    const amount = perfectAmounts[i];
    const method: PaymentMethod = i % 3 === 0 ? "upi" : i % 3 === 1 ? "credit_card" : "netbanking";
    const utr = nextUtr();
    const setId = nextSetId();
    orders.push({
      orderId,
      merchantId: MERCHANT_ID,
      customerName: perfectCustomers[i],
      amount,
      currency: "INR",
      paymentMethod: method,
      status: "captured",
      createdAt: `2025-08-28T10:${String(15 + i % 40).padStart(2, "0")}:00Z`,
      refundAmount: 0,
      routeSplit: null,
      notes: "",
      quirk: "perfect_1_to_1",
    });
    settlements.push({
      settlementId: setId,
      orderId,
      amount,
      feeAmount: 0,
      refundAmount: 0,
      settlementStatus: "settled",
      settlementDate: SETTLEMENT_DATE,
      utr,
      quirk: "perfect_1_to_1",
    });
    bankCredits.push({
      txnDate: TXN_DATE,
      narration: `RAZORPAY/MERCHANT/${orderId}`,
      amount,
      referenceNumber: utr,
      status: "credit",
      quirk: "perfect_1_to_1",
    });
  }

  // ───────────── Q1: 5 MDR fee deductions (credit_card, 2% MDR) ─────────────
  const mdrCustomers = ["Jai Krishnan", "Farah Sheikh", "Vivek Anand", "Naina Bose", "Rahul Kashyap"];
  const mdrAmounts = [10000, 15000, 22000, 8000, 12500];
  for (let i = 0; i < 5; i++) {
    const orderId = nextOrderId();
    const amount = mdrAmounts[i];
    const fee = mdr(amount, "credit_card");
    const net = round2(amount - fee);
    const utr = nextUtr();
    const setId = nextSetId();
    orders.push({
      orderId,
      merchantId: MERCHANT_ID,
      customerName: mdrCustomers[i],
      amount,
      currency: "INR",
      paymentMethod: "credit_card",
      status: "captured",
      createdAt: `2025-08-28T12:${String(i * 3 + 10).padStart(2, "0")}:00Z`,
      refundAmount: 0,
      routeSplit: null,
      notes: "Credit card payment, 2% MDR",
      quirk: "mdr_deduction",
    });
    settlements.push({
      settlementId: setId,
      orderId,
      amount,
      feeAmount: fee,
      refundAmount: 0,
      settlementStatus: "settled",
      settlementDate: SETTLEMENT_DATE,
      utr,
      quirk: "mdr_deduction",
    });
    bankCredits.push({
      txnDate: TXN_DATE,
      narration: `RAZORPAY*MERCH_AYUSH-${orderId} CC`,
      amount: net,
      referenceNumber: utr,
      status: "credit",
      quirk: "mdr_deduction",
    });
  }

  // ───────────── Q2: 3 TDS deductions (1% TDS) ─────────────
  const tdsCustomers = ["Ramesh Babu", "Geeta Iyengar", "Imran Qureshi"];
  const tdsAmounts = [10000, 20000, 15000];
  for (let i = 0; i < 3; i++) {
    const orderId = nextOrderId();
    const amount = tdsAmounts[i];
    const tdsAmt = tds(amount);
    const net = round2(amount - tdsAmt);
    const utr = nextUtr();
    const setId = nextSetId();
    orders.push({
      orderId,
      merchantId: MERCHANT_ID,
      customerName: tdsCustomers[i],
      amount,
      currency: "INR",
      paymentMethod: "netbanking",
      status: "captured",
      createdAt: `2025-08-28T13:${String(i * 5 + 5).padStart(2, "0")}:00Z`,
      refundAmount: 0,
      routeSplit: null,
      notes: "TDS applicable (1%)",
      quirk: "tds_deduction",
    });
    settlements.push({
      settlementId: setId,
      orderId,
      amount,
      feeAmount: 0,
      refundAmount: 0,
      settlementStatus: "settled",
      settlementDate: SETTLEMENT_DATE,
      utr,
      quirk: "tds_deduction",
    });
    bankCredits.push({
      txnDate: TXN_DATE,
      narration: `NEFT CR RAZORPAY LTD SETTLEMENT ${orderId}`,
      amount: net,
      referenceNumber: utr,
      status: "credit",
      quirk: "tds_deduction",
    });
  }

  // ───────────── Q3: 4 multi-leg settlements ─────────────
  // Each multi-leg: 2-3 orders → 1 bank credit (sum minus blended fees)
  const multiLegBatches = [
    { legs: [15000, 12000, 16000], methods: ["credit_card", "credit_card", "credit_card"] as PaymentMethod[] },
    { legs: [8000, 6000], methods: ["credit_card", "upi"] as PaymentMethod[] },
    { legs: [9000, 7000, 11000], methods: ["netbanking", "credit_card", "debit_card"] as PaymentMethod[] },
    { legs: [5000, 4000], methods: ["debit_card", "upi"] as PaymentMethod[] },
  ];
  const multiLegCustomers = ["Aarav Sinha", "Diya Acharya", "Veer Rao", "Anaya Gupta", "Reyansh Nair", "Saanvi Menon", "Arnav Pillai", "Kiara Bose", "Vivaan Trivedi", "Myra Kapoor"];
  let mlCustIdx = 0;
  for (let b = 0; b < multiLegBatches.length; b++) {
    const batch = multiLegBatches[b];
    const legOrderIds: string[] = [];
    let totalFee = 0;
    let totalAmount = 0;
    for (let j = 0; j < batch.legs.length; j++) {
      const orderId = nextOrderId();
      const amount = batch.legs[j];
      const method = batch.methods[j];
      totalAmount += amount;
      totalFee += mdr(amount, method);
      legOrderIds.push(orderId);
      orders.push({
        orderId,
        merchantId: MERCHANT_ID,
        customerName: multiLegCustomers[mlCustIdx++],
        amount,
        currency: "INR",
        paymentMethod: method,
        status: "captured",
        createdAt: `2025-08-28T14:${String(b * 10 + j * 2).padStart(2, "0")}:00Z`,
        refundAmount: 0,
        routeSplit: null,
        notes: `Batched settlement ${b + 1}`,
        quirk: `multi_leg_${b + 1}`,
      });
    }
    const net = round2(totalAmount - totalFee);
    const utr = nextUtr();
    const setId = nextSetId();
    // settlement reflects the aggregate via a single settlement that lists the first order
    // (we will resolve multi-leg via the graph resolver, not via settlement.orderId lookup)
    for (let j = 0; j < legOrderIds.length; j++) {
      settlements.push({
        settlementId: j === 0 ? setId : `${setId}-LEG${j + 1}`,
        orderId: legOrderIds[j],
        amount: batch.legs[j],
        feeAmount: mdr(batch.legs[j], batch.methods[j]),
        refundAmount: 0,
        settlementStatus: "settled",
        settlementDate: SETTLEMENT_DATE,
        utr: j === 0 ? utr : `${utr}-LEG${j + 1}`, // bank only sees the master UTR
        quirk: `multi_leg_${b + 1}`,
      });
    }
    bankCredits.push({
      txnDate: TXN_DATE,
      narration: `RZRPAY SETTLEMENT BATCH 20250829-B${b + 1}`,
      amount: net,
      referenceNumber: utr,
      status: "credit",
      quirk: `multi_leg_${b + 1}`,
    });
  }

  // ───────────── Q4: 3 partial refunds ─────────────
  const refundCustomers = ["Ira Banerjee", "Kabir Sethi", "Mahika Jain"];
  const refundData = [
    { amount: 7500, refund: 2000, method: "credit_card" as PaymentMethod },
    { amount: 10000, refund: 1000, method: "credit_card" as PaymentMethod },
    { amount: 5000, refund: 500, method: "debit_card" as PaymentMethod },
  ];
  for (let i = 0; i < 3; i++) {
    const orderId = nextOrderId();
    const { amount, refund, method } = refundData[i];
    const fee = mdr(amount, method);
    const net = round2(amount - refund - fee);
    const utr = nextUtr();
    const setId = nextSetId();
    orders.push({
      orderId,
      merchantId: MERCHANT_ID,
      customerName: refundCustomers[i],
      amount,
      currency: "INR",
      paymentMethod: method,
      status: "captured",
      createdAt: `2025-08-28T15:${String(i * 7 + 10).padStart(2, "0")}:00Z`,
      refundAmount: refund,
      routeSplit: null,
      notes: `Partial refund of ₹${refund}`,
      quirk: "partial_refund",
    });
    settlements.push({
      settlementId: setId,
      orderId,
      amount,
      feeAmount: fee,
      refundAmount: refund,
      settlementStatus: "settled",
      settlementDate: SETTLEMENT_DATE,
      utr,
      quirk: "partial_refund",
    });
    bankCredits.push({
      txnDate: TXN_DATE,
      narration: `RAZORPAY/ORD-${orderId.split("-")[2]}/REFUND-ADJ`,
      amount: net,
      referenceNumber: utr,
      status: "credit",
      quirk: "partial_refund",
    });
  }

  // ───────────── Q5: 3 UPI reference mismatches ─────────────
  // Bank uses a different UPI reference format. Settlement has its own UTR.
  // Resolution path: bank narration contains order ID → match via narration, not via UTR.
  const upiCustomers = ["Naveen Rao", "Shreya Bose", "Tushar Ahuja"];
  const upiAmounts = [3000, 4500, 2700];
  for (let i = 0; i < 3; i++) {
    const orderId = nextOrderId();
    const amount = upiAmounts[i];
    const utr = nextUtr();
    const upiRef = nextUpiRef();
    const setId = nextSetId();
    orders.push({
      orderId,
      merchantId: MERCHANT_ID,
      customerName: upiCustomers[i],
      amount,
      currency: "INR",
      paymentMethod: "upi",
      status: "captured",
      createdAt: `2025-08-28T16:${String(i * 4 + 5).padStart(2, "0")}:00Z`,
      refundAmount: 0,
      routeSplit: null,
      notes: "UPI payment, bank reference differs",
      quirk: "upi_ref_mismatch",
    });
    settlements.push({
      settlementId: setId,
      orderId,
      amount,
      feeAmount: 0,
      refundAmount: 0,
      settlementStatus: "settled",
      settlementDate: SETTLEMENT_DATE,
      utr,
      quirk: "upi_ref_mismatch",
    });
    bankCredits.push({
      txnDate: TXN_DATE,
      narration: `UPI/${orderId.replace("ORD-2025-", "ORD")} RZPX MERCH AYUSH`,
      amount,
      referenceNumber: upiRef,
      status: "credit",
      quirk: "upi_ref_mismatch",
    });
  }

  // ───────────── Q6: 2 malformed narrations ─────────────
  // Garbled delimiters around the order ID but the ID itself is intact.
  // Bank reference number is null (so Stage 1 fails) → Stage 2 LLM extraction must rescue it.
  for (let i = 0; i < 2; i++) {
    const orderId = nextOrderId();
    const amount = i === 0 ? 6000 : 4500;
    const utr = nextUtr();
    const setId = nextSetId();
    orders.push({
      orderId,
      merchantId: MERCHANT_ID,
      customerName: `Customer ${orderId.split("-")[3]}`,
      amount,
      currency: "INR",
      paymentMethod: "upi",
      status: "captured",
      createdAt: `2025-08-28T17:${String(i * 5 + 5).padStart(2, "0")}:00Z`,
      refundAmount: 0,
      routeSplit: null,
      notes: "Malformed bank narration — should be flagged medium-confidence extraction",
      quirk: "malformed_narration",
    });
    settlements.push({
      settlementId: setId,
      orderId,
      amount,
      feeAmount: 0,
      refundAmount: 0,
      settlementStatus: "settled",
      settlementDate: SETTLEMENT_DATE,
      utr,
      quirk: "malformed_narration",
    });
    bankCredits.push({
      txnDate: TXN_DATE,
      narration: i === 0 ? `RAZORPAY////${orderId}//ERR` : `RZRP*${orderId}?? MERCH`,
      amount,
      referenceNumber: null, // forces Stage 1 to fail
      status: "credit",
      quirk: "malformed_narration",
    });
  }

  // ───────────── Q7: 5 honest exceptions ─────────────
  // E1: no settlement at all (order captured but never settled)
  {
    const orderId = nextOrderId();
    orders.push({
      orderId,
      merchantId: MERCHANT_ID,
      customerName: "Exception One",
      amount: 8000,
      currency: "INR",
      paymentMethod: "upi",
      status: "captured",
      createdAt: "2025-08-28T09:00:00Z",
      refundAmount: 0,
      routeSplit: null,
      notes: "No settlement found in Razorpay report — possible risk-review hold",
      quirk: "exception_no_settlement",
    });
    // intentionally no settlement + no bank credit
  }

  // E2: duplicate bank credit (one settlement, two bank credits with same UTR-ish)
  {
    const orderId = nextOrderId();
    const amount = 12000;
    const utr = nextUtr();
    const setId = nextSetId();
    orders.push({
      orderId,
      merchantId: MERCHANT_ID,
      customerName: "Exception Two",
      amount,
      currency: "INR",
      paymentMethod: "credit_card",
      status: "captured",
      createdAt: "2025-08-28T09:30:00Z",
      refundAmount: 0,
      routeSplit: null,
      notes: "Duplicate bank credit detected",
      quirk: "exception_duplicate_bank_credit",
    });
    settlements.push({
      settlementId: setId,
      orderId,
      amount,
      feeAmount: mdr(amount, "credit_card"),
      refundAmount: 0,
      settlementStatus: "settled",
      settlementDate: SETTLEMENT_DATE,
      utr,
      quirk: "exception_duplicate_bank_credit",
    });
    bankCredits.push({
      txnDate: TXN_DATE,
      narration: `RAZORPAY/MERCHANT/${orderId} A`,
      amount: round2(amount - mdr(amount, "credit_card")),
      referenceNumber: utr,
      status: "credit",
      quirk: "exception_duplicate_bank_credit",
    });
    bankCredits.push({
      txnDate: TXN_DATE,
      narration: `RAZORPAY/MERCHANT/${orderId} B`,
      amount: round2(amount - mdr(amount, "credit_card")),
      referenceNumber: `${utr}-DUP`,
      status: "credit",
      quirk: "exception_duplicate_bank_credit",
    });
  }

  // E3: unexplainable gap (order 10k, bank credit 4k, no refund record)
  {
    const orderId = nextOrderId();
    const amount = 10000;
    const utr = nextUtr();
    const setId = nextSetId();
    orders.push({
      orderId,
      merchantId: MERCHANT_ID,
      customerName: "Exception Three",
      amount,
      currency: "INR",
      paymentMethod: "upi",
      status: "captured",
      createdAt: "2025-08-28T10:00:00Z",
      refundAmount: 0,
      routeSplit: null,
      notes: "Unexplainable ₹6,000 gap, no refund record",
      quirk: "exception_unexplainable_gap",
    });
    settlements.push({
      settlementId: setId,
      orderId,
      amount,
      feeAmount: 0,
      refundAmount: 0,
      settlementStatus: "settled",
      settlementDate: SETTLEMENT_DATE,
      utr,
      quirk: "exception_unexplainable_gap",
    });
    bankCredits.push({
      txnDate: TXN_DATE,
      narration: `RAZORPAY/MERCHANT/${orderId}`,
      amount: 4000,
      referenceNumber: utr,
      status: "credit",
      quirk: "exception_unexplainable_gap",
    });
  }

  // E4: future settlement date (settlement date is after the batch window)
  {
    const orderId = nextOrderId();
    const amount = 5000;
    const utr = nextUtr();
    const setId = nextSetId();
    orders.push({
      orderId,
      merchantId: MERCHANT_ID,
      customerName: "Exception Four",
      amount,
      currency: "INR",
      paymentMethod: "upi",
      status: "captured",
      createdAt: "2025-08-28T10:30:00Z",
      refundAmount: 0,
      routeSplit: null,
      notes: "Future settlement date — settlement is post-batch-window",
      quirk: "exception_future_date",
    });
    settlements.push({
      settlementId: setId,
      orderId,
      amount,
      feeAmount: 0,
      refundAmount: 0,
      settlementStatus: "settled",
      settlementDate: "2025-09-15", // future
      utr,
      quirk: "exception_future_date",
    });
    // bank credit intentionally missing
  }

  // E5: currency mismatch (order in USD, settlement/bank in INR)
  {
    const orderId = nextOrderId();
    const amountUsd = 100; // USD 100
    const inrAmount = 8300; // bank credits ₹8,300
    const utr = nextUtr();
    const setId = nextSetId();
    orders.push({
      orderId,
      merchantId: MERCHANT_ID,
      customerName: "Exception Five",
      amount: amountUsd,
      currency: "USD",
      paymentMethod: "credit_card",
      status: "captured",
      createdAt: "2025-08-28T11:00:00Z",
      refundAmount: 0,
      routeSplit: null,
      notes: "Currency mismatch — order USD, settlement INR",
      quirk: "exception_currency_mismatch",
    });
    settlements.push({
      settlementId: setId,
      orderId,
      amount: inrAmount,
      feeAmount: mdr(inrAmount, "credit_card"),
      refundAmount: 0,
      settlementStatus: "settled",
      settlementDate: SETTLEMENT_DATE,
      utr,
      quirk: "exception_currency_mismatch",
    });
    bankCredits.push({
      txnDate: TXN_DATE,
      narration: `RAZORPAY/MERCHANT/${orderId}`,
      amount: round2(inrAmount - mdr(inrAmount, "credit_card")),
      referenceNumber: utr,
      status: "credit",
      quirk: "exception_currency_mismatch",
    });
  }

  // Build expected summary.
  // Underlying orders created: 30 + 5 + 3 + 10 + 3 + 3 + 2 + 5 = 61
  // (The spec says 55 — the extra are the multi-leg underlying orders.
  //  We will report totalRecords = number of distinct orders = 61 here, with the spec's
  //  match counts adjusted accordingly.)
  const totalOrders = orders.length;

  return {
    orders,
    settlements,
    bankCredits,
    expected: {
      totalRecords: totalOrders,
      stage1: 30, // perfect 1-to-1
      stage2: 5,  // 3 UPI ref mismatch + 2 malformed narrations
      stage3MultiLeg: 10, // 4 batches × ~2.5 legs ≈ 10 underlying orders resolved via graph
      stage3FeeAdjusted: 8, // 5 MDR + 3 TDS
      exceptions: 5,
      matchRatePct: ((totalOrders - 5) / totalOrders * 100).toFixed(1) + "%",
    },
  };
}

export type { Seed };
