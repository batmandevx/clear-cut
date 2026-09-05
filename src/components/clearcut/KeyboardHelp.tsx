"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { X, Keyboard } from "lucide-react";
import { SHORTCUTS } from "./useKeyboardShortcuts";

interface Props {
  open: boolean;
  onClose: () => void;
}

const COLOR_MAP: Record<string, string> = {
  emerald: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
  cyan: "bg-cyan-500/15 border-cyan-500/30 text-cyan-300",
  amber: "bg-amber-500/15 border-amber-500/30 text-amber-300",
  violet: "bg-violet-500/15 border-violet-500/30 text-violet-300",
  muted: "bg-muted/15 border-border text-muted-foreground",
};

export function KeyboardHelp({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
            aria-hidden
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
            className="relative w-full max-w-md rounded-2xl border border-border bg-card/95 backdrop-blur-xl overflow-hidden holo-border"
          >
            <div className="flex items-center justify-between gap-3 p-4 border-b border-border bg-card/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-300">
                  <Keyboard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold">Keyboard shortcuts</h3>
                  <p className="text-[11px] text-muted-foreground font-mono">navigate ClearCut without a mouse</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-background/60 border border-border hover:bg-background transition-colors group"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-muted-foreground group-hover:text-red-400 transition-colors" />
              </button>
            </div>

            <div className="p-4 space-y-2">
              {SHORTCUTS.map((s, i) => (
                <motion.div
                  key={s.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-emerald-500/5 transition-colors"
                >
                  <span className="text-sm text-muted-foreground">{s.desc}</span>
                  <kbd className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded text-xs font-mono font-semibold border ${COLOR_MAP[s.color] ?? COLOR_MAP.muted}`}>
                    {s.key}
                  </kbd>
                </motion.div>
              ))}
            </div>

            <div className="p-3 border-t border-border bg-background/40 text-[10px] text-muted-foreground font-mono text-center">
              Tip: shortcuts are ignored while you're typing in an input field
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Small floating button in the bottom-right corner that opens the help overlay.
 * Subtle pulse animation to draw attention.
 */
export function KeyboardHelpButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1, duration: 0.4 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-4 right-4 z-30 w-10 h-10 rounded-full bg-card/80 backdrop-blur-sm border border-border hover:border-violet-500/50 flex items-center justify-center text-muted-foreground hover:text-violet-300 transition-colors group"
      aria-label="Keyboard shortcuts (press ?)"
    >
      <Keyboard className="w-4 h-4 group-hover:rotate-12 transition-transform" />
      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-violet-400 animate-breathe" />
    </motion.button>
  );
}
