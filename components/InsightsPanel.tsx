"use client";

import { useMemo, useState } from "react";
import type { QuizAttempt } from "@/lib/types";
import { computeSubjectHeatmap, computeStreak, computeTrend } from "@/lib/insights";
import { EmptyState } from "./BankSelector";

export function InsightsPanel({ history }: { history: QuizAttempt[] }) {
  const streak = useMemo(() => computeStreak(history), [history]);
  const heatmap = useMemo(() => computeSubjectHeatmap(history), [history]);
  const subjects = useMemo(() => Array.from(new Set(heatmap.map((c) => c.subject))), [heatmap]);
  const [trendSubject, setTrendSubject] = useState<string | null>(null);

  const trend = useMemo(
    () => computeTrend(history, trendSubject ?? undefined),
    [history, trendSubject]
  );

  if (history.length === 0) {
    return <EmptyState title="No data yet" body="Complete a few quizzes and your streak, accuracy by topic, and score trends will show up here." />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StreakCard label="Current streak" value={streak.currentStreak} suffix={streak.currentStreak === 1 ? "day" : "days"} highlight />
        <StreakCard label="Longest streak" value={streak.longestStreak} suffix={streak.longestStreak === 1 ? "day" : "days"} />
        <StreakCard label="Active days" value={streak.totalActiveDays} suffix="total" />
      </div>

      <div className="rounded-xl2 border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink dark:text-ink-dark">Accuracy by subject &amp; topic</h3>
          <span className="text-xs text-ink/45 dark:text-ink-dark/45">Weakest first</span>
        </div>
        <div className="mt-3 space-y-2">
          {heatmap.map((cell) => (
            <div key={`${cell.subject}::${cell.topic}`} className="flex items-center gap-3">
              <div className="w-36 shrink-0 truncate text-xs">
                <p className="truncate font-medium text-ink dark:text-ink-dark">{cell.topic}</p>
                <p className="truncate text-ink/45 dark:text-ink-dark/45">{cell.subject}</p>
              </div>
              <div className="flex-1">
                <div className="h-5 overflow-hidden rounded-md bg-ink/8 dark:bg-white/10">
                  <div
                    className="flex h-full items-center justify-end pr-1.5 text-[10px] font-mono font-semibold text-white"
                    style={{
                      width: `${Math.max(cell.accuracyPercent, 6)}%`,
                      backgroundColor: heatColor(cell.accuracyPercent),
                    }}
                  >
                    {cell.accuracyPercent}%
                  </div>
                </div>
              </div>
              <div className="w-16 shrink-0 text-right font-mono text-[11px] text-ink/45 dark:text-ink-dark/45">
                {cell.attempted} seen
              </div>
              {cell.avgEstimatedTimeSeconds && (
                <div
                  className={`w-20 shrink-0 text-right font-mono text-[11px] ${
                    cell.avgTimeSeconds > cell.avgEstimatedTimeSeconds * 1.3
                      ? "text-coral-600 dark:text-coral-400"
                      : "text-ink/45 dark:text-ink-dark/45"
                  }`}
                >
                  {cell.avgTimeSeconds}s/{cell.avgEstimatedTimeSeconds}s
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl2 border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-ink dark:text-ink-dark">Score trend</h3>
          <div className="flex flex-wrap gap-1.5">
            <SubjectChip active={trendSubject === null} label="All" onClick={() => setTrendSubject(null)} />
            {subjects.map((s) => (
              <SubjectChip key={s} active={trendSubject === s} label={s} onClick={() => setTrendSubject(s)} />
            ))}
          </div>
        </div>
        {trend.length < 2 ? (
          <p className="py-6 text-center text-sm text-ink/45 dark:text-ink-dark/45">
            Complete at least 2 quizzes{trendSubject ? ` in ${trendSubject}` : ""} to see a trend.
          </p>
        ) : (
          <Sparkline points={trend.map((t) => t.accuracyPercent)} />
        )}
      </div>
    </div>
  );
}

function StreakCard({ label, value, suffix, highlight }: { label: string; value: number; suffix: string; highlight?: boolean }) {
  return (
    <div
      className={`rounded-xl2 border p-4 shadow-soft ${
        highlight
          ? "border-saffron-300 bg-saffron-50 dark:border-saffron-700 dark:bg-saffron-900/20"
          : "border-ink/10 bg-white dark:border-white/10 dark:bg-white/[0.03]"
      }`}
    >
      <p className="text-xs text-ink/55 dark:text-ink-dark/55">{label}</p>
      <p className="mt-1 font-mono text-2xl font-bold text-ink dark:text-ink-dark">
        {highlight && value > 0 ? "\ud83d\udd25 " : ""}
        {value}
        <span className="ml-1 text-sm font-normal text-ink/45 dark:text-ink-dark/45">{suffix}</span>
      </p>
    </div>
  );
}

function SubjectChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
        active ? "bg-ink text-white dark:bg-white dark:text-ink" : "border border-ink/12 text-ink/55 dark:border-white/12 dark:text-ink-dark/55"
      }`}
    >
      {label}
    </button>
  );
}

function heatColor(accuracy: number): string {
  // Coral (low) -> amber (mid) -> teal (high), interpolated.
  if (accuracy >= 75) return "#0FA877";
  if (accuracy >= 50) return "#E6A500";
  return "#E8412A";
}

function Sparkline({ points }: { points: number[] }) {
  const width = 600;
  const height = 80;
  const max = 100;
  const min = 0;
  const step = width / Math.max(points.length - 1, 1);

  const coords = points.map((p, i) => {
    const x = i * step;
    const y = height - ((p - min) / (max - min)) * height;
    return [x, y];
  });

  const path = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height + 20}`} className="h-28 w-full">
      <polyline points={`0,${height} ${width},${height}`} stroke="currentColor" className="text-ink/10 dark:text-white/10" strokeWidth="1" />
      <path d={path} fill="none" stroke="#FF6B1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill="#FF6B1A" />
      ))}
      <text x={0} y={height + 16} className="fill-current text-ink/40 dark:text-ink-dark/40" fontSize="11" fontFamily="monospace">
        {points[0]}%
      </text>
      <text x={width} y={height + 16} textAnchor="end" className="fill-current text-ink/40 dark:text-ink-dark/40" fontSize="11" fontFamily="monospace">
        {points[points.length - 1]}%
      </text>
    </svg>
  );
}
