"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  AlertTriangle,
  FileX,
  Copy,
  Clock,
  DollarSign,
  ScanSearch,
  ChevronDown,
  Download,
  Send,
  XCircle,
  CheckCircle2,
  HelpCircle,
  ScrollText,
  FileJson,
} from "lucide-react";
import type { ExceptionRecordVM, ExceptionCategory } from "./types";
import { EXCEPTION_META, formatINR } from "./format";

interface Props {
  exceptions: ExceptionRecordVM[];
}

const CATEGORY_ICON: Record<ExceptionCategory, React.ReactNode> = {
  NO_SETTLEMENT: <FileX className="w-4 h-4" />,
  DUPLICATE_BANK_CREDIT: <Copy className="w-4 h-4" />,
  UNEXPLAINABLE_GAP: <AlertTriangle className="w-4 h-4" />,
  FUTURE_DATE: <Clock className="w-4 h-4" />,
  CURRENCY_MISMATCH: <DollarSign className="w-4 h-4" />,
  EXTRACTION_FAILED: <ScanSearch className="w-4 h-4" />,
};

const CATEGORY_STYLE: Record<ExceptionCategory, { border: string; bg: string; text: string; glow: string }> = {
  NO_SETTLEMENT: { border: "border-amber-500/40", bg: "bg-amber-500/8", text: "text-amber-300", glow: "shadow-amber-500/10" },
  DUPLICATE_BANK_CREDIT: { border: "border-rose-500/40", bg: "bg-rose-500/8", text: "text-rose-300", glow: "shadow-rose-500/10" },
  UNEXPLAINABLE_GAP: { border: "border-red-500/40", bg: "bg-red-500/8", text: "text-red-300", glow: "shadow-red-500/10" },
  FUTURE_DATE: { border: "border-violet-500/40", bg: "bg-violet-500/8", text: "text-violet-300", glow: "shadow-violet-500/10" },
  CURRENCY_MISMATCH: { border: "border-cyan-500/40", bg: "bg-cyan-500/8", text: "text-cyan-300", glow: "shadow-cyan-500/10" },
  EXTRACTION_FAILED: { border: "border-orange-500/40", bg: "bg-orange-500/8", text: "text-orange-300", glow: "shadow-orange-500/10" },
};

export function ExceptionList({ exceptions }: Props) {
  const [expanded, setExpanded] = useState<string | null>(exceptions[0]?.id ?? null);

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
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/40 blur-md rounded-full" />
              <AlertTriangle className="relative w-6 h-6 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold">
              Honest exception list{" "}
              <span className="text-base font-normal text-muted-foreground font-mono">({exceptions.length})</span>
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            The agent honestly admits what it cannot resolve. Each exception comes with a full forensic dossier,
            dispute payload, and ledger status update.
          </p>
        </motion.div>

        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {exceptions.map((e, idx) => {
              const meta = EXCEPTION_META[e.category];
              const style = CATEGORY_STYLE[e.category];
              const isOpen = expanded === e.id;
              return (
                <motion.div
                  key={e.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className={`rounded-2xl border-2 ${style.border} ${style.bg} ${style.glow} shadow-lg overflow-hidden`}
                >
                  {/* Header (click to expand) */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : e.id)}
                    className="w-full text-left p-4 sm:p-5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${style.bg} ${style.text} flex items-center justify-center border ${style.border}`}>
                      {CATEGORY_ICON[e.category]}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-mono text-sm font-semibold ${style.text}`}>
                          {e.orderId ?? e.recordRef}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${style.border} ${style.text} font-medium uppercase tracking-wider`}>
                          {meta.label}
                        </span>
                        {e.ledgerStatus && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-300 border border-red-500/30 font-mono">
                            {e.ledgerStatus}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">{e.reason}</p>
                    </div>

                    {/* Amount summary */}
                    <div className="hidden sm:flex flex-col items-end gap-1 text-right">
                      {e.orderAmount !== null && (
                        <div className="text-[10px] text-muted-foreground">Order <span className="font-mono text-foreground">{formatINR(e.orderAmount)}</span></div>
                      )}
                      {e.bankAmount !== null && (
                        <div className="text-[10px] text-muted-foreground">Bank <span className="font-mono text-emerald-300">{formatINR(e.bankAmount)}</span></div>
                      )}
                      {e.gapAmount !== null && (
                        <div className={`text-[10px] font-mono font-semibold ${e.gapAmount > 0 ? "text-red-300" : "text-amber-300"}`}>
                          Gap {formatINR(e.gapAmount)}
                        </div>
                      )}
                    </div>

                    <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    </motion.div>
                  </button>

                  {/* Expanded forensic dossier */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-border/40"
                      >
                        <Dossier e={e} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {exceptions.length === 0 && (
            <div className="rounded-2xl border border-border bg-card/40 p-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="text-muted-foreground">No exceptions — every record was mathematically resolved.</p>
            </div>
          )}
        </div>

        {/* Export buttons */}
        {exceptions.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <ExportButton href="/api/export?format=json" icon={<FileJson className="w-3.5 h-3.5" />}>
              Export full report (JSON)
            </ExportButton>
            <ExportButton href="/api/export?format=csv" icon={<Download className="w-3.5 h-3.5" />}>
              Export exception CSV
            </ExportButton>
          </div>
        )}
      </div>
    </section>
  );
}

function ExportButton({ href, icon, children }: { href: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <a
      href={href}
      download
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/60 border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-background/80 hover:border-primary/40 transition-colors"
    >
      {icon}
      {children}
    </a>
  );
}

function Dossier({ e }: { e: ExceptionRecordVM }) {
  return (
    <div className="p-4 sm:p-5 space-y-4 bg-slate-950/30">
      {/* Summary grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {e.orderAmount !== null && <Stat label="Order Amount" value={formatINR(e.orderAmount)} accent="foreground" />}
        {e.bankAmount !== null && <Stat label="Bank Credit" value={formatINR(e.bankAmount)} accent="emerald" />}
        {e.gapAmount !== null && (
          <Stat
            label="Gap"
            value={formatINR(e.gapAmount)}
            accent={e.gapAmount > 0 ? "red" : "amber"}
          />
        )}
        <Stat label="Ledger" value={e.ledgerStatus} accent="red" mono />
      </div>

      {/* Hypotheses tested */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <ScrollText className="w-3.5 h-3.5 text-muted-foreground" />
          <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Hypotheses tested</h4>
        </div>
        <div className="space-y-1.5">
          {e.hypotheses.map((h, i) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-background/40 border border-border/60">
              <div className="flex-shrink-0 mt-0.5">
                {h.result === "REJECTED" ? (
                  <XCircle className="w-3.5 h-3.5 text-red-400" />
                ) : h.result === "ACCEPTED" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs">
                  <span className="font-medium">{h.hypothesis}</span>{" "}
                  <span className={`text-[10px] font-mono ${
                    h.result === "REJECTED" ? "text-red-400" : h.result === "ACCEPTED" ? "text-emerald-400" : "text-amber-400"
                  }`}>
                    → {h.result}
                  </span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{h.reason}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conclusion */}
      <div className="rounded-lg bg-red-500/5 border border-red-500/20 p-3">
        <div className="text-[10px] uppercase tracking-wider text-red-400 font-semibold mb-1">Conclusion</div>
        <p className="text-xs text-foreground/90 leading-relaxed">{e.conclusion}</p>
      </div>

      {/* Recommended action */}
      <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
        <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold mb-1">Recommended action</div>
        <p className="text-xs text-foreground/90 leading-relaxed">{e.recommendedAction}</p>
      </div>

      {/* Dispute payload */}
      {e.disputePayload && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Send className="w-3.5 h-3.5 text-muted-foreground" />
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Pre-drafted dispute payload</h4>
            </div>
            <button
              onClick={() => navigator.clipboard?.writeText(JSON.stringify(e.disputePayload, null, 2))}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Copy JSON
            </button>
          </div>
          <pre className="text-[10px] font-mono bg-slate-950/60 border border-border rounded-lg p-3 overflow-x-auto max-h-48">
{JSON.stringify(e.disputePayload, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent, mono }: { label: string; value: string; accent?: string; mono?: boolean }) {
  const accentMap: Record<string, string> = {
    emerald: "text-emerald-300",
    red: "text-red-300",
    amber: "text-amber-300",
    violet: "text-violet-300",
    cyan: "text-cyan-300",
    foreground: "text-foreground",
  };
  return (
    <div className="rounded-lg bg-background/40 border border-border/60 p-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <div className={`${mono ? "font-mono" : "font-semibold"} text-sm ${accent ? accentMap[accent] : ""}`}>
        {value}
      </div>
    </div>
  );
}
