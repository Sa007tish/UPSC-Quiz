"use client";

import type { QuizResult } from "@/lib/types";

export function AnalyticsPanel({
  result,
  onReview,
  onNewQuiz,
}: {
  result: QuizResult;
  onReview: () => void;
  onNewQuiz: () => void;
}) {
  const { attempt, totalMarksPossible, totalMarksAwarded, correctCount, incorrectCount, partialCount, unansweredCount, accuracyPercent, averageTimePerQuestion } = result;
  const scorePercent = totalMarksPossible > 0 ? Math.round((totalMarksAwarded / totalMarksPossible) * 1000) / 10 : 0;
  const timeLimitSeconds = attempt.config.timeLimitMinutes ? attempt.config.timeLimitMinutes * 60 : undefined;

  return (
    <div className="space-y-6 pb-10">
      <div className="grid gap-4 sm:grid-cols-[1.2fr_1fr]">
        <div className="rounded-xl2 border border-ink/10 bg-gradient-to-br from-saffron-50 to-teal-50 p-6 shadow-soft dark:border-white/10 dark:from-saffron-900/15 dark:to-teal-900/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/45 dark:text-ink-dark/45">Score</p>
          <p className="mt-1 font-mono text-4xl font-bold text-ink dark:text-ink-dark">
            {totalMarksAwarded}
            <span className="text-xl text-ink/40 dark:text-ink-dark/40"> / {totalMarksPossible}</span>
          </p>
          <p className="mt-1 text-sm text-ink/60 dark:text-ink-dark/60">{scorePercent}% overall</p>
        </div>
        <div className="rounded-xl2 border border-ink/10 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/45 dark:text-ink-dark/45">Accuracy</p>
          <p className="mt-1 font-mono text-4xl font-bold text-ink dark:text-ink-dark">{accuracyPercent}%</p>
          <p className="mt-1 text-sm text-ink/60 dark:text-ink-dark/60">among attempted questions</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Correct" value={correctCount} swatch="bg-teal-500" />
        <StatCard label="Incorrect" value={incorrectCount} swatch="bg-coral-500" />
        <StatCard label="Partial" value={partialCount} swatch="bg-amber-400" />
        <StatCard label="Unanswered" value={unansweredCount} swatch="bg-ink/20 dark:bg-white/20" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl2 border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink/45 dark:text-ink-dark/45">Time</p>
          <Row label="Avg. time / question" value={`${averageTimePerQuestion}s`} />
          <Row label="Total time used" value={formatDuration(attempt.totalTimeSeconds)} />
          {timeLimitSeconds && <Row label="Time allotted" value={formatDuration(timeLimitSeconds)} />}
        </div>

        <div className="rounded-xl2 border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink/45 dark:text-ink-dark/45">By subject</p>
          <div className="space-y-2.5">
            {Object.entries(result.subjectBreakdown).map(([subject, b]) => (
              <div key={subject}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-ink/75 dark:text-ink-dark/75">{subject}</span>
                  <span className="font-mono text-ink/45 dark:text-ink-dark/45">
                    {b.correct}/{b.total}
                  </span>
                </div>
                <div className="flex h-2 overflow-hidden rounded-full bg-ink/10 dark:bg-white/10">
                  <div className="bg-teal-500" style={{ width: `${(b.correct / b.total) * 100}%` }} />
                  <div className="bg-coral-500" style={{ width: `${(b.incorrect / b.total) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={onReview}
          className="rounded-lg bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-indigo-600"
        >
          Review answers \u2192
        </button>
        <button
          onClick={onNewQuiz}
          className="rounded-lg border border-ink/15 px-5 py-2.5 text-sm font-medium text-ink/70 transition hover:bg-ink/5 dark:border-white/15 dark:text-ink-dark/70 dark:hover:bg-white/5"
        >
          Start a new quiz
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, swatch }: { label: string; value: number; swatch: string }) {
  return (
    <div className="rounded-xl2 border border-ink/10 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${swatch}`} />
        <span className="text-xs text-ink/55 dark:text-ink-dark/55">{label}</span>
      </div>
      <p className="font-mono text-2xl font-bold text-ink dark:text-ink-dark">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-ink/60 dark:text-ink-dark/60">{label}</span>
      <span className="font-mono font-medium text-ink dark:text-ink-dark">{value}</span>
    </div>
  );
}

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return `${m}m ${s}s`;
}
