"use client";

import { useEffect } from "react";

export interface KeyboardShortcutHandlers {
  onRun?: () => void;
  onSearch?: () => void;
  onExport?: () => void;
  onDataExplorer?: () => void;
  onHelp?: () => void;
}

/**
 * Global keyboard shortcut handler. Ignores events when the user is typing
 * in an input/textarea/select (unless the shortcut includes a modifier).
 *
 * Shortcuts:
 *  R         → run pipeline
 *  /         → focus search
 *  E         → export report
 *  D         → open source data explorer
 *  ? or ?+shift → toggle help overlay
 *  Esc       → handled by individual modals (closed there)
 */
export function useKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Modifier keys: skip if user is using Ctrl/Cmd/Meta combos
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toUpperCase() ?? "";
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable;

      // If user is typing, only allow Escape (handled elsewhere) — block all our shortcuts
      if (isInput) return;

      switch (e.key.toLowerCase()) {
        case "r":
          handlers.onRun?.();
          break;
        case "/":
          e.preventDefault();
          handlers.onSearch?.();
          break;
        case "e":
          handlers.onExport?.();
          break;
        case "d":
          handlers.onDataExplorer?.();
          break;
        case "?":
          e.preventDefault();
          handlers.onHelp?.();
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handlers]);
}

interface Shortcut {
  key: string;
  desc: string;
  color: string;
}

export const SHORTCUTS: Shortcut[] = [
  { key: "R", desc: "Run / re-run pipeline", color: "emerald" },
  { key: "/", desc: "Focus search (in tables/audit)", color: "cyan" },
  { key: "E", desc: "Export full report (JSON)", color: "amber" },
  { key: "D", desc: "Open source data explorer", color: "violet" },
  { key: "?", desc: "Toggle this help overlay", color: "muted" },
  { key: "Esc", desc: "Close any open modal", color: "muted" },
];
