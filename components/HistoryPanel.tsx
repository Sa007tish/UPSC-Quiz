"use client";

import { useMemo, useState } from "react";
import type { QuizAttempt } from "@/lib/types";
import { scoreQuizAttempt } from "@/lib/scoring";
import { EmptyState } from "./BankSelector";

export function HistoryPanel({
  history,
  onSelect,
  onClear,
  onExport,
}: {
  history: QuizAttempt[];
  onSelect: (attempt: QuizAttempt) => void;
  onClear: () => void;
  onExport: () => void;
}) {
  const [confirmingClear, setConfirmingClear] = useState(false);

  const rows = useMemo(
    () =>
      history.map((attempt) => {
        const result = scoreQuizAttempt(attempt);
        const subjects = Array.from(new Set(attempt.questions.map((q) => q.subject).filter(Boolean)));
        return { attempt, result, subjects };
      }),
    [history]
  );

  if (history.length === 0) {
    return <EmptyState title="No quiz attempts yet" body="Finish a quiz and it'll show up here, saved to this browser." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink/55 dark:text-ink-dark/55">
          {history.length} attempt{history.length !== 1 ? "s" : ""} &middot; stored in this browser only
        </p>
        <div className="flex gap-2">
          <button
            onClick={onExport}
            className="rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink/65 transition hover:bg-ink/5 dark:border-white/15 dark:text-ink-dark/65 dark:hover:bg-white/5"
          >
            Export as JSON
          </button>
          {confirmingClear ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-coral-600 dark:text-coral-400">Clear all history?</span>
              <button onClick={onClear} className="font-semibold text-coral-600 underline dark:text-coral-400">
                Yes, clear
              </button>
              <button onClick={() => setConfirmingClear(false)} className="text-ink/50 dark:text-ink-dark/50">
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingClear(true)}
              className="rounded-lg border border-coral-200 px-3 py-1.5 text-xs font-medium text-coral-600 transition hover:bg-coral-50 dark:border-coral-800 dark:text-coral-400 dark:hover:bg-coral-900/20"
            >
              Clear history
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2.5">
        {rows.map(({ attempt, result, subjects }) => (
          <button
            key={attempt.attemptId}
            onClick={() => onSelect(attempt)}
            className="flex w-full items-center justify-between gap-4 rounded-xl2 border border-ink/10 bg-white p-4 text-left shadow-soft transition hover:border-indigo-300 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-indigo-500/50"
          >
            <div>
              <p className="font-medium text-ink dark:text-ink-dark">{subjects.join(", ") || "Mixed"}</p>
              <p className="text-xs text-ink/50 dark:text-ink-dark/50">
                {new Date(attempt.startedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}{" "}
                &middot; {attempt.questions.length} questions
              </p>
            </div>
            <div className="text-right">
              <p className="font-mono text-lg font-semibold text-ink dark:text-ink-dark">
                {result.totalMarksAwarded}
                <span className="text-ink/40 dark:text-ink-dark/40">/{result.totalMarksPossible}</span>
              </p>
              <p className="text-xs text-ink/50 dark:text-ink-dark/50">{result.accuracyPercent}% accuracy</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
