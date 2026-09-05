"use client";

import { motion } from "framer-motion";
import { Scissors, Zap, ShieldCheck, Sparkles } from "lucide-react";

export function Hero({ onRun, isRunning }: { onRun: () => void; isRunning: boolean }) {
  return (
    <section className="relative overflow-hidden">
      {/* Background grid + glow */}
      <div className="absolute inset-0 grid-pattern opacity-30 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-24 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 lg:pt-20 pb-8">
        {/* Top badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-6"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-emerald-300">Razorpay AI Buildathon</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">Track 04 — AI Finance Controller</span>
          </div>
        </motion.div>

        {/* Logo + Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/30 blur-2xl rounded-full" />
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl glass-strong flex items-center justify-center">
                <Scissors className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400" strokeWidth={2.2} />
              </div>
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-4">
            <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-cyan-400 bg-clip-text text-transparent animate-gradient">
              ClearCut
            </span>
          </h1>

          <p className="text-xl sm:text-2xl text-muted-foreground mb-3 max-w-3xl mx-auto">
            The Self-Resolving Finance Controller
          </p>

          <p className="text-sm sm:text-base text-muted-foreground/80 max-w-2xl mx-auto mb-8 leading-relaxed">
            An agentic AI that autonomously reconciles your internal orders against Razorpay settlements and bank statements.
            It resolves multi-leg settlements, auto-matches 90%+ of records, and produces an{" "}
            <span className="text-red-300 font-medium">honest exception list</span> with forensic audit trails for the rest.
          </p>
        </motion.div>

        {/* Thesis callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center mb-10"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-3 px-6 py-3 rounded-2xl glass">
            <div className="flex items-center gap-2 text-emerald-300">
              <ShieldCheck className="w-4 h-4" />
              <span className="font-mono text-sm font-semibold">Verification capacity &gt; Generation speed</span>
            </div>
            <div className="hidden sm:block h-4 w-px bg-border" />
            <span className="text-xs text-muted-foreground">
              The AI never guesses financial data. It either proves a match mathematically — or honestly admits it cannot resolve.
            </span>
          </div>
        </motion.div>

        {/* CTA + feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col items-center gap-6"
        >
          <button
            onClick={onRun}
            disabled={isRunning}
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-semibold text-base shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isRunning ? (
              <>
                <span className="relative flex h-5 w-5">
                  <span className="animate-spin rounded-full h-5 w-5 border-2 border-slate-950/30 border-t-slate-950" />
                </span>
                Pipeline Running…
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-current" />
                Run Reconciliation Pipeline
                <span className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 opacity-0 group-hover:opacity-30 blur-md transition-opacity -z-10" />
              </>
            )}
          </button>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <Pill icon={<ShieldCheck className="w-3 h-3" />} color="emerald">
              Deterministic layer
            </Pill>
            <Pill icon={<Sparkles className="w-3 h-3" />} color="violet">
              LLM extraction
            </Pill>
            <Pill icon={<Zap className="w-3 h-3" />} color="cyan">
              Code-gen + sandbox
            </Pill>
            <Pill icon={<ShieldCheck className="w-3 h-3" />} color="red">
              Honest exceptions
            </Pill>
            <Pill icon={<ShieldCheck className="w-3 h-3" />} color="amber">
              Forensic dossiers
            </Pill>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Pill({ icon, color, children }: { icon: React.ReactNode; color: string; children: React.ReactNode }) {
  const colorClasses: Record<string, string> = {
    emerald: "text-emerald-300 border-emerald-500/30 bg-emerald-500/5",
    violet: "text-violet-300 border-violet-500/30 bg-violet-500/5",
    cyan: "text-cyan-300 border-cyan-500/30 bg-cyan-500/5",
    red: "text-red-300 border-red-500/30 bg-red-500/5",
    amber: "text-amber-300 border-amber-500/30 bg-amber-500/5",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${colorClasses[color]}`}>
      {icon}
      {children}
    </span>
  );
}
