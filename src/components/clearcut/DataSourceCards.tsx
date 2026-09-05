"use client";

import { motion } from "framer-motion";
import { FileJson, FileText, Landmark, Database, Copy, ShieldCheck } from "lucide-react";
import type { DataPayload } from "./types";
import { formatINR, paymentMethodColor, paymentMethodLabel } from "./format";

interface Props {
  data: DataPayload | null;
  isLoading: boolean;
}

export function DataSourceCards({ data, isLoading }: Props) {
  if (isLoading || !data) {
    return (
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-44 rounded-2xl glass animate-shimmer" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const totalOrdersValue = data.orders.reduce((sum, o) => sum + o.amount, 0);
  const totalSettlementsValue = data.settlements.reduce((sum, s) => sum + s.amount, 0);
  const totalBankValue = data.bankCredits.reduce((sum, b) => sum + b.amount, 0);

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
          <h2 className="text-2xl font-bold mb-1">Three messy inputs</h2>
          <p className="text-sm text-muted-foreground">
            Real-world finance data is never clean. Each source has its own schema, narrations, and quirks.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SourceCard
            title="Internal Orders"
            subtitle="merchant's order DB"
            icon={<FileJson className="w-5 h-5" />}
            color="emerald"
            count={data.counts.orders}
            totalValue={totalOrdersValue}
            sample={data.orders.slice(0, 3).map((o) => ({
              id: o.orderId,
              primary: o.customerName,
              secondary: paymentMethodLabel(o.paymentMethod),
              amount: o.amount,
              method: o.paymentMethod,
            }))}
          />

          <SourceCard
            title="Razorpay Settlements"
            subtitle="settlement report CSV"
            icon={<FileText className="w-5 h-5" />}
            color="violet"
            count={data.counts.settlements}
            totalValue={totalSettlementsValue}
            sample={data.settlements.slice(0, 3).map((s) => ({
              id: s.settlementId,
              primary: s.orderId,
              secondary: s.utr,
              amount: s.amount,
              method: "settlement",
            }))}
          />

          <SourceCard
            title="Bank Statement"
            subtitle="messy narrations + UTRs"
            icon={<Landmark className="w-5 h-5" />}
            color="cyan"
            count={data.counts.bankCredits}
            totalValue={totalBankValue}
            sample={data.bankCredits.slice(0, 3).map((b) => ({
              id: b.referenceNumber ?? b.narration.slice(0, 16),
              primary: b.narration.slice(0, 38) + (b.narration.length > 38 ? "…" : ""),
              secondary: b.referenceNumber ?? "no UTR",
              amount: b.amount,
              method: "bank",
            }))}
          />
        </div>

        {/* Value reconciliation summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-4 rounded-xl glass p-4 flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2 text-sm">
            <Database className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Loaded into reconciliation pool:</span>
          </div>
          <div className="flex flex-wrap gap-4 sm:gap-6 font-mono text-xs">
            <ValueDiff label="Orders gross" value={totalOrdersValue} compare={totalBankValue} />
            <ValueDiff label="Settlements gross" value={totalSettlementsValue} compare={totalOrdersValue} />
            <ValueDiff label="Bank credits" value={totalBankValue} compare={totalOrdersValue} />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function ValueDiff({ label, value, compare }: { label: string; value: number; compare: number }) {
  const diff = value - compare;
  const pct = compare > 0 ? (diff / compare) * 100 : 0;
  const isMatch = Math.abs(diff) < 0.01;
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{formatINR(value)}</span>
      {!isMatch && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${diff > 0 ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}>
          {diff > 0 ? "+" : ""}{pct.toFixed(1)}%
        </span>
      )}
      {isMatch && <ShieldCheck className="w-3 h-3 text-emerald-400" />}
    </div>
  );
}

interface SourceCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  count: number;
  totalValue: number;
  sample: Array<{ id: string; primary: string; secondary: string; amount: number; method: string }>;
}

function SourceCard({ title, subtitle, icon, color, count, totalValue, sample }: SourceCardProps) {
  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-300" },
    violet: { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-300" },
    cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-300" },
  };
  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-5 hover:border-primary/40 transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${c.bg} ${c.text}`}>
            {icon}
          </div>
          <div>
            <div className="text-sm font-semibold">{title}</div>
            <div className="text-[11px] text-muted-foreground font-mono">{subtitle}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold tabular-nums">{count}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">records</div>
        </div>
      </div>

      <div className="mb-3 pb-3 border-b border-border/60 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Total gross value</span>
        <span className={`font-mono font-semibold ${c.text}`}>{formatINR(totalValue)}</span>
      </div>

      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Sample records</div>
        {sample.map((s, i) => (
          <div key={i} className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-[10px] text-muted-foreground truncate">{s.id}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-background/60 text-muted-foreground border border-border">
                {paymentMethodLabel(s.method)}
              </span>
              <span className="font-mono text-muted-foreground">{formatINR(s.amount)}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
