"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const OPTIONS = ["light", "dark", "system"] as const;

const ICONS: Record<(typeof OPTIONS)[number], JSX.Element> = {
  light: (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
      <path
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
      />
    </svg>
  ),
  dark: (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  ),
  system: (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <rect x="3" y="4.5" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 20h8M12 16.5V20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  ),
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const current = (mounted ? theme : "system") as (typeof OPTIONS)[number];

  function cycle() {
    const idx = OPTIONS.indexOf(current);
    setTheme(OPTIONS[(idx + 1) % OPTIONS.length]);
  }

  return (
    <button
      onClick={cycle}
      type="button"
      aria-label={`Theme: ${current}. Click to change.`}
      title={`Theme: ${current}`}
      className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3 py-1.5 text-xs font-medium text-ink/70 shadow-soft transition hover:text-ink dark:border-white/10 dark:bg-white/5 dark:text-ink-dark/70 dark:hover:text-ink-dark"
    >
      {mounted ? ICONS[current] : ICONS.system}
      <span className="capitalize">{mounted ? current : "system"}</span>
    </button>
  );
}
