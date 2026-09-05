// ClearCut — Domain types (shared between engine, API, and frontend)

export type PaymentMethod = "upi" | "netbanking" | "credit_card" | "debit_card" | "wallet";

export interface InternalOrder {
  orderId: string;
  merchantId: string;
  customerName: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: string;
  createdAt: string; // ISO
  refundAmount: number;
  routeSplit?: { platformFee: number; vendorAmount: number } | null;
  notes: string;
  quirk?: string; // synthetic tag
}

export interface RazorpaySettlement {
  settlementId: string;
  orderId: string;
  amount: number;
  feeAmount: number;
  refundAmount: number;
  settlementStatus: string;
  settlementDate: string; // ISO date
  utr: string;
  quirk?: string;
}

export interface BankCredit {
  txnDate: string; // ISO date
  narration: string;
  amount: number;
  referenceNumber?: string | null;
  status: string;
  quirk?: string;
}

export type MatchType =
  | "DETERMINISTIC_1_TO_1"
  | "AI_SEMANTIC"
  | "FEE_ADJUSTED"
  | "MULTI_LEG";

export type Confidence = "high" | "medium" | "low";

export interface LLMExtraction {
  order_id: string | null;
  merchant_name: string | null;
  reference_number: string | null;
  settlement_batch: string | null;
  confidence: Confidence;
  raw?: string;
}

export interface FeeBreakdown {
  mdr: number;
  tds: number;
  refund: number;
}

export interface MatchedRecord {
  orderId: string;
  settlementId: string | null;
  bankRef: string | null;
  orderAmount: number;
  bankAmount: number;
  matchType: MatchType;
  confidence: number;
  stage: 1 | 2 | 3;
  feeBreakdown?: FeeBreakdown | null;
  legs?: string[]; // for multi-leg
  extraction?: LLMExtraction | null;
}

export type ExceptionCategory =
  | "NO_SETTLEMENT"
  | "DUPLICATE_BANK_CREDIT"
  | "UNEXPLAINABLE_GAP"
  | "FUTURE_DATE"
  | "CURRENCY_MISMATCH"
  | "EXTRACTION_FAILED";

export interface HypothesisResult {
  hypothesis: string;
  result: "REJECTED" | "ACCEPTED" | "INCONCLUSIVE";
  reason: string;
}

export interface ExceptionRecord {
  orderId: string | null;
  recordRef: string;
  orderAmount: number | null;
  bankAmount: number | null;
  gapAmount: number | null;
  reason: string;
  category: ExceptionCategory;
  hypotheses: HypothesisResult[];
  conclusion: string;
  recommendedAction: string;
  disputePayload?: Record<string, unknown> | null;
  ledgerStatus: string;
}

export interface AuditEntry {
  seq: number;
  timestamp: string;
  event: string;
  stage?: string;
  data?: Record<string, unknown>;
}

export interface StageMetrics {
  matched: number;
  unmatchedOrders: number;
  unmatchedBank: number;
}

export interface PipelineMetrics {
  totalRecords: number;
  matched: number;
  exceptions: number;
  stage1: number;
  stage2: number;
  stage3: number;
  stage4: number;
  matchRatePct: number;
  durationMs: number;
}

export interface ReconReport {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  matchedRecords: MatchedRecord[];
  exceptions: ExceptionRecord[];
  auditTrail: AuditEntry[];
  metrics: PipelineMetrics;
}

export const FEE_MATRIX: Record<PaymentMethod, number> = {
  upi: 0.0,
  netbanking: 0.01,
  credit_card: 0.02,
  debit_card: 0.015,
  wallet: 0.02,
};

export const TDS_RATE = 0.01;
export const TOLERANCE_INR = 0.01;
