"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { Activity, Search, Filter } from "lucide-react";
import type { AuditEntryVM } from "./types";
import { formatTimestamp } from "./format";

interface Props {
  audit: AuditEntryVM[];
}

const STAGE_COLOR: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  stage0: { bg: "bg-amber-500/10", text: "text-amber-300", dot: "bg-amber-400", border: "border-amber-500/30" },
  stage1: { bg: "bg-emerald-500/10", text: "text-emerald-300", dot: "bg-emerald-400", border: "border-emerald-500/30" },
  stage2: { bg: "bg-violet-500/10", text: "text-violet-300", dot: "bg-violet-400", border: "border-violet-500/30" },
  stage3: { bg: "bg-cyan-500/10", text: "text-cyan-300", dot: "bg-cyan-400", border: "border-cyan-500/30" },
  stage4: { bg: "bg-red-500/10", text: "text-red-300", dot: "bg-red-400", border: "border-red-500/30" },
};

const EVENT_LABEL: Record<string, string> = {
  PIPELINE_STARTED: "Pipeline started",
  PIPELINE_COMPLETE: "Pipeline complete",
  STAGE_STARTED: "Stage started",
  STAGE_COMPLETE: "Stage complete",
  MATCH_FOUND: "Match found",
  EXCEPTION_FLAGGED: "Exception flagged",
  MULTI_LEG_RESOLVED: "Multi-leg resolved",
};

export function AuditTrail({ audit }: Props) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    let r = audit;
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(
        (a) =>
          a.event.toLowerCase().includes(q) ||
          (a.stage ?? "").toLowerCase().includes(q) ||
          JSON.stringify(a.data ?? {}).toLowerCase().includes(q),
      );
    }
    if (stageFilter !== "all") {
      r = r.filter((a) => (a.stage ?? "none") === stageFilter);
    }
    return r;
  }, [audit, search, stageFilter]);

  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold">
              Audit trail{" "}
              <span className="text-base font-normal text-muted-foreground font-mono">({filtered.length})</span>
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Every decision the pipeline makes is recorded in an append-only audit log.
            This is what finance ops and regulators want to see.
          </p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit events…"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-background/60 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            {["all", "stage0", "stage1", "stage2", "stage3", "stage4"].map((s) => (
              <button
                key={s}
                onClick={() => setStageFilter(s)}
                className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                  stageFilter === s
                    ? "bg-primary/15 text-primary border-primary/40"
                    : "bg-background/40 text-muted-foreground border-border hover:bg-background/60"
                }`}
              >
                {s === "all" ? "All" : `S${s.slice(-1)}`}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            <div className="relative p-4">
              {/* Vertical timeline line */}
              <div className="absolute left-[34px] top-4 bottom-4 w-px bg-border" />

              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {filtered.map((a, i) => {
                    const stage = (a.stage ?? "none") as string;
                    const color = STAGE_COLOR[stage];
                    const label = EVENT_LABEL[a.event] ?? a.event;
                    return (
                      <motion.div
                        key={a.seq}
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.3, delay: Math.min(i * 0.02, 0.4) }}
                        className="relative flex items-start gap-3 group"
                      >
                        {/* Timeline dot */}
                        <div className={`relative z-10 flex-shrink-0 w-9 h-9 rounded-full ${color?.bg ?? "bg-muted/10"} border ${color?.border ?? "border-border"} flex items-center justify-center`}>
                          <div className={`w-2 h-2 rounded-full ${color?.dot ?? "bg-muted-foreground"}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pb-2">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-mono text-muted-foreground tabular-nums">
                              #{a.seq}
                            </span>
                            <span className={`text-xs font-semibold ${color?.text ?? "text-foreground"}`}>
                              {label}
                            </span>
                            {a.stage && (
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${color?.bg ?? "bg-muted/10"} ${color?.text ?? "text-muted-foreground"} border ${color?.border ?? "border-border"}`}>
                                {a.stage}
                              </span>
                            )}
                            <span className="text-[10px] font-mono text-muted-foreground ml-auto">
                              {formatTimestamp(a.timestamp)}
                            </span>
                          </div>
                          {a.data && Object.keys(a.data).length > 0 && (
                            <div className="font-mono text-[10px] text-muted-foreground/80 break-words">
                              {Object.entries(a.data).slice(0, 3).map(([k, v]) => (
                                <span key={k} className="mr-2">
                                  <span className="text-muted-foreground/60">{k}:</span>{" "}
                                  <span className="text-foreground/70">{formatVal(v)}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                {filtered.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    No audit entries match your filter.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function formatVal(v: unknown): string {
  if (typeof v === "string") return `"${v}"`;
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return `[${v.length} items]`;
  if (v && typeof v === "object") return `{${Object.keys(v).length} keys}`;
  return String(v);
}
