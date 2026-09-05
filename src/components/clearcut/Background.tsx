"use client";

import { useEffect, useState } from "react";

/**
 * Cursor-following radial spotlight. Subtle emerald glow that trails the cursor.
 * Pure CSS variable approach — updates --cursor-x / --cursor-y on body.
 */
export function CursorSpotlight() {
  useEffect(() => {
    let raf = 0;
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let curX = targetX;
    let curY = targetY;

    const onMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const tick = () => {
      // ease toward target
      curX += (targetX - curX) * 0.15;
      curY += (targetY - curY) * 0.15;
      document.documentElement.style.setProperty("--cursor-x", `${curX}px`);
      document.documentElement.style.setProperty("--cursor-y", `${curY}px`);
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="fixed inset-0 pointer-events-none z-[1] cursor-spotlight"
      style={{
        background:
          "radial-gradient(600px circle at var(--cursor-x, 50%) var(--cursor-y, 50%), oklch(0.72 0.18 152 / 0.05), transparent 40%)",
      }}
    />
  );
}

/**
 * Floating particle background — subtle ₹ symbols drifting upward.
 * Pure CSS animation, no canvas. Lightweight.
 */
export function ParticleField() {
  const [particles] = useState(() =>
    Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      left: `${(i * 7.3 + 4) % 100}%`,
      delay: `${(i * 1.7) % 18}s`,
      duration: `${20 + (i % 5) * 6}s`,
      symbol: ["₹", "✓", "₹", "▲", "₹", "●", "₹"][i % 7],
      size: 10 + (i % 4) * 4,
      opacity: 0.04 + (i % 5) * 0.02,
    })),
  );

  return (
    <div aria-hidden className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute font-mono text-emerald-400 select-none"
          style={{
            left: p.left,
            bottom: "-50px",
            fontSize: `${p.size}px`,
            opacity: p.opacity,
            animation: `float-particle ${p.duration} linear ${p.delay} infinite`,
          }}
        >
          {p.symbol}
        </span>
      ))}
    </div>
  );
}

/**
 * Subtle animated gradient mesh — three large blurred orbs that drift slowly.
 */
export function GradientMesh() {
  return (
    <div aria-hidden className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div
        className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-30"
        style={{
          background:
            "radial-gradient(circle, oklch(0.72 0.18 152 / 0.5), transparent 70%)",
          animation: "gradient-shift 14s ease-in-out infinite, float-up 8s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full blur-3xl opacity-25"
        style={{
          background:
            "radial-gradient(circle, oklch(0.70 0.18 305 / 0.5), transparent 70%)",
          animation: "gradient-shift 18s ease-in-out infinite reverse, float-up 10s ease-in-out infinite 2s",
        }}
      />
      <div
        className="absolute -bottom-40 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl opacity-20"
        style={{
          background:
            "radial-gradient(circle, oklch(0.72 0.15 200 / 0.5), transparent 70%)",
          animation: "gradient-shift 16s ease-in-out infinite, float-up 12s ease-in-out infinite 1s",
        }}
      />
    </div>
  );
}
