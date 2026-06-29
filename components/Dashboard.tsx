"use client";

import { useMemo } from "react";
import type { QuestionBankMeta, QuizAttempt } from "@/lib/types";
import { scoreQuizAttempt } from "@/lib/scoring";
import { computeStreak } from "@/lib/insights";

export function Dashboard({
  banks,
  recentHistory,
  bookmarkCount,
  dueCount,
  onStartQuiz,
  onViewHistory,
  onViewInsights,
  onPracticeBookmarks,
  onPracticeDue,
}: {
  banks: QuestionBankMeta[];
  recentHistory: QuizAttempt[];
  bookmarkCount: number;
  dueCount: number;
  onStartQuiz: () => void;
  onViewHistory: () => void;
  onViewInsights: () => void;
  onPracticeBookmarks: () => void;
  onPracticeDue: () => void;
}) {
  const totalQuestions = banks.reduce((s, b) => s + b.questionCount, 0);
  const subjectCount = new Set(banks.map((b) => b.subject)).size;
  const streak = useMemo(() => computeStreak(recentHistory), [recentHistory]);

  return (
    <div className="space-y-8">
      <div className="rounded-xl2 border border-ink/10 bg-gradient-to-br from-saffron-100 via-saffron-50 to-teal-50 p-8 shadow-soft dark:border-white/10 dark:from-saffron-900/20 dark:via-saffron-900/10 dark:to-teal-900/10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-saffron-700 dark:text-saffron-400">
              Ready when you are
            </p>
            <h1 className="mt-1.5 text-2xl font-bold text-ink dark:text-ink-dark sm:text-3xl">
              {totalQuestions} questions across {subjectCount} subject{subjectCount !== 1 ? "s" : ""}
            </h1>
            <p className="mt-2 max-w-md text-sm text-ink/65 dark:text-ink-dark/65">
              Pick one or more banks, shape the test the way you want it, and go.
            </p>
          </div>
          {streak.currentStreak > 0 && (
            <button
              onClick={onViewInsights}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-saffron-300 bg-white/70 px-4 py-3 text-left shadow-soft transition hover:bg-white dark:border-saffron-700 dark:bg-white/10 dark:hover:bg-white/15"
            >
              <span className="text-2xl">\ud83d\udd25</span>
              <span>
                <span className="block font-mono text-lg font-bold leading-none text-ink dark:text-ink-dark">
                  {streak.currentStreak}
                </span>
                <span className="block text-[11px] text-ink/55 dark:text-ink-dark/55">day streak</span>
              </span>
            </button>
          )}
        </div>
        <button
          onClick={onStartQuiz}
          className="mt-5 rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-lift transition hover:opacity-90 dark:bg-white dark:text-ink"
        >
          Start a new quiz \u2192
        </button>
      </div>

      {(bookmarkCount > 0 || dueCount > 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {bookmarkCount > 0 && (
            <QuickActionCard
              icon="\u2605"
              iconClass="text-saffron-500"
              title="Bookmarked questions"
              description={`${bookmarkCount} question${bookmarkCount !== 1 ? "s" : ""} flagged for later`}
              onClick={onPracticeBookmarks}
            />
          )}
          {dueCount > 0 && (
            <QuickActionCard
              icon="\u27f3"
              iconClass="text-teal-500"
              title="Due for review"
              description={`${dueCount} question${dueCount !== 1 ? "s" : ""} ready to revisit`}
              onClick={onPracticeDue}
            />
          )}
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink dark:text-ink-dark">Recent attempts</h2>
          <div className="flex gap-3">
            {recentHistory.length > 0 && (
              <button onClick={onViewInsights} className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                Insights \u2192
              </button>
            )}
            {recentHistory.length > 0 && (
              <button onClick={onViewHistory} className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                View all \u2192
              </button>
            )}
          </div>
        </div>

        {recentHistory.length === 0 ? (
          <div className="rounded-xl2 border border-dashed border-ink/15 bg-white/50 p-6 text-center text-sm text-ink/50 dark:border-white/15 dark:bg-white/[0.02] dark:text-ink-dark/50">
            No attempts yet — your first quiz will show up here.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {recentHistory.slice(0, 3).map((attempt) => {
              const r = scoreQuizAttempt(attempt);
              const subjects = Array.from(new Set(attempt.questions.map((q) => q.subject).filter(Boolean)));
              return (
                <button
                  key={attempt.attemptId}
                  onClick={onViewHistory}
                  className="rounded-xl2 border border-ink/10 bg-white p-4 text-left shadow-soft transition hover:border-indigo-300 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-indigo-500/50"
                >
                  <p className="text-sm font-medium text-ink dark:text-ink-dark">{subjects.join(", ") || "Mixed"}</p>
                  <p className="mt-1 font-mono text-lg font-semibold text-ink dark:text-ink-dark">
                    {r.accuracyPercent}%<span className="text-xs font-normal text-ink/45 dark:text-ink-dark/45"> accuracy</span>
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function QuickActionCard({
  icon,
  iconClass,
  title,
  description,
  onClick,
}: {
  icon: string;
  iconClass: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl2 border border-ink/10 bg-white p-4 text-left shadow-soft transition hover:border-indigo-300 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-indigo-500/50"
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ink/5 text-lg dark:bg-white/10 ${iconClass}`}>
        {icon}
      </span>
      <span>
        <span className="block text-sm font-medium text-ink dark:text-ink-dark">{title}</span>
        <span className="block text-xs text-ink/55 dark:text-ink-dark/55">{description}</span>
      </span>
    </button>
  );
}
