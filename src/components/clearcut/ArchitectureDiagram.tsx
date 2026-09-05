"use client";

import { motion } from "framer-motion";
import {
  Lock,
  Sparkles,
  GitBranch,
  AlertTriangle,
  FileJson,
  ArrowRight,
} from "lucide-react";

export function ArchitectureDiagram() {
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
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-breathe" />
            Pipeline architecture
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            Four-stage{" "}
            <span className="gradient-text-emerald animate-gradient">agentic pipeline</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Each stage has a single, auditable responsibility. AI is used surgically — never for arithmetic.
          </p>
        </motion.div>

        {/* Pipeline flow */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4 items-stretch">
          <StageCard
            stageId={-1}
            name="Source Data"
            description="Three messy real-world inputs."
            color="slate"
            icon={<FileJson className="w-5 h-5" />}
            tags={["Orders JSON", "Settlements CSV", "Bank CSV"]}
            flowColor="emerald"
          />

          <StageCard
            stageId={1}
            name="Stage 1"
            description="Deterministic hard match. No AI."
            color="emerald"
            icon={<Lock className="w-5 h-5" />}
            tags={["order_id + amount + UTR"]}
            aiLayer={false}
            flowColor="violet"
          />

          <StageCard
            stageId={2}
            name="Stage 2"
            description="LLM extracts order IDs from messy narrations."
            color="violet"
            icon={<Sparkles className="w-5 h-5" />}
            tags={["Confidence-gated"]}
            aiLayer
            flowColor="cyan"
          />

          <StageCard
            stageId={3}
            name="Stage 3"
            description="LLM generates findMatch() code. Sandbox verifies math."
            color="cyan"
            icon={<GitBranch className="w-5 h-5" />}
            tags={["Balances to ₹0.00"]}
            aiLayer
            flowColor="red"
          />

          <StageCard
            stageId={4}
            name="Stage 4"
            description="Honest exceptions + forensic dossiers."
            color="red"
            icon={<AlertTriangle className="w-5 h-5" />}
            tags={["Dispute payloads"]}
            aiLayer={false}
          />
        </div>

        {/* AI vs Deterministic legend */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs"
        >
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-breathe" />
            <span className="text-muted-foreground">Deterministic — zero hallucination</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass">
            <span className="w-2 h-2 rounded-full bg-violet-400 animate-breathe" />
            <span className="text-muted-foreground">LLM-assisted — verified by math</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-breathe" />
            <span className="text-muted-foreground">Honest exception — escalation</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

interface StageCardProps {
  stageId: number;
  name: string;
  description: string;
  color: string;
  icon: React.ReactNode;
  tags: string[];
  aiLayer?: boolean;
  flowColor?: string; // color of the animated data flow dot leaving this card
}

function StageCard({ stageId, name, description, color, icon, tags, aiLayer, flowColor }: StageCardProps) {
  const colorMap: Record<string, { bg: string; border: string; text: string; glow: string; dot: string }> = {
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-300", glow: "shadow-emerald-500/10", dot: "bg-emerald-400" },
    violet: { bg: "bg-violet-500/10", border: "border-violet-500/30", text: "text-violet-300", glow: "shadow-violet-500/10", dot: "bg-violet-400" },
    cyan: { bg: "bg-cyan-500/10", border: "border-cyan-500/30", text: "text-cyan-300", glow: "shadow-cyan-500/10", dot: "bg-cyan-400" },
    red: { bg: "bg-red-500/10", border: "border-red-500/30", text: "text-red-300", glow: "shadow-red-500/10", dot: "bg-red-400" },
    amber: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-300", glow: "shadow-amber-500/10", dot: "bg-amber-400" },
    slate: { bg: "bg-slate-500/10", border: "border-slate-500/30", text: "text-slate-300", glow: "shadow-slate-500/10", dot: "bg-slate-400" },
  };
  const c = colorMap[color] ?? colorMap.slate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: 0.05 * (stageId + 1) }}
      whileHover={{ y: -4 }}
      className={`group relative rounded-2xl border ${c.border} ${c.bg} backdrop-blur-sm p-4 sm:p-5 shadow-lg ${c.glow} transition-all hover:shadow-xl`}
    >
      {/* AI/Deterministic badge */}
      {aiLayer !== undefined && (
        <div className="absolute -top-2 right-3 z-10">
          {aiLayer ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/40 text-[10px] font-semibold text-violet-200 backdrop-blur-sm">
              <Sparkles className="w-2.5 h-2.5 animate-breathe" /> AI
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-semibold text-emerald-200 backdrop-blur-sm">
              <Lock className="w-2.5 h-2.5" /> DETERMINISTIC
            </span>
          )}
        </div>
      )}

      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl ${c.bg} ${c.text} mb-3 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>

      <div className={`text-xs font-mono font-bold ${c.text} mb-1`}>{name}</div>
      <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{description}</p>

      <div className="flex flex-wrap gap-1">
        {tags.map((t, i) => (
          <span key={i} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background/60 text-muted-foreground border border-border">
            {t}
          </span>
        ))}
      </div>

      {/* Animated data flow arrow with pulsing dot (desktop) */}
      {flowColor && stageId < 4 && (
        <div className="hidden lg:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10 items-center">
          <div className="relative w-6 h-0.5 bg-border overflow-hidden rounded-full">
            <div
              className={`absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${
                colorMap[flowColor]?.dot ?? "bg-emerald-400"
              } animate-data-flow`}
            />
          </div>
          <ArrowRight className="w-3 h-3 text-muted-foreground/50 -ml-1" />
        </div>
      )}
    </motion.div>
  );
}
