"use client";

import type { Question, QuestionAttempt, ScoredQuestionResult } from "@/lib/types";

interface LiveProps {
  mode: "live";
  questions: Question[];
  answers: Record<string, QuestionAttempt>;
  currentIndex: number;
  onJump: (index: number) => void;
  bookmarkedIds?: Set<string>;
}

interface ReviewProps {
  mode: "review";
  questions: Question[];
  results: ScoredQuestionResult[];
  currentIndex: number;
  onJump: (index: number) => void;
  bookmarkedIds?: Set<string>;
}

type Props = LiveProps | ReviewProps;

function liveBubbleClasses(answer: QuestionAttempt | undefined, isCurrent: boolean): string {
  const base =
    "flex h-9 w-9 items-center justify-center rounded-lg font-mono text-sm font-semibold transition";
  let stateClasses = "bg-white text-ink/50 border border-ink/15 dark:bg-white/5 dark:text-ink-dark/50 dark:border-white/10";

  if (answer?.status === "answered") {
    stateClasses = "bg-teal-500 text-white border border-teal-600";
  } else if (answer?.status === "marked-for-review") {
    stateClasses = "bg-amber-400 text-ink border border-amber-500";
  }

  const ring = isCurrent ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-paper dark:ring-offset-paper-dark" : "";
  return `${base} ${stateClasses} ${ring}`;
}

function reviewBubbleClasses(outcome: ScoredQuestionResult["outcome"] | undefined, isCurrent: boolean): string {
  const base =
    "flex h-9 w-9 items-center justify-center rounded-lg font-mono text-sm font-semibold transition";
  let stateClasses = "bg-white text-ink/50 border border-ink/15 dark:bg-white/5 dark:text-ink-dark/50 dark:border-white/10";

  if (outcome === "correct") stateClasses = "bg-teal-500 text-white border border-teal-600";
  else if (outcome === "incorrect") stateClasses = "bg-coral-500 text-white border border-coral-600";
  else if (outcome === "partial") stateClasses = "bg-amber-400 text-ink border border-amber-500";

  const ring = isCurrent ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-paper dark:ring-offset-paper-dark" : "";
  return `${base} ${stateClasses} ${ring}`;
}

export function QuestionPalette(props: Props) {
  const { questions, currentIndex, onJump, mode } = props;

  return (
    <div className="rounded-xl2 border border-ink/10 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink/45 dark:text-ink-dark/45">
        Question palette
      </p>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
        {questions.map((q, i) => {
          const classes =
            mode === "live"
              ? liveBubbleClasses(props.answers[q.id], i === currentIndex)
              : reviewBubbleClasses(
                  props.results.find((r) => r.question.id === q.id)?.outcome,
                  i === currentIndex
                );
          return (
            <button key={q.id} type="button" onClick={() => onJump(i)} className={`relative ${classes}`} aria-label={`Question ${i + 1}`}>
              {i + 1}
              {props.bookmarkedIds?.has(q.id) && (
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-saffron-500 ring-2 ring-paper dark:ring-paper-dark" />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-1.5 border-t border-ink/10 pt-3 text-xs text-ink/60 dark:border-white/10 dark:text-ink-dark/60">
        {mode === "live" ? (
          <>
            <Legend swatch="bg-teal-500" label="Answered" />
            <Legend swatch="bg-amber-400" label="Marked for review" />
            <Legend swatch="bg-white border border-ink/20 dark:bg-white/5 dark:border-white/15" label="Unanswered" />
          </>
        ) : (
          <>
            <Legend swatch="bg-teal-500" label="Correct" />
            <Legend swatch="bg-coral-500" label="Incorrect" />
            <Legend swatch="bg-amber-400" label="Partial credit" />
            <Legend swatch="bg-white border border-ink/20 dark:bg-white/5 dark:border-white/15" label="Unanswered" />
          </>
        )}
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded-sm ${swatch}`} />
      <span>{label}</span>
    </div>
  );
}
