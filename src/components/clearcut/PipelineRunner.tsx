"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle2, Circle, Play } from "lucide-react";
import type { ProgressEvent } from "./types";
import { STAGES } from "./format";

interface Props {
  isRunning: boolean;
  progressLog: ProgressEvent[];
  onRun: () => void;
  hasResults: boolean;
}

export function PipelineRunner({ isRunning, progressLog, onRun, hasResults }: Props) {
  // Determine which stages are active/done based on progress log
  const stageStates: Record<number, "idle" | "running" | "done"> = {};
  for (const p of progressLog) {
    if (p.phase === "start") stageStates[p.stage] = "running";
    if (p.phase === "complete") stageStates[p.stage] = "done";
  }
  // Special handling: stage 1's "start" with "Stage 0" message means stage 0
  const stage0Active = progressLog.some((p) => p.message.startsWith("Stage 0") && p.phase === "start");
  const stage0Done = progressLog.some((p) => p.message.startsWith("Stage 0") && p.phase === "complete");
  if (stage0Active || stage0Done) {
    stageStates[0] = stage0Done ? "done" : "running";
  }

  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-card/40 backdrop-blur-sm p-6 sm:p-8 relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 dot-pattern opacity-30 pointer-events-none" />
          {isRunning && (
            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0 animate-shimmer" />
          )}

          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Reconciliation control center</h2>
                <p className="text-sm text-muted-foreground">
                  Launch the 4-stage pipeline. Each stage emits live progress to the audit trail.
                </p>
              </div>
              <button
                onClick={onRun}
                disabled={isRunning}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Running…
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    {hasResults ? "Re-run Pipeline" : "Run Pipeline"}
                  </>
                )}
              </button>
            </div>

            {/* Stage progress visualization */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
              {STAGES.map((stage) => {
                const state = stageStates[stage.id] ?? "idle";
                return (
                  <div
                    key={stage.id}
                    className={`relative rounded-xl border p-3 transition-all ${
                      state === "done"
                        ? stage.color === "emerald"
                          ? "border-emerald-500/40 bg-emerald-500/10"
                          : stage.color === "violet"
                          ? "border-violet-500/40 bg-violet-500/10"
                          : stage.color === "cyan"
                          ? "border-cyan-500/40 bg-cyan-500/10"
                          : stage.color === "amber"
                          ? "border-amber-500/40 bg-amber-500/10"
                          : "border-red-500/40 bg-red-500/10"
                        : state === "running"
                        ? "border-primary/60 bg-primary/10 neon-emerald"
                        : "border-border bg-background/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                        {stage.short}
                      </span>
                      {state === "done" ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : state === "running" ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="text-xs font-semibold leading-tight">{stage.name}</div>
                  </div>
                );
              })}
            </div>

            {/* Live log */}
            <AnimatePresence>
              {progressLog.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4"
                >
                  <div className="rounded-xl bg-slate-950/60 border border-border p-3 max-h-48 overflow-y-auto">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-mono">
                      Live audit stream
                    </div>
                    <div className="space-y-1 font-mono text-[11px]">
                      <AnimatePresence initial={false}>
                        {progressLog.slice(-12).map((p, i) => (
                          <motion.div
                            key={`${i}-${p.stage}-${p.phase}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="flex items-start gap-2"
                          >
                            <span className={p.phase === "complete" ? "text-emerald-400" : "text-amber-400"}>
                              {p.phase === "complete" ? "✓" : "→"}
                            </span>
                            <span className="text-muted-foreground">
                              <span className="text-cyan-300">[stage {p.stage}]</span> {p.message}
                              {p.matched !== undefined && (
                                <span className="text-emerald-300"> · matched={p.matched}</span>
                              )}
                              {p.unmatched !== undefined && (
                                <span className="text-red-300"> · unresolved={p.unmatched}</span>
                              )}
                            </span>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
