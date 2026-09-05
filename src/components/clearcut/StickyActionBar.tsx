"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Zap, Loader2, Database, Download } from "lucide-react";

interface Props {
  isRunning: boolean;
  hasResults: boolean;
  onRun: () => void;
  onOpenExplorer: () => void;
  onExport: () => void;
}

/**
 * Sticky action bar that appears at the top of the viewport once the user
 * scrolls past the hero (past ~600px). Gives judges a persistent way to
 * re-run the pipeline, open the data explorer, or export results without
 * having to scroll back to the top.
 */
export function StickyActionBar({ isRunning, hasResults, onRun, onOpenExplorer, onExport }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 600);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
          className="fixed top-3 left-1/2 -translate-x-1/2 z-40 px-3 w-full max-w-2xl"
        >
          <div className="glass-strong holo-border rounded-2xl px-3 py-2 flex items-center justify-between gap-2 shadow-2xl shadow-emerald-500/10">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300 flex-shrink-0">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div className="hidden sm:block min-w-0">
                <div className="text-xs font-semibold truncate">ClearCut</div>
                <div className="text-[10px] text-muted-foreground font-mono truncate">
                  {isRunning ? "pipeline running…" : hasResults ? "results loaded" : "ready to run"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={onOpenExplorer}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-background/60 border border-border text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-background hover:border-primary/40 transition-colors"
                aria-label="Open source data explorer"
              >
                <Database className="w-3 h-3" />
                Data
                <kbd className="ml-0.5 px-1 py-0.5 rounded bg-background/80 border border-border text-[8px] font-mono">D</kbd>
              </button>

              {hasResults && (
                <button
                  onClick={onExport}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-background/60 border border-border text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-background hover:border-amber-500/40 transition-colors"
                  aria-label="Export report"
                >
                  <Download className="w-3 h-3" />
                  <span className="hidden sm:inline">Export</span>
                  <kbd className="ml-0.5 px-1 py-0.5 rounded bg-background/80 border border-border text-[8px] font-mono">E</kbd>
                </button>
              )}

              <button
                onClick={onRun}
                disabled={isRunning}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold text-[11px] hover:scale-[1.05] active:scale-[0.95] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Running…
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3 fill-current" />
                    {hasResults ? "Re-run" : "Run"}
                    <kbd className="ml-0.5 px-1 py-0.5 rounded bg-slate-950/30 border border-slate-950/40 text-[8px] font-mono text-primary-foreground/80">R</kbd>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
