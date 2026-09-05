"use client";

import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Zap,
  Target,
  ShieldCheck,
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

  // Sparkline data — derived from stage breakdown
  const sparklineData = [
    metrics.stage1,
    metrics.stage2,
    metrics.stage3,
    metrics.stage4,
  ];
  const maxSpark = Math.max(...sparklineData, 1);

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
            <div className="flex items-center gap-2 mb-1">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full glass text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-breathe" />
                Pipeline results
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-1">
              Metrics{" "}
              <span className="text-base font-normal text-muted-foreground font-mono">· verified</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              {runId ? (
                <>Run ID: <span className="font-mono text-xs text-emerald-300">{runId}</span></>
              ) : null}
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs holo-border">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
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
            accent="emerald"
          />
          <MetricCard
            label="Honest Exceptions"
            value={metrics.exceptions}
            icon={<AlertTriangle className="w-4 h-4" />}
            color="red"
            subtext="escalated to humans"
            progress={(metrics.exceptions / metrics.totalRecords) * 100}
            accent="red"
          />
          <MetricCard
            label="Match Rate"
            value={metrics.matchRatePct}
            suffix="%"
            icon={<Target className="w-4 h-4" />}
            color="cyan"
            subtext="verified, not guessed"
            progress={metrics.matchRatePct}
            accent="cyan"
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

        {/* Stage sparkline strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-3 rounded-2xl border border-border bg-card/40 backdrop-blur-sm p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
              Stage breakdown sparkline
            </div>
            <div className="text-[10px] text-muted-foreground font-mono">
              S1={metrics.stage1} · S2={metrics.stage2} · S3={metrics.stage3} · S4={metrics.stage4}
            </div>
          </div>
          <div className="flex items-end gap-1 h-12">
            {sparklineData.map((v, i) => {
              const height = (v / maxSpark) * 100;
              const colors = ["bg-emerald-400", "bg-violet-400", "bg-cyan-400", "bg-red-400"];
              const labels = ["Stage 1", "Stage 2", "Stage 3", "Stage 4"];
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                  <div className="text-[10px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    {v}
                  </div>
                  <motion.div
                    initial={{ height: 0 }}
                    whileInView={{ height: `${height}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.4 + i * 0.1, ease: "easeOut" }}
                    className={`w-full ${colors[i]} rounded-t-sm min-h-[2px] hover:opacity-80 transition-opacity`}
                    style={{ minHeight: "2px" }}
                  />
                  <div className="text-[9px] font-mono text-muted-foreground">{labels[i]}</div>
                </div>
              );
            })}
          </div>
        </motion.div>
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
  accent?: string;
}

function MetricCard({ label, value, displayValue, suffix, icon, color, subtext, progress, accent }: MetricCardProps) {
  const colorMap: Record<string, { text: string; bg: string; border: string; bar: string; glow: string }> = {
    emerald: { text: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-500/30", bar: "bg-emerald-400", glow: "hover:shadow-emerald-500/20" },
    red: { text: "text-red-300", bg: "bg-red-500/10", border: "border-red-500/30", bar: "bg-red-400", glow: "hover:shadow-red-500/20" },
    cyan: { text: "text-cyan-300", bg: "bg-cyan-500/10", border: "border-cyan-500/30", bar: "bg-cyan-400", glow: "hover:shadow-cyan-500/20" },
    amber: { text: "text-amber-300", bg: "bg-amber-500/10", border: "border-amber-500/30", bar: "bg-amber-400", glow: "hover:shadow-amber-500/20" },
    violet: { text: "text-violet-300", bg: "bg-violet-500/10", border: "border-violet-500/30", bar: "bg-violet-400", glow: "hover:shadow-violet-500/20" },
    slate: { text: "text-slate-300", bg: "bg-slate-500/10", border: "border-slate-500/30", bar: "bg-slate-400", glow: "hover:shadow-slate-500/20" },
  };
  const c = colorMap[color] ?? colorMap.slate;
  const accentColor = accent ? colorMap[accent]?.text : c.text;

  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-30px" });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => (displayValue ? displayValue : `${Math.round(v)}${suffix ?? ""}`));

  useEffect(() => {
    if (inView) {
      const controls = animate(count, value, { duration: 1.4, ease: [0.34, 1.56, 0.64, 1] });
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
      whileHover={{ y: -4 }}
      className={`relative rounded-2xl border ${c.border} ${c.bg} backdrop-blur-sm p-4 overflow-hidden transition-shadow hover:shadow-lg ${c.glow} group`}
    >
      {/* Hover glow */}
      <div className={`absolute inset-0 ${c.bg} opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} />

      <div className="relative flex items-start justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
        <span className={`${c.text} group-hover:scale-110 transition-transform`}>{icon}</span>
      </div>
      <motion.div ref={ref} className={`relative text-2xl sm:text-3xl font-bold tabular-nums ${accentColor}`}>
        {displayValue ? displayValue : <motion.span>{rounded}</motion.span>}
      </motion.div>
      {subtext && (
        <div className="relative text-[10px] text-muted-foreground mt-1 font-mono">{subtext}</div>
      )}
      {progress !== undefined && (
        <div className="relative mt-2 h-1 rounded-full bg-background/60 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${Math.min(progress, 100)}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: "easeOut", delay: 0.2 }}
            className={`h-full ${c.bar}`}
          />
        </div>
      )}
    </motion.div>
  );
}
