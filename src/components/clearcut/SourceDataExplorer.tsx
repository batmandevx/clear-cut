"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  X,
  Search,
  Database,
  FileText,
  Landmark,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { DataPayload } from "./types";
import { formatINR, paymentMethodLabel } from "./format";

interface Props {
  open: boolean;
  onClose: () => void;
  data: DataPayload | null;
}

type Tab = "orders" | "settlements" | "bank";

const TABS: { id: Tab; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "orders", label: "Internal Orders", icon: <Database className="w-3.5 h-3.5" />, color: "emerald" },
  { id: "settlements", label: "Razorpay Settlements", icon: <FileText className="w-3.5 h-3.5" />, color: "violet" },
  { id: "bank", label: "Bank Statement", icon: <Landmark className="w-3.5 h-3.5" />, color: "cyan" },
];

const PAGE_SIZE = 8;

export function SourceDataExplorer({ open, onClose, data }: Props) {
  const [tab, setTab] = useState<Tab>("orders");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);

  // When tab or search changes, reset the page by clamping via setTab/setSearch handlers below.
  // (Avoid setState-in-effect: we reset page in the on-change callbacks.)

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // ESC key closes modal
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const rows = useMemo(() => {
    if (!data) return [];
    let source: Array<Record<string, unknown>> = [];
    if (tab === "orders") source = data.orders as unknown as Array<Record<string, unknown>>;
    else if (tab === "settlements") source = data.settlements as unknown as Array<Record<string, unknown>>;
    else source = data.bankCredits as unknown as Array<Record<string, unknown>>;

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      source = source.filter((r) =>
        Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(q)),
      );
    }
    return source;
  }, [data, tab, search]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  // Clamp page in case the row count shrank (e.g. user typed a filter)
  const safePage = Math.min(page, totalPages - 1);
  const pageData = rows.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const columns = useMemo(() => {
    if (pageData.length === 0) return [];
    return Object.keys(pageData[0]);
  }, [pageData]);

  const changeTab = (t: Tab) => {
    setTab(t);
    setPage(0);
  };
  const changeSearch = (v: string) => {
    setSearch(v);
    setPage(0);
  };

  const copyRow = (row: Record<string, unknown>) => {
    navigator.clipboard?.writeText(JSON.stringify(row, null, 2));
    const sig = JSON.stringify(row).slice(0, 24);
    setCopied(sig);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
        >
          {/* Backdrop */}
          <div
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            aria-hidden
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative w-full max-w-6xl max-h-[90vh] rounded-2xl border border-border bg-card/95 backdrop-blur-xl overflow-hidden flex flex-col holo-border"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 p-4 sm:p-5 border-b border-border bg-card/80">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 flex-shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold truncate">Source Data Explorer</h3>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    Inspect the raw synthetic dataset — {data?.counts.orders ?? 0} orders · {data?.counts.settlements ?? 0} settlements · {data?.counts.bankCredits ?? 0} bank credits
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-background/60 border border-border hover:bg-background hover:border-red-500/40 transition-colors group"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-muted-foreground group-hover:text-red-400 transition-colors" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 p-2 sm:p-3 border-b border-border bg-background/40 overflow-x-auto">
              {TABS.map((t) => {
                const count =
                  t.id === "orders" ? data?.counts.orders ?? 0
                  : t.id === "settlements" ? data?.counts.settlements ?? 0
                  : data?.counts.bankCredits ?? 0;
                const active = tab === t.id;
                const colorMap: Record<string, string> = {
                  emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
                  violet: "bg-violet-500/15 text-violet-300 border-violet-500/40",
                  cyan: "bg-cyan-500/15 text-cyan-300 border-cyan-500/40",
                };
                return (
                  <button
                    key={t.id}
                    onClick={() => changeTab(t.id)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all whitespace-nowrap ${
                      active ? colorMap[t.color] : "bg-background/40 text-muted-foreground border-border hover:bg-background/60"
                    }`}
                  >
                    {t.icon}
                    {t.label}
                    <span className="text-[10px] font-mono opacity-70">({count})</span>
                  </button>
                );
              })}

              {/* Search */}
              <div className="relative ml-auto min-w-[180px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => changeSearch(e.target.value)}
                  placeholder="Search rows…"
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-background/60 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>

            {/* Body: table */}
            <div className="flex-1 overflow-auto min-h-0">
              {pageData.length === 0 ? (
                <div className="p-12 text-center text-sm text-muted-foreground">
                  No rows match your search.
                </div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card/95 backdrop-blur-sm z-10">
                    <tr className="border-b border-border">
                      {columns.map((c) => (
                        <th key={c} className="text-left px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                          {c}
                        </th>
                      ))}
                      <th className="px-3 py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageData.map((row, i) => {
                      const sig = JSON.stringify(row).slice(0, 24);
                      return (
                        <motion.tr
                          key={i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.02 }}
                          className="border-b border-border/40 hover:bg-emerald-500/5 transition-colors group"
                        >
                          {columns.map((c) => (
                            <td key={c} className="px-3 py-2 align-top">
                              <CellRenderer value={row[c]} field={c} />
                            </td>
                          ))}
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={() => copyRow(row)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center justify-center w-6 h-6 rounded bg-background/60 border border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                              aria-label="Copy row"
                            >
                              {copied === sig ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer: pagination */}
            <div className="flex items-center justify-between gap-3 p-3 border-t border-border bg-background/40">
              <div className="text-[11px] text-muted-foreground font-mono">
                Showing {pageData.length === 0 ? 0 : safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, rows.length)} of {rows.length}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(Math.max(0, safePage - 1))}
                  disabled={safePage === 0}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs border border-border disabled:opacity-40 hover:bg-background/60 transition-colors"
                >
                  <ChevronLeft className="w-3 h-3" /> Prev
                </button>
                <span className="text-[11px] font-mono text-muted-foreground px-2">
                  {safePage + 1} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))}
                  disabled={safePage >= totalPages - 1}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs border border-border disabled:opacity-40 hover:bg-background/60 transition-colors"
                >
                  Next <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CellRenderer({ value, field }: { value: unknown; field: string }) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground/40 italic">null</span>;
  }
  if (typeof value === "number") {
    // Amount fields get INR formatting
    if (field === "amount" || field === "feeAmount" || field === "refundAmount" || field === "orderAmount") {
      return <span className="font-mono text-emerald-300">{formatINR(value)}</span>;
    }
    return <span className="font-mono">{value}</span>;
  }
  if (typeof value === "string") {
    // Long narrations get truncated
    if (field === "narration" && value.length > 50) {
      return (
        <div className="max-w-xs">
          <span className="font-mono text-foreground/90">{value.slice(0, 50)}…</span>
          <span className="block text-[10px] text-muted-foreground">{value.length} chars</span>
        </div>
      );
    }
    // Order/settlement IDs get highlighted
    if (field === "orderId" || field === "settlementId" || field === "utr" || field === "referenceNumber") {
      return <span className="font-mono text-cyan-300">{value}</span>;
    }
    if (field === "paymentMethod") {
      return (
        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono bg-violet-500/10 border border-violet-500/30 text-violet-300">
          {paymentMethodLabel(value)}
        </span>
      );
    }
    if (field === "currency") {
      return (
        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono border ${
          value === "INR" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-amber-500/10 border-amber-500/30 text-amber-300"
        }`}>
          {value}
        </span>
      );
    }
    if (field === "status") {
      return (
        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-mono border ${
          value === "captured" || value === "settled" || value === "credit"
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            : "bg-muted/10 border-border text-muted-foreground"
        }`}>
          {value}
        </span>
      );
    }
    if (field === "createdAt" || field === "settlementDate" || field === "txnDate") {
      return <span className="font-mono text-muted-foreground text-[10px]">{value.slice(0, 10)}</span>;
    }
    return <span className="text-foreground/90">{value}</span>;
  }
  if (typeof value === "object") {
    return <span className="font-mono text-muted-foreground text-[10px]">{JSON.stringify(value)}</span>;
  }
  return <span>{String(value)}</span>;
}
