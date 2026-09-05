// Frontend view models — derived from the API responses.
// Separated from the recon domain types to allow presentation-friendly shapes.

export type Stage = 0 | 1 | 2 | 3 | 4;

export interface MatchedRecordVM {
  id: string;
  orderId: string;
  settlementId: string | null;
  bankRef: string | null;
  orderAmount: number;
  bankAmount: number;
  matchType: string;
  confidence: number;
  stage: number;
  feeBreakdown?: { mdr: number; tds: number; refund: number } | null;
  legs?: string[] | null;
  extraction?: {
    order_id: string | null;
    confidence: "high" | "medium" | "low";
    raw?: string;
  } | null;
}

export type ExceptionCategory =
  | "NO_SETTLEMENT"
  | "DUPLICATE_BANK_CREDIT"
  | "UNEXPLAINABLE_GAP"
  | "FUTURE_DATE"
  | "CURRENCY_MISMATCH"
  | "EXTRACTION_FAILED";

export interface HypothesisVM {
  hypothesis: string;
  result: "REJECTED" | "ACCEPTED" | "INCONCLUSIVE";
  reason: string;
}

export interface ExceptionRecordVM {
  id: string;
  orderId: string | null;
  recordRef: string;
  orderAmount: number | null;
  bankAmount: number | null;
  gapAmount: number | null;
  reason: string;
  category: ExceptionCategory;
  hypotheses: HypothesisVM[];
  conclusion: string;
  recommendedAction: string;
  disputePayload?: Record<string, unknown> | null;
  ledgerStatus: string;
}

export interface AuditEntryVM {
  seq: number;
  timestamp: string;
  event: string;
  stage?: string | null;
  data?: Record<string, unknown>;
}

export interface PipelineMetricsVM {
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

export interface RunVM {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  status: string;
  durationMs: number;
  totalRecords: number;
  matchedCount: number;
  exceptionCount: number;
  stage1: number;
  stage2: number;
  stage3: number;
  stage4: number;
}

export interface ResultsPayload {
  run: RunVM | null;
  matches: MatchedRecordVM[];
  exceptions: ExceptionRecordVM[];
  audit: AuditEntryVM[];
}

export interface DataPayload {
  orders: Array<{
    orderId: string;
    merchantId: string;
    customerName: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    status: string;
    createdAt: string;
    refundAmount: number;
    routeSplit: { platformFee: number; vendorAmount: number } | null;
    notes: string;
  }>;
  settlements: Array<{
    settlementId: string;
    orderId: string;
    amount: number;
    feeAmount: number;
    refundAmount: number;
    settlementStatus: string;
    settlementDate: string;
    utr: string;
  }>;
  bankCredits: Array<{
    txnDate: string;
    narration: string;
    amount: number;
    referenceNumber: string | null;
    status: string;
  }>;
  lastRunId: string | null;
  counts: { orders: number; settlements: number; bankCredits: number };
}

export interface ProgressEvent {
  stage: 1 | 2 | 3 | 4;
  phase: "start" | "complete";
  message: string;
  matched?: number;
  unmatched?: number;
}

export interface RunResponse {
  runId: string;
  report: {
    startedAt: string;
    finishedAt: string;
    durationMs: number;
    matchedRecords: MatchedRecordVM[];
    exceptions: ExceptionRecordVM[];
    auditTrail: AuditEntryVM[];
    metrics: PipelineMetricsVM;
  };
  progressLog: ProgressEvent[];
}
