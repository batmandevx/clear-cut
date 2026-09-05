"use client";

import { motion } from "framer-motion";
import {
  X,
  Check,
  Clock,
  AlertTriangle,
  Brain,
  Calculator,
  FileSpreadsheet,
  Bot,
  ShieldCheck,
  Zap,
  FileText,
  TrendingDown,
} from "lucide-react";

const COMPARISONS = [
  {
    label: "Throughput per batch",
    manual: { value: "3-5 days", icon: <Clock className="w-3.5 h-3.5" />, note: "manual Excel work" },
    clearcut: { value: "~3 minutes", icon: <Zap className="w-3.5 h-3.5" />, note: "end-to-end pipeline" },
    metric: "fast",
  },
  {
    label: "Multi-leg settlement graphs",
    manual: { value: "Manual grouping", icon: <FileSpreadsheet className="w-3.5 h-3.5" />, note: "trial-and-error in pivot tables" },
    clearcut: { value: "Combinatorial solver", icon: <Calculator className="w-3.5 h-3.5" />, note: "math verifies to ₹0.00" },
    metric: "accurate",
  },
  {
    label: "Honest exceptions",
    manual: { value: "Best-guess flagging", icon: <AlertTriangle className="w-3.5 h-3.5" />, note: "subjective, varies by analyst" },
    clearcut: { value: "Forensic dossier", icon: <FileText className="w-3.5 h-3.5" />, note: "every hypothesis tested + rejected with reason" },
    metric: "auditable",
  },
  {
    label: "AI usage",
    manual: { value: "Not used", icon: <X className="w-3.5 h-3.5" />, note: "pure manual labor" },
    clearcut: { value: "Surgical, never for math", icon: <Brain className="w-3.5 h-3.5" />, note: "extraction + code-gen only" },
    metric: "intelligent",
  },
  {
    label: "False positives",
    manual: { value: "5-15%", icon: <TrendingDown className="w-3.5 h-3.5" />, note: "wrong matches require rework" },
    clearcut: { value: "0", icon: <ShieldCheck className="w-3.5 h-3.5" />, note: "deterministic verification" },
    metric: "trustworthy",
  },
  {
    label: "Audit trail",
    manual: { value: "Email threads", icon: <FileSpreadsheet className="w-3.5 h-3.5" />, note: "tribal knowledge, lost on attrition" },
    clearcut: { value: "Append-only log", icon: <Bot className="w-3.5 h-3.5" />, note: "every decision recorded, idempotent" },
    metric: "compliant",
  },
];

export function WhyClearCut() {
  return (
    <section className="relative py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-breathe" />
            Why ClearCut
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            From <span className="text-muted-foreground line-through decoration-red-500/60">manual Excel</span>{" "}
            to{" "}
            <span className="gradient-text-emerald animate-gradient">agentic reconciliation</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Finance teams spend days untangling multi-leg settlements by hand. ClearCut does it in minutes —
            and proves every match mathematically.
          </p>
        </motion.div>

        {/* Comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border border-border bg-card/40 backdrop-blur-sm overflow-hidden"
        >
          {/* Header row */}
          <div className="grid grid-cols-3 bg-card/60 border-b border-border">
            <div className="p-3 sm:p-4 text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
              Dimension
            </div>
            <div className="p-3 sm:p-4 border-l border-border bg-red-500/5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-red-400" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-red-300">Manual</div>
                  <div className="text-[10px] text-muted-foreground font-mono">status quo</div>
                </div>
              </div>
            </div>
            <div className="p-3 sm:p-4 border-l border-border bg-emerald-500/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-cyan-500/10 animate-gradient-slow pointer-events-none" />
              <div className="relative flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs font-semibold gradient-text-emerald">ClearCut</div>
                  <div className="text-[10px] text-muted-foreground font-mono">agentic AI</div>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison rows */}
          {COMPARISONS.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="grid grid-cols-3 border-b border-border/40 last:border-b-0 hover:bg-emerald-500/[0.02] transition-colors group"
            >
              <div className="p-3 sm:p-4 flex items-center">
                <div className="text-xs sm:text-sm font-medium">{c.label}</div>
              </div>
              <div className="p-3 sm:p-4 border-l border-border bg-red-500/[0.02] flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5 text-red-400/80">
                  {c.manual.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-red-300/90 truncate">{c.manual.value}</div>
                  <div className="text-[10px] text-muted-foreground/80 truncate">{c.manual.note}</div>
                </div>
              </div>
              <div className="p-3 sm:p-4 border-l border-border bg-emerald-500/[0.03] flex items-start gap-2 relative overflow-hidden">
                <div className="flex-shrink-0 mt-0.5 text-emerald-400 group-hover:scale-110 transition-transform">
                  {c.clearcut.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-emerald-300 truncate">{c.clearcut.value}</div>
                  <div className="text-[10px] text-muted-foreground/90 truncate">{c.clearcut.note}</div>
                </div>
                <Check className="absolute top-2 right-2 w-3 h-3 text-emerald-500/60 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom thesis */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          <ThesisCard
            icon={<ShieldCheck className="w-4 h-4" />}
            color="emerald"
            title="Zero hallucination"
            body="AI never guesses. Deterministic math verifies every match to ₹0.00."
          />
          <ThesisCard
            icon={<Brain className="w-4 h-4" />}
            color="violet"
            title="Surgical AI"
            body="LLM only for text extraction + code-gen. Never for arithmetic."
          />
          <ThesisCard
            icon={<FileText className="w-4 h-4" />}
            color="cyan"
            title="Honest escalation"
            body="When it can't resolve, it builds a forensic dossier — not a guess."
          />
        </motion.div>
      </div>
    </section>
  );
}

function ThesisCard({ icon, color, title, body }: { icon: React.ReactNode; color: string; title: string; body: string }) {
  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-300" },
    violet: { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-300" },
    cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-300" },
  };
  const c = colorMap[color];
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`rounded-2xl border ${c.border} ${c.bg} backdrop-blur-sm p-4 card-lift group`}
    >
      <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${c.bg} ${c.text} mb-2 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className={`text-sm font-semibold ${c.text} mb-1`}>{title}</div>
      <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
    </motion.div>
  );
}
