// Presentation helpers for ClearCut dashboard.

import type { ExceptionCategory, MatchedRecordVM } from "./types";

export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}₹${formatted}`;
}

export function formatINRShort(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "—";
  const sign = amount < 0 ? "-" : "";
  const abs = Math.abs(amount);
  if (abs >= 1_00_00_000) return `${sign}₹${(abs / 1_00_00_000).toFixed(2)}Cr`;
  if (abs >= 1_00_000) return `${sign}₹${(abs / 1_00_000).toFixed(2)}L`;
  if (abs >= 1_000) return `${sign}₹${(abs / 1_000).toFixed(1)}k`;
  return `${sign}₹${abs.toFixed(0)}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(2)}s`;
  const m = Math.floor(s / 60);
  const rem = Math.round(s % 60);
  return `${m}m ${rem}s`;
}

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function formatRelative(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString("en-IN");
}

export interface StageMeta {
  id: number;
  name: string;
  short: string;
  description: string;
  color: string;
  badge: string;
  icon: string;
  aiLayer: boolean;
}

export const STAGES: StageMeta[] = [
  {
    id: 0,
    name: "Pre-flight Exception Detection",
    short: "Stage 0",
    description: "Detects no-settlement, duplicate bank credits, future-dated settlements, and currency mismatches before the main pipeline runs.",
    color: "amber",
    badge: "STAGE 0",
    icon: "shield",
    aiLayer: false,
  },
  {
    id: 1,
    name: "Deterministic Hard Match",
    short: "Stage 1",
    description: "Pure TypeScript. Exact order_id + exact amount + exact UTR. Zero hallucination risk — that's why we chose not to use AI here.",
    color: "emerald",
    badge: "STAGE 1",
    icon: "lock",
    aiLayer: false,
  },
  {
    id: 2,
    name: "AI Semantic Normalizer",
    short: "Stage 2",
    description: "LLM extracts structured fields from messy bank narrations. Strict prompt: no arithmetic, no guessing. Confidence-gated routing.",
    color: "violet",
    badge: "STAGE 2",
    icon: "sparkles",
    aiLayer: true,
  },
  {
    id: 3,
    name: "Multi-Leg Graph Resolver",
    short: "Stage 3",
    description: "LLM generates JavaScript findMatch() code. Deterministic sandbox verifies the math balances to exactly ₹0.00. The LLM is a code generator, never a calculator.",
    color: "cyan",
    badge: "STAGE 3",
    icon: "git-branch",
    aiLayer: true,
  },
  {
    id: 4,
    name: "Honest Exception Orchestrator",
    short: "Stage 4",
    description: "For everything unresolved: builds a forensic dossier, generates dispute payloads, marks ledger ESCALATED. The agent honestly admits what it cannot resolve.",
    color: "red",
    badge: "STAGE 4",
    icon: "alert-triangle",
    aiLayer: false,
  },
];

export function getStageMeta(stage: number): StageMeta {
  return STAGES.find((s) => s.id === stage) ?? STAGES[1];
}

export function matchTypeLabel(t: string): string {
  switch (t) {
    case "DETERMINISTIC_1_TO_1": return "1-to-1 Deterministic";
    case "AI_SEMANTIC": return "AI Semantic";
    case "MULTI_LEG": return "Multi-Leg Graph";
    case "FEE_ADJUSTED": return "Fee-Adjusted";
    default: return t;
  }
}

export function matchTypeColor(t: string): string {
  switch (t) {
    case "DETERMINISTIC_1_TO_1": return "emerald";
    case "AI_SEMANTIC": return "violet";
    case "MULTI_LEG": return "cyan";
    case "FEE_ADJUSTED": return "amber";
    default: return "muted";
  }
}

export const EXCEPTION_META: Record<ExceptionCategory, { label: string; color: string; icon: string }> = {
  NO_SETTLEMENT: { label: "No Settlement", color: "amber", icon: "file-x" },
  DUPLICATE_BANK_CREDIT: { label: "Duplicate Bank Credit", color: "rose", icon: "copy" },
  UNEXPLAINABLE_GAP: { label: "Unexplainable Gap", color: "red", icon: "alert-triangle" },
  FUTURE_DATE: { label: "Future Settlement Date", color: "violet", icon: "clock" },
  CURRENCY_MISMATCH: { label: "Currency Mismatch", color: "cyan", icon: "dollar-sign" },
  EXTRACTION_FAILED: { label: "Extraction Failed", color: "orange", icon: "scan-search" },
};

// Quirk metadata — used to tag the synthetic data records with their purpose.
export const QUIRK_META: Record<string, { label: string; description: string; color: string }> = {
  perfect_1_to_1: { label: "Perfect 1-to-1", description: "Order ID, amount, and UTR all match exactly. Resolved by Stage 1.", color: "emerald" },
  mdr_deduction: { label: "MDR Fee Deduction", description: "Bank credit = order amount − 2% MDR (credit card). Resolved by Stage 3 fee adjustment.", color: "amber" },
  tds_deduction: { label: "TDS Deduction", description: "Bank credit = order amount − 1% TDS. Resolved by Stage 3 fee adjustment.", color: "orange" },
  partial_refund: { label: "Partial Refund", description: "Bank credit = order − refund − MDR. Resolved by Stage 3 multi-leg with refund.", color: "rose" },
  upi_ref_mismatch: { label: "UPI Ref Mismatch", description: "Bank uses different UPI reference format. Resolved by Stage 2 AI extraction from narration.", color: "violet" },
  malformed_narration: { label: "Malformed Narration", description: "Garbled delimiters around order ID. Resolved by Stage 2 LLM extraction (medium confidence).", color: "cyan" },
  exception_no_settlement: { label: "No Settlement", description: "Order captured but never settled. Honest exception.", color: "red" },
  exception_duplicate_bank_credit: { label: "Duplicate Credit", description: "Two bank credits with same UTR. Honest exception.", color: "red" },
  exception_unexplainable_gap: { label: "Unexplainable Gap", description: "Order ₹10k, bank ₹4k, no refund record. Honest exception.", color: "red" },
  exception_future_date: { label: "Future Date", description: "Settlement date is after batch window. Honest exception.", color: "red" },
  exception_currency_mismatch: { label: "Currency Mismatch", description: "Order USD, settlement INR. Honest exception.", color: "red" },
};

export function paymentMethodColor(method: string): string {
  switch (method) {
    case "upi": return "violet";
    case "credit_card": return "amber";
    case "debit_card": return "orange";
    case "netbanking": return "cyan";
    case "wallet": return "rose";
    default: return "muted";
  }
}

export function paymentMethodLabel(method: string): string {
  switch (method) {
    case "upi": return "UPI";
    case "credit_card": return "Credit Card";
    case "debit_card": return "Debit Card";
    case "netbanking": return "Net Banking";
    case "wallet": return "Wallet";
    default: return method;
  }
}

export function confidenceColor(c: number): string {
  if (c >= 0.95) return "emerald";
  if (c >= 0.85) return "cyan";
  if (c >= 0.7) return "amber";
  return "rose";
}

export function confidenceLabel(c: number): string {
  if (c >= 0.95) return "Very High";
  if (c >= 0.85) return "High";
  if (c >= 0.7) return "Medium";
  return "Low";
}

export function legCount(m: MatchedRecordVM): number {
  return m.legs?.length ?? 1;
}
