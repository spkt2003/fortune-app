import type { ReactNode } from "react";

interface ShrineFrameProps {
  children: ReactNode;
  className?: string;
}

// A themed bordered panel reused across every screen. Deliberately carries
// no flex/gap layout of its own — callers pass their own layout classes via
// `className` so this stays a pure "frame" concern, not a "content
// arrangement" concern (avoids two components fighting over conflicting
// Tailwind utility classes with no merge helper in this project).
// print:* pairs are baked in here once so every consumer is print-safe by
// default, even ones that don't expect to ever be visible while printing.
export default function ShrineFrame({ children, className = "" }: ShrineFrameProps) {
  return (
    <div
      className={`rounded-xl border border-gold/30 bg-panel p-6 text-parchment shadow-[0_0_24px_-8px_rgba(217,119,87,0.35)] print:border-none print:bg-white print:p-0 print:text-black print:shadow-none ${className}`}
    >
      {children}
    </div>
  );
}
