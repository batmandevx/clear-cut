"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Lock,
  Sparkles,
  GitBranch,
  Coins,
  ChevronDown,
} from "lucide-react";
import type { MatchedRecordVM } from "./types";
import {
  formatINR,
  matchTypeLabel,
  confidenceLabel,
} from "./format";

function confidenceTextClass(c: number): string {
  if (c >= 0.95) return "text-emerald-300";
  if (c >= 0.85) return "text-cyan-300";
  if (c >= 0.7) return "text-amber-300";
  return "text-rose-300";
}

interface Props {
  matches: MatchedRecordVM[];
}

type SortKey = "orderId" | "orderAmount" | "bankAmount" | "confidence" | "stage";
type SortDir = "asc" | "desc";

const STAGE_FILTERS = [
  { id: 0, label: "All", color: "slate" },
  { id: 1, label: "Stage 1", color: "emerald" },
  { id: 2, label: "Stage 2", color: "violet" },
  { id: 3, label: "Stage 3", color: "cyan" },
] as const;

const MATCH_TYPE_FILTERS = [
  { id: "all", label: "All types" },
  { id: "DETERMINISTIC_1_TO_1", label: "1-to-1" },
  { id: "AI_SEMANTIC", label: "AI Semantic" },
  { id: "MULTI_LEG", label: "Multi-Leg" },
  { id: "FEE_ADJUSTED", label: "Fee-Adjusted" },
] as const;

export function MatchedRecordsTable({ matches }: Props) {
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<number>(0);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("stage");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 12;

  const filtered = useMemo(() => {
    let r = matches;
    if (search) {
      const q = search.toLowerCase();
      r = r.filter(
        (m) =>
          m.orderId.toLowerCase().includes(q) ||
          (m.bankRef ?? "").toLowerCase().includes(q) ||
          (m.settlementId ?? "").toLowerCase().includes(q),
      );
    }
    if (stageFilter > 0) r = r.filter((m) => m.stage === stageFilter);
    if (typeFilter !== "all") r = r.filter((m) => m.matchType === typeFilter);
    r = [...r].sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      switch (sortKey) {
        case "orderId": av = a.orderId; bv = b.orderId; break;
        case "orderAmount": av = a.orderAmount; bv = b.orderAmount; break;
        case "bankAmount": av = a.bankAmount; bv = b.bankAmount; break;
        case "confidence": av = a.confidence; bv = b.confidence; break;
        case "stage": av = a.stage * 1000 + a.confidence; bv = b.stage * 1000 + b.confidence; break;
      }
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return r;
  }, [matches, search, stageFilter, typeFilter, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const pageData = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const stageColorMap: Record<number, string> = {
    1: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    2: "bg-violet-500/15 text-violet-300 border-violet-500/30",
    3: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  };

  const matchTypeIcon: Record<string, React.ReactNode> = {
    DETERMINISTIC_1_TO_1: <Lock className="w-3 h-3" />,
    AI_SEMANTIC: <Sparkles className="w-3 h-3" />,
    MULTI_LEG: <GitBranch className="w-3 h-3" />,
    FEE_ADJUSTED: <Coins className="w-3 h-3" />,
  };

  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-6 flex flex-wrap items-end justify-between gap-3"
        >
          <div>
            <h2 className="text-2xl font-bold mb-1">
              Matched records{" "}
              <span className="text-base font-normal text-muted-foreground font-mono">({filtered.length})</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              Every match is mathematically verified. Click any row to see the full extraction & fee breakdown.
            </p>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-4 mb-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                placeholder="Search by order ID, UTR, or settlement ID…"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-background/60 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {STAGE_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => { setStageFilter(f.id); setPage(0); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    stageFilter === f.id
                      ? "bg-primary/15 text-primary border-primary/40"
                      : "bg-background/40 text-muted-foreground border-border hover:bg-background/60"
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-background/40 border border-border text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {MATCH_TYPE_FILTERS.map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border">
                <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  <Th label="Order ID" sortKey="orderId" current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <Th label="Order Amount" sortKey="orderAmount" current={sortKey} dir={sortDir} onSort={toggleSort} align="right" />
                  <Th label="Bank Credit" sortKey="bankAmount" current={sortKey} dir={sortDir} onSort={toggleSort} align="right" />
                  <Th label="Confidence" sortKey="confidence" current={sortKey} dir={sortDir} onSort={toggleSort} align="right" />
                  <Th label="Stage" sortKey="stage" current={sortKey} dir={sortDir} onSort={toggleSort} align="center" />
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {pageData.map((m) => (
                    <motion.tr
                      key={m.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b border-border/40 hover:bg-emerald-500/5 transition-colors cursor-pointer"
                      onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                    >
                      <td className="px-3 py-2.5">
                        <div className="font-mono text-xs font-medium text-emerald-300">{m.orderId}</div>
                        {m.bankRef && (
                          <div className="font-mono text-[10px] text-muted-foreground">{m.bankRef}</div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs">{formatINR(m.orderAmount)}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs text-emerald-300">{formatINR(m.bankAmount)}</td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="inline-flex flex-col items-end">
                          <span className={`font-mono text-xs font-semibold ${confidenceTextClass(m.confidence)}`}>
                            {(m.confidence * 100).toFixed(0)}%
                          </span>
                          <span className="text-[10px] text-muted-foreground">{confidenceLabel(m.confidence)}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${stageColorMap[m.stage] ?? "bg-muted/15 text-muted-foreground border-border"}`}>
                          {matchTypeIcon[m.matchType]}
                          S{m.stage}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <motion.div animate={{ rotate: expanded === m.id ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </motion.div>
                      </td>
                      {expanded === m.id && (
                        <td colSpan={6} className="px-3 pb-3">
                          <ExpandedRow m={m} />
                        </td>
                      )}
                    </motion.tr>
                  ))}
                </AnimatePresence>
                {pageData.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground text-sm">
                      No matches found with current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-2 p-3 border-t border-border">
              <div className="text-xs text-muted-foreground">
                Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-2 py-1 rounded text-xs border border-border disabled:opacity-40 hover:bg-background/60"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }).slice(0, 5).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`px-2 py-1 rounded text-xs border ${
                      page === i ? "bg-primary/15 border-primary/40 text-primary" : "border-border hover:bg-background/60"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-2 py-1 rounded text-xs border border-border disabled:opacity-40 hover:bg-background/60"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Th({
  label,
  sortKey,
  current,
  dir,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (k: SortKey) => void;
  align?: "left" | "right" | "center";
}) {
  const active = current === sortKey;
  return (
    <th className={`px-3 py-2 font-medium ${align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"}`}>
      <button
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 hover:text-foreground ${active ? "text-foreground" : ""}`}
      >
        {label}
        {active ? (
          dir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-40" />
        )}
      </button>
    </th>
  );
}

function ExpandedRow({ m }: { m: MatchedRecordVM }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-2 rounded-xl bg-slate-950/40 border border-border/60 p-4"
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Detail label="Match Type" value={matchTypeLabel(m.matchType)} />
        <Detail label="Confidence" value={`${(m.confidence * 100).toFixed(1)}% (${confidenceLabel(m.confidence)})`} />
        <Detail label="Settlement ID" value={m.settlementId ?? "—"} mono />
        <Detail label="Bank Reference" value={m.bankRef ?? "—"} mono />

        {m.feeBreakdown && (
          <>
            <Detail label="MDR Fee" value={formatINR(m.feeBreakdown.mdr)} mono accent="amber" />
            <Detail label="TDS" value={formatINR(m.feeBreakdown.tds)} mono accent="orange" />
            <Detail label="Refund" value={formatINR(m.feeBreakdown.refund)} mono accent="rose" />
            <Detail
              label="Net Settlement"
              value={formatINR(m.orderAmount - m.feeBreakdown.mdr - m.feeBreakdown.tds - m.feeBreakdown.refund)}
              mono
              accent="emerald"
            />
          </>
        )}

        {m.legs && m.legs.length > 1 && (
          <div className="col-span-2 md:col-span-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Multi-leg orders</div>
            <div className="flex flex-wrap gap-1">
              {m.legs.map((leg) => (
                <span key={leg} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                  {leg}
                </span>
              ))}
            </div>
          </div>
        )}

        {m.extraction && (
          <div className="col-span-2 md:col-span-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">LLM extraction</div>
            <div className="font-mono text-[10px] bg-background/60 rounded p-2 border border-border/60">
              <div>order_id: <span className="text-emerald-300">{m.extraction.order_id ?? "null"}</span></div>
              <div>confidence: <span className="text-violet-300">{m.extraction.confidence}</span></div>
              {m.extraction.raw && <div className="text-muted-foreground mt-1">{"// "}{m.extraction.raw.slice(0, 80)}</div>}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function Detail({
  label,
  value,
  mono,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: string;
}) {
  const accentColor: Record<string, string> = {
    emerald: "text-emerald-300",
    amber: "text-amber-300",
    orange: "text-orange-300",
    rose: "text-rose-300",
  };
  const colorClass = accent ? accentColor[accent] ?? "" : "text-foreground";
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{label}</div>
      <div className={`${mono ? "font-mono" : ""} text-sm ${colorClass}`}>{value}</div>
    </div>
  );
}
