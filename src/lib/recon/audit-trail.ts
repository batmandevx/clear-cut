// ClearCut — Audit trail (append-only log)

import type { AuditEntry } from "./types";

export class AuditTrail {
  private entries: AuditEntry[] = [];
  private seq = 0;

  log(event: string, data?: Record<string, unknown>, stage?: string): void {
    this.seq += 1;
    this.entries.push({
      seq: this.seq,
      timestamp: new Date().toISOString(),
      event,
      stage,
      data,
    });
  }

  logMatch(recordId: string, matchType: string, confidence: number, stage?: string): void {
    this.log("MATCH_FOUND", { record_id: recordId, match_type: matchType, confidence }, stage);
  }

  logException(recordId: string, reason: string, category: string): void {
    this.log("EXCEPTION_FLAGGED", { record_id: recordId, reason, category }, "stage4");
  }

  logStageStart(stage: string, count: number): void {
    this.log("STAGE_STARTED", { stage, input_count: count }, stage);
  }

  logStageComplete(stage: string, matched: number, unmatched: number): void {
    this.log("STAGE_COMPLETE", { stage, matched, unmatched }, stage);
  }

  all(): AuditEntry[] {
    return [...this.entries];
  }

  get currentId(): number {
    return this.seq;
  }
}
