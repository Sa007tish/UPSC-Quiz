function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export function Timer({
  elapsedSeconds,
  remainingSeconds,
}: {
  elapsedSeconds: number;
  remainingSeconds?: number;
}) {
  const isLowTime = remainingSeconds !== undefined && remainingSeconds <= 60;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 rounded-full bg-ink/5 px-3 py-1.5 dark:bg-white/10">
        <ClockIcon />
        <span className="font-mono text-sm font-semibold text-ink/80 dark:text-ink-dark/80">
          {formatTime(elapsedSeconds)}
        </span>
        <span className="text-[10px] uppercase tracking-wide text-ink/40 dark:text-ink-dark/40">elapsed</span>
      </div>
      {remainingSeconds !== undefined && (
        <div
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 ${
            isLowTime
              ? "bg-coral-100 text-coral-700 dark:bg-coral-900/40 dark:text-coral-300"
              : "bg-saffron-100 text-saffron-700 dark:bg-saffron-900/30 dark:text-saffron-300"
          }`}
        >
          <span className={`font-mono text-sm font-semibold ${isLowTime ? "animate-pulse-ring rounded-full" : ""}`}>
            {formatTime(remainingSeconds)}
          </span>
          <span className="text-[10px] uppercase tracking-wide opacity-70">left</span>
        </div>
      )}
    </div>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5 text-ink/50 dark:text-ink-dark/50">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
