"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, Circle, Play, Terminal } from "lucide-react";
import type { ProgressEvent } from "./types";
import { STAGES } from "./format";

interface Props {
  isRunning: boolean;
  progressLog: ProgressEvent[];
  onRun: () => void;
  hasResults: boolean;
}

const THINKING_MESSAGES = [
  "Loading 61 internal orders + 60 settlements + 54 bank credits…",
  "Stage 0: scanning for known exception patterns…",
  "Stage 1: deterministic exact-match against UTR + order_id…",
  "Stage 2: invoking LLM to extract order IDs from messy narrations…",
  "Stage 3: generating findMatch() code via LLM, sandbox verifying math…",
  "Stage 4: building forensic dossiers for unresolved records…",
  "Persisting audit trail + matched records to ledger…",
  "Pipeline complete. Reviewing results…",
];

export function PipelineRunner({ isRunning, progressLog, onRun, hasResults }: Props) {
  // Determine which stages are active/done based on progress log
  const stageStates: Record<number, "idle" | "running" | "done"> = {};
  for (const p of progressLog) {
    if (p.phase === "start") stageStates[p.stage] = "running";
    if (p.phase === "complete") stageStates[p.stage] = "done";
  }
  // Special handling for stage 0 (reported under stage 1 phase)
  const stage0Active = progressLog.some((p) => p.message.startsWith("Stage 0") && p.phase === "start");
  const stage0Done = progressLog.some((p) => p.message.startsWith("Stage 0") && p.phase === "complete");
  if (stage0Active || stage0Done) {
    stageStates[0] = stage0Done ? "done" : "running";
  }

  // Typewriter "agent thinking" message — derived from progress log
  const thinkingIdx = deriveThinkingIdx(isRunning, progressLog);

  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-border bg-card/40 backdrop-blur-sm p-6 sm:p-8 relative overflow-hidden holo-border">
          {/* Background dot pattern */}
          <div className="absolute inset-0 dot-pattern opacity-20 pointer-events-none" />
          {isRunning && (
            <>
              {/* Top shimmer bar */}
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0 animate-shimmer" />
              {/* Scan line */}
              <div className="absolute inset-x-0 top-0 h-32 pointer-events-none overflow-hidden">
                <div className="h-0.5 bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent animate-scan" />
              </div>
            </>
          )}

          <div className="relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-bold">Reconciliation control center</h2>
                  {isRunning && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-[10px] font-mono text-emerald-300">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                      </span>
                      LIVE
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Launch the 4-stage pipeline. Each stage emits live progress to the audit trail.
                </p>
              </div>
              <button
                onClick={onRun}
                disabled={isRunning}
                className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.03] active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden"
              >
                {/* Shimmer on hover */}
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-700" />
                </span>
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin relative" />
                    <span className="relative">Running…</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current relative" />
                    <span className="relative">{hasResults ? "Re-run Pipeline" : "Run Pipeline"}</span>
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
                    className={`relative rounded-xl border p-3 transition-all duration-300 ${
                      state === "done"
                        ? stageColorClass(stage.color, "done")
                        : state === "running"
                        ? "border-primary/60 bg-primary/10 neon-emerald"
                        : "border-border bg-background/40"
                    }`}
                  >
                    {state === "running" && (
                      <div className="absolute -inset-px rounded-xl pointer-events-none">
                        <div className="absolute inset-0 rounded-xl animate-glow-pulse" />
                      </div>
                    )}
                    <div className="relative flex items-center justify-between mb-1">
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
                    <div className="relative text-xs font-semibold leading-tight">{stage.name}</div>
                    {state === "done" && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Live "agent thinking" terminal */}
            <AnimatePresence>
              {isRunning && thinkingIdx !== null && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-4"
                >
                  <div className="rounded-xl bg-slate-950/80 border border-emerald-500/30 p-3 font-mono text-xs">
                    <div className="flex items-center gap-2 mb-2 text-emerald-400/80">
                      <Terminal className="w-3.5 h-3.5" />
                      <span className="text-[10px] uppercase tracking-wider">agent thinking</span>
                      <span className="ml-auto flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500/60" />
                        <span className="w-2 h-2 rounded-full bg-amber-500/60" />
                        <span className="w-2 h-2 rounded-full bg-emerald-500/60 animate-breathe" />
                      </span>
                    </div>
                    <div className="text-emerald-200/90">
                      <span className="text-emerald-500">$</span>{" "}
                      <span className="text-muted-foreground">clearcut-agent</span>{" "}
                      <TypewriterText key={THINKING_MESSAGES[thinkingIdx] ?? ""} text={THINKING_MESSAGES[thinkingIdx] ?? ""} />
                      <span className="inline-block w-1.5 h-3 bg-emerald-400 ml-0.5 align-middle animate-typewriter-cursor" />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Live audit stream */}
            <AnimatePresence>
              {progressLog.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4"
                >
                  <div className="rounded-xl bg-slate-950/60 border border-border p-3 max-h-48 overflow-y-auto">
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-mono flex items-center gap-2">
                      <Terminal className="w-3 h-3" />
                      Live audit stream
                      <span className="ml-auto text-emerald-400">{progressLog.length} events</span>
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

function stageColorClass(color: string, state: string): string {
  if (state !== "done") return "border-border bg-background/40";
  switch (color) {
    case "emerald": return "border-emerald-500/40 bg-emerald-500/10";
    case "violet": return "border-violet-500/40 bg-violet-500/10";
    case "cyan": return "border-cyan-500/40 bg-cyan-500/10";
    case "amber": return "border-amber-500/40 bg-amber-500/10";
    case "red": return "border-red-500/40 bg-red-500/10";
    default: return "border-border bg-background/40";
  }
}

/** Derives the most relevant "thinking" message index from the progress log.
 *  Pure function of (isRunning, progressLog) — no effects, no setState.
 */
function deriveThinkingIdx(isRunning: boolean, progressLog: ProgressEvent[]): number | null {
  if (!isRunning) return null;
  if (progressLog.length === 0) return 0;
  const last = progressLog[progressLog.length - 1];
  if (last.message.startsWith("Stage 0")) return last.phase === "complete" ? 2 : 1;
  if (last.stage === 1) return last.phase === "complete" ? 3 : 2;
  if (last.stage === 2) return last.phase === "complete" ? 4 : 3;
  if (last.stage === 3) return last.phase === "complete" ? 5 : 4;
  if (last.stage === 4) return last.phase === "complete" ? 6 : 5;
  return 7;
}

/** Typewriter effect — reveals text one character at a time.
 *  Parent passes a `textKey` prop so React remounts this component (resetting state)
 *  whenever the message changes — no setState needed in the effect body.
 */
function TypewriterText({ text }: { text: string }) {
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCharCount((prev) => {
        if (prev >= text.length) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 25);
    return () => clearInterval(interval);
  }, [text]);

  return <span>{text.slice(0, charCount)}</span>;
}
