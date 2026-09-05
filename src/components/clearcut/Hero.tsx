"use client";

import { motion } from "framer-motion";
import { Scissors, Zap, ShieldCheck, Sparkles, GitBranch, ArrowRight } from "lucide-react";

interface Props {
  onRun: () => void;
  isRunning: boolean;
}

export function Hero({ onRun, isRunning }: Props) {
  return (
    <section className="relative overflow-hidden pt-10 pb-12">
      {/* Background grid */}
      <div className="absolute inset-0 grid-pattern opacity-20 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-breathe" />
      <div className="absolute top-20 right-1/4 w-72 h-72 bg-cyan-500/12 rounded-full blur-3xl pointer-events-none animate-breathe" style={{ animationDelay: "1.5s" }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top badge with live indicator */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-strong text-xs font-medium holo-border">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-emerald-300 font-semibold tracking-wide">RAZORPAY AI BUILDATHON</span>
            <span className="text-muted-foreground/60">·</span>
            <span className="text-muted-foreground">Track 04 — AI Finance Controller</span>
          </div>
        </motion.div>

        {/* Logo + animated title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.7, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/40 blur-2xl rounded-full animate-glow-pulse" />
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl glass-strong flex items-center justify-center holo-border">
                <Scissors className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-400 animate-breathe" strokeWidth={2.2} />
              </div>
              {/* Orbiting dots */}
              <div className="absolute inset-0 pointer-events-none">
                <div
                  className="absolute top-1/2 left-1/2 w-2 h-2 -mt-1 -ml-1 rounded-full bg-cyan-400"
                  style={{ animation: "orbit 6s linear infinite" }}
                />
                <div
                  className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -mt-0.5 -ml-0.5 rounded-full bg-violet-400"
                  style={{ animation: "orbit 9s linear infinite reverse", animationDelay: "1s" }}
                />
              </div>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20, letterSpacing: "0.18em" }}
            animate={{ opacity: 1, y: 0, letterSpacing: "-0.02em" }}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.34, 1.56, 0.64, 1] }}
            className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight mb-4"
          >
            <span className="gradient-text-emerald animate-gradient-slow">ClearCut</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-xl sm:text-2xl text-foreground/90 mb-3 max-w-3xl mx-auto font-light"
          >
            The <span className="font-medium text-emerald-300">Self-Resolving</span> Finance Controller
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-sm sm:text-base text-muted-foreground/80 max-w-2xl mx-auto mb-8 leading-relaxed"
          >
            An agentic AI that autonomously reconciles your internal orders against Razorpay settlements and bank statements.
            It resolves multi-leg settlements, auto-matches <span className="text-emerald-300 font-medium">90%+</span> of records,
            and produces an <span className="text-red-300 font-medium">honest exception list</span> with forensic audit trails for the rest.
          </motion.p>
        </div>

        {/* Thesis callout — holo border */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex justify-center mb-10"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-3 px-6 py-3 rounded-2xl glass holo-border max-w-2xl">
            <div className="flex items-center gap-2 text-emerald-300">
              <ShieldCheck className="w-4 h-4 animate-breathe" />
              <span className="font-mono text-sm font-semibold tracking-wide">
                Verification capacity <span className="text-cyan-300">&gt;</span> Generation speed
              </span>
            </div>
            <div className="hidden sm:block h-4 w-px bg-border" />
            <span className="text-xs text-muted-foreground text-center sm:text-left">
              The AI never guesses financial data. It either proves a match mathematically — or honestly admits it cannot resolve.
            </span>
          </div>
        </motion.div>

        {/* CTA + animated money flow viz */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col items-center gap-8"
        >
          <button
            onClick={onRun}
            disabled={isRunning}
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-base shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.03] active:scale-[0.97] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden"
          >
            {/* Shimmer overlay */}
            <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 group-hover:translate-x-full transition-transform duration-700" />
            </span>
            {isRunning ? (
              <>
                <span className="relative flex h-5 w-5">
                  <span className="animate-spin rounded-full h-5 w-5 border-2 border-slate-950/30 border-t-slate-950" />
                </span>
                <span className="relative">Pipeline Running…</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 fill-current relative" />
                <span className="relative">Run Reconciliation Pipeline</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative" />
              </>
            )}
          </button>

          {/* Money flow visualization */}
          <MoneyFlowViz />
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-2 text-xs mt-2"
        >
          <Pill icon={<ShieldCheck className="w-3 h-3" />} color="emerald">
            Deterministic layer
          </Pill>
          <Pill icon={<Sparkles className="w-3 h-3" />} color="violet">
            LLM extraction
          </Pill>
          <Pill icon={<GitBranch className="w-3 h-3" />} color="cyan">
            Code-gen + sandbox
          </Pill>
          <Pill icon={<ShieldCheck className="w-3 h-3" />} color="red">
            Honest exceptions
          </Pill>
          <Pill icon={<Zap className="w-3 h-3" />} color="amber">
            Forensic dossiers
          </Pill>
        </motion.div>

        {/* Stat ticker */}
        <StatTicker />
      </div>
    </section>
  );
}

function Pill({ icon, color, children }: { icon: React.ReactNode; color: string; children: React.ReactNode }) {
  const colorClasses: Record<string, string> = {
    emerald: "text-emerald-300 border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10",
    violet: "text-violet-300 border-violet-500/30 bg-violet-500/5 hover:bg-violet-500/10",
    cyan: "text-cyan-300 border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10",
    red: "text-red-300 border-red-500/30 bg-red-500/5 hover:bg-red-500/10",
    amber: "text-amber-300 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10",
  };
  return (
    <motion.span
      whileHover={{ scale: 1.05, y: -2 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${colorClasses[color]} cursor-default transition-colors`}
    >
      {icon}
      {children}
    </motion.span>
  );
}

/** Animated 3-stage money flow viz: Orders → Settlements → Bank */
function MoneyFlowViz() {
  const nodes = [
    { label: "Orders", sub: "61 records", color: "emerald", icon: "📦" },
    { label: "Settlements", sub: "Razorpay", color: "violet", icon: "💳" },
    { label: "Bank", sub: "54 credits", color: "cyan", icon: "🏦" },
  ];
  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    emerald: { bg: "bg-emerald-500/15", border: "border-emerald-500/40", text: "text-emerald-300" },
    violet: { bg: "bg-violet-500/15", border: "border-violet-500/40", text: "text-violet-300" },
    cyan: { bg: "bg-cyan-500/15", border: "border-cyan-500/40", text: "text-cyan-300" },
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {nodes.map((n, i) => {
          const c = colorMap[n.color];
          return (
            <div key={n.label} className="flex items-center gap-2 sm:gap-4 flex-1">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + i * 0.15, duration: 0.5 }}
                className={`relative flex-1 rounded-xl ${c.bg} ${c.border} border backdrop-blur-sm p-3 sm:p-4 card-lift`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg sm:text-2xl">{n.icon}</span>
                  <div className="min-w-0">
                    <div className={`text-xs sm:text-sm font-semibold ${c.text} truncate`}>{n.label}</div>
                    <div className="text-[10px] text-muted-foreground font-mono truncate">{n.sub}</div>
                  </div>
                </div>
              </motion.div>
              {i < nodes.length - 1 && (
                <div className="relative flex-shrink-0 w-8 sm:w-12 h-0.5 bg-border overflow-hidden">
                  {/* Animated data flow dot */}
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${
                      i === 0 ? "bg-emerald-400" : "bg-violet-400"
                    } animate-data-flow`}
                    style={{ animationDelay: `${i * 0.5}s` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-2 text-center text-[10px] text-muted-foreground font-mono">
        ✓ auto-reconcile → ₹ flow → math-verified match
      </div>
    </div>
  );
}

/** Live stat ticker — marquee of impressive stats */
function StatTicker() {
  const stats = [
    { label: "Auto-match rate", value: "90%+", color: "text-emerald-300" },
    { label: "False positives", value: "0", color: "text-cyan-300" },
    { label: "Multi-leg graphs", value: "solved", color: "text-violet-300" },
    { label: "Forensic dossiers", value: "auto-generated", color: "text-amber-300" },
    { label: "Audit entries", value: "90+ / run", color: "text-emerald-300" },
    { label: "Idempotent", value: "100%", color: "text-cyan-300" },
    { label: "Dispute payloads", value: "pre-drafted", color: "text-red-300" },
    { label: "Ledger status", value: "ESCALATED", color: "text-red-300" },
  ];

  // Duplicate for seamless loop
  const items = [...stats, ...stats];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 1 }}
      className="mt-10 relative overflow-hidden border-y border-border/40 py-3"
      style={{
        maskImage: "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, black 10%, black 90%, transparent)",
      }}
    >
      <div className="flex gap-8 animate-ticker whitespace-nowrap">
        {items.map((s, i) => (
          <div key={i} className="inline-flex items-center gap-2 text-xs font-mono">
            <span className="text-muted-foreground">{s.label}</span>
            <span className={`font-semibold ${s.color}`}>{s.value}</span>
            <span className="text-muted-foreground/30 ml-4">●</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
