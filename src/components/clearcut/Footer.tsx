"use client";

import { Scissors, ShieldCheck, Sparkles, Github, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-card/40 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg glass-strong flex items-center justify-center">
                <Scissors className="w-4 h-4 text-emerald-400" strokeWidth={2.2} />
              </div>
              <span className="font-semibold text-base">ClearCut</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              The self-resolving finance controller. An agentic AI system for autonomous
              reconciliation of multi-leg settlements.
            </p>
          </div>

          {/* Tech */}
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
              Built with
            </div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>Next.js 16 App Router · TypeScript</li>
              <li>Prisma + SQLite · Tailwind CSS 4</li>
              <li>z-ai-web-dev-sdk · Framer Motion · Recharts</li>
              <li>shadcn/ui · Lucide icons</li>
            </ul>
          </div>

          {/* Track */}
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">
              Razorpay AI Buildathon
            </div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono">
                <ShieldCheck className="w-2.5 h-2.5" />
                Track 04
              </span>
              <span className="text-xs text-muted-foreground">AI Finance Controller</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Verification capacity &gt; Generation speed. The AI never guesses financial data.
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[10px] font-mono text-muted-foreground">
            © 2025 ClearCut · Built for the Razorpay AI Buildathon · All arithmetic mathematically verified.
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> LLM-assisted
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Deterministic-verified
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
