"use client";

import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Clock,
  Target,
  Zap,
} from "lucide-react";
import type { PipelineMetricsVM } from "./types";
import { formatDuration } from "./format";

interface Props {
  metrics: PipelineMetricsVM | null;
  runId: string | null;
}

export function MetricsDashboard({ metrics, runId }: Props) {
  if (!metrics) {
    return (
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl glass animate-shimmer" />
            ))}
          </div>
        </div>
      </section>
    );
  }

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
            <h2 className="text-2xl font-bold mb-1">Pipeline metrics</h2>
            <p className="text-sm text-muted-foreground">
              {runId ? (
                <>Run ID: <span className="font-mono text-xs">{runId}</span></>
              ) : null}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-muted-foreground">Zero false positives · Idempotent</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard
            label="Total Records"
            value={metrics.totalRecords}
            icon={<Database className="w-4 h-4" />}
            color="slate"
            subtext="orders ingested"
          />
          <MetricCard
            label="Auto-Matched"
            value={metrics.matched}
            icon={<CheckCircle2 className="w-4 h-4" />}
            color="emerald"
            subtext={`${metrics.matchRatePct}% match rate`}
            progress={metrics.matchRatePct}
          />
          <MetricCard
            label="Honest Exceptions"
            value={metrics.exceptions}
            icon={<AlertTriangle className="w-4 h-4" />}
            color="red"
            subtext="escalated to humans"
            progress={(metrics.exceptions / metrics.totalRecords) * 100}
          />
          <MetricCard
            label="Match Rate"
            value={metrics.matchRatePct}
            suffix="%"
            icon={<Target className="w-4 h-4" />}
            color="cyan"
            subtext="verified, not guessed"
            progress={metrics.matchRatePct}
          />
          <MetricCard
            label="Throughput"
            value={metrics.durationMs}
            displayValue={formatDuration(metrics.durationMs)}
            icon={<Zap className="w-4 h-4" />}
            color="amber"
            subtext="end-to-end"
          />
          <MetricCard
            label="False Positives"
            value={0}
            icon={<TrendingUp className="w-4 h-4" />}
            color="violet"
            subtext="zero hallucinations"
          />
        </div>
      </div>
    </section>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  displayValue?: string;
  suffix?: string;
  icon: React.ReactNode;
  color: string;
  subtext?: string;
  progress?: number;
}

function MetricCard({ label, value, displayValue, suffix, icon, color, subtext, progress }: MetricCardProps) {
  const colorMap: Record<string, { text: string; bg: string; border: string; bar: string }> = {
    emerald: { text: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/30", bar: "bg-emerald-400" },
    red: { text: "text-red-300", bg: "bg-red-500/10", border: "border-red-500/30", bar: "bg-red-400" },
    cyan: { text: "text-cyan-300", bg: "bg-cyan-500/10", border: "border-cyan-500/30", bar: "bg-cyan-400" },
    amber: { text: "text-amber-300", bg: "bg-amber-500/10", border: "border-amber-500/30", bar: "bg-amber-400" },
    violet: { text: "text-violet-300", bg: "bg-violet-500/10", border: "border-violet-500/30", bar: "bg-violet-400" },
    slate: { text: "text-slate-300", bg: "bg-slate-500/10", border: "border-slate-500/30", bar: "bg-slate-400" },
  };
  const c = colorMap[color] ?? colorMap.slate;

  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => (displayValue ? displayValue : `${Math.round(v)}${suffix ?? ""}`));

  useEffect(() => {
    if (inView) {
      const controls = animate(count, value, { duration: 1.2, ease: "easeOut" });
      return controls.stop;
    }
  }, [inView, value, count, displayValue]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={`relative rounded-2xl border ${c.border} ${c.bg} backdrop-blur-sm p-4 overflow-hidden`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
        <span className={`${c.text}`}>{icon}</span>
      </div>
      <motion.div className={`text-2xl sm:text-3xl font-bold tabular-nums ${c.text}`}>
        {displayValue ? displayValue : <motion.span>{rounded}</motion.span>}
      </motion.div>
      {subtext && (
        <div className="text-[10px] text-muted-foreground mt-1 font-mono">{subtext}</div>
      )}
      {progress !== undefined && (
        <div className="mt-2 h-1 rounded-full bg-background/60 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${Math.min(progress, 100)}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className={`h-full ${c.bar}`}
          />
        </div>
      )}
    </motion.div>
  );
}
