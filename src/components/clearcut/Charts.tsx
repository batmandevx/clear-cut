"use client";

import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { CheckCircle2, AlertTriangle, Layers, TrendingUp } from "lucide-react";
import type { PipelineMetricsVM } from "./types";

interface Props {
  metrics: PipelineMetricsVM;
}

export function Charts({ metrics }: Props) {
  const matched = metrics.matched;
  const exceptions = metrics.exceptions;
  const total = Math.max(metrics.totalRecords, 1);

  const pieData = [
    { name: "Auto-Matched", value: matched, color: "#10b981" },
    { name: "Honest Exceptions", value: exceptions, color: "#ef4444" },
  ];

  const stageData = [
    { stage: "Stage 1\nDeterministic", count: metrics.stage1, fill: "#10b981" },
    { stage: "Stage 2\nAI Semantic", count: metrics.stage2, fill: "#a78bfa" },
    { stage: "Stage 3\nMulti-Leg", count: metrics.stage3, fill: "#06b6d4" },
    { stage: "Stage 4\nExceptions", count: metrics.stage4, fill: "#ef4444" },
  ];

  return (
    <section className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Donut chart */}
          <motion.div
            initial={{ opacity: 0, y: 20, rotateX: 10 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            whileHover={{ y: -4 }}
            className="relative rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-5 overflow-hidden group"
          >
            {/* Hover glow */}
            <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="relative flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-base font-semibold">Match distribution</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Auto-resolved vs honestly escalated</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 items-center">
              <div className="relative h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      stroke="none"
                      isAnimationActive
                      animationDuration={1200}
                      animationBegin={200}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.6 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
                    className="text-3xl font-bold tabular-nums gradient-text-emerald animate-gradient"
                  >
                    {metrics.matchRatePct}%
                  </motion.div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">match rate</div>
                </div>
                {/* Pulsing ring */}
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div className="w-32 h-32 rounded-full border border-emerald-500/20 animate-breathe" />
                </motion.div>
              </div>

              <div className="space-y-3">
                <LegendRow
                  color="#10b981"
                  icon={<CheckCircle2 className="w-3 h-3" />}
                  label="Auto-Matched"
                  value={matched}
                  pct={((matched / total) * 100).toFixed(1)}
                  animate
                />
                <LegendRow
                  color="#ef4444"
                  icon={<AlertTriangle className="w-3 h-3" />}
                  label="Honest Exceptions"
                  value={exceptions}
                  pct={((exceptions / total) * 100).toFixed(1)}
                  animate
                  delay={0.2}
                />
                <div className="pt-2 border-t border-border/60">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Total Records</div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="text-xl font-bold tabular-nums"
                  >
                    {total}
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stage breakdown bar chart */}
          <motion.div
            initial={{ opacity: 0, y: 20, rotateX: 10 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            whileHover={{ y: -4 }}
            className="relative rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-5 overflow-hidden group"
          >
            <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

            <div className="relative flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-base font-semibold">Resolution by stage</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Where each record was resolved</p>
              </div>
            </div>

            <div className="relative h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis
                    dataKey="stage"
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    tickLine={false}
                    axisLine={{ stroke: "#ffffff20" }}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fill: "#94a3b8", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "#ffffff08" }}
                    contentStyle={{
                      background: "oklch(0.17 0.02 240 / 0.95)",
                      border: "1px solid oklch(0.32 0.02 240)",
                      borderRadius: "8px",
                      fontSize: "11px",
                      color: "#e2e8f0",
                      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={64} isAnimationActive animationDuration={1000}>
                    {stageData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2 text-[10px]">
              <StageLegend color="#10b981" label="Stage 1" sub="Deterministic" value={metrics.stage1} />
              <StageLegend color="#a78bfa" label="Stage 2" sub="AI Semantic" value={metrics.stage2} />
              <StageLegend color="#06b6d4" label="Stage 3" sub="Multi-Leg" value={metrics.stage3} />
              <StageLegend color="#ef4444" label="Stage 4" sub="Exceptions" value={metrics.stage4} />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function LegendRow({ color, icon, label, value, pct, animate, delay = 0 }: {
  color: string;
  icon: React.ReactNode;
  label: string;
  value: number;
  pct: string;
  animate?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={animate ? { opacity: 0, x: -10 } : false}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="flex items-center gap-2"
    >
      <div className="w-3 h-3 rounded-sm flex items-center justify-center shadow-lg" style={{ background: color, boxShadow: `0 0 12px ${color}80` }}>
        <span className="text-white/90">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground truncate">{label}</div>
        <div className="font-mono text-sm font-semibold">
          {value} <span className="text-muted-foreground text-xs">({pct}%)</span>
        </div>
      </div>
    </motion.div>
  );
}

function StageLegend({ color, label, sub, value }: { color: string; label: string; sub: string; value: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.3 }}
      className="rounded-lg bg-background/40 p-2 border border-border/60 hover:border-border transition-colors"
    >
      <div className="flex items-center gap-1 mb-0.5">
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <div className="font-mono text-sm font-semibold">{value}</div>
      <div className="text-[9px] text-muted-foreground">{sub}</div>
    </motion.div>
  );
}
