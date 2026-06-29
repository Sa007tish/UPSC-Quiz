"use client";

import { useEffect, useMemo } from "react";
import type { Question, QuestionAttempt, ScoredQuestionResult } from "@/lib/types";
import { QuestionPalette } from "./QuestionPalette";
import { Timer } from "./Timer";
import { BookmarkButton } from "./BookmarkButton";

interface BaseProps {
  questions: Question[];
  currentIndex: number;
  onJump: (index: number) => void;
  bookmarkedIds: Set<string>;
  onToggleBookmark: (question: Question) => void;
}

interface LiveProps extends BaseProps {
  mode: "live";
  answers: Record<string, QuestionAttempt>;
  elapsedSeconds: number;
  remainingSeconds?: number;
  onSelectOption: (questionId: string, optionId: string) => void;
  onToggleMark: (questionId: string) => void;
  onClear: (questionId: string) => void;
  onSubmit: () => void;
}

interface ReviewProps extends BaseProps {
  mode: "review";
  results: ScoredQuestionResult[];
  onExit: () => void;
}

type Props = LiveProps | ReviewProps;

export function QuizRunner(props: Props) {
  const { questions, currentIndex, onJump, mode } = props;
  const question = questions[currentIndex];

  const liveAttempt = mode === "live" ? props.answers[question.id] : undefined;
  const reviewResult = useMemo(
    () => (mode === "review" ? props.results.find((r) => r.question.id === question.id) : undefined),
    [mode, mode === "review" ? props.results : null, question.id]
  );

  const answeredCount = mode === "live" ? Object.values(props.answers).filter((a) => a.status === "answered").length : 0;
  const progressPercent = mode === "live" ? Math.round((answeredCount / questions.length) * 100) : 100;

  function goPrev() {
    if (currentIndex > 0) onJump(currentIndex - 1);
  }
  function goNext() {
    if (currentIndex < questions.length - 1) onJump(currentIndex + 1);
  }

  // Keyboard shortcuts: arrow keys / N-P always navigate; number keys select
  // an option and M/C mark/clear, but only while actually taking the quiz.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;

      const key = e.key.toLowerCase();

      if (key === "arrowleft" || key === "p") {
        e.preventDefault();
        goPrev();
        return;
      }
      if (key === "arrowright" || key === "n") {
        e.preventDefault();
        goNext();
        return;
      }
      if (props.mode === "live") {
        if (key === "m") {
          e.preventDefault();
          props.onToggleMark(question.id);
        } else if (key === "c") {
          e.preventDefault();
          props.onClear(question.id);
        } else if (/^[1-9]$/.test(key)) {
          const idx = parseInt(key, 10) - 1;
          const opt = question.options[idx];
          if (opt) {
            e.preventDefault();
            props.onSelectOption(question.id, opt.id);
          }
        }
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.mode, question.id, currentIndex]);

  const selectedIds = mode === "live" ? liveAttempt?.selectedOptionIds ?? [] : reviewResult?.attempt.selectedOptionIds ?? [];
  const correctIds = question.correctOptionIds;
  const isMulti = question.type === "multi-choice";

  const actualTime = reviewResult?.attempt.timeSpentSeconds ?? 0;
  const estimatedTime = question.estimatedTimeSeconds;
  const isSlow = mode === "review" && estimatedTime ? actualTime > estimatedTime * 1.5 : false;

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
      <div className="space-y-4">
        {/* Top bar: progress + timer */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl2 border border-ink/10 bg-white px-4 py-3 shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
          <div className="min-w-[160px] flex-1">
            <div className="mb-1 flex items-center justify-between text-xs text-ink/50 dark:text-ink-dark/50">
              <span>
                Question <span className="font-mono font-semibold text-ink dark:text-ink-dark">{currentIndex + 1}</span> of{" "}
                {questions.length}
              </span>
              {mode === "live" && <span className="font-mono">{answeredCount} answered</span>}
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/10 dark:bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-saffron-400 to-teal-400 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          {mode === "live" ? (
            <Timer elapsedSeconds={props.elapsedSeconds} remainingSeconds={props.remainingSeconds} />
          ) : (
            <span className="font-mono text-xs text-ink/50 dark:text-ink-dark/50">
              Time spent: {Math.round(actualTime)}s
              {estimatedTime ? (
                <span className={isSlow ? "text-coral-600 dark:text-coral-400" : "text-ink/40 dark:text-ink-dark/40"}>
                  {" "}
                  (est. {estimatedTime}s{isSlow ? " — slower than usual" : ""})
                </span>
              ) : null}
            </span>
          )}
        </div>

        {/* Question card */}
        <div className="ruled-paper rounded-xl2 border border-ink/10 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
          <div className="mb-4 flex items-center gap-2">
            <DifficultyBadge difficulty={question.difficulty} />
            {question.subject && (
              <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                {question.subject}
              </span>
            )}
            {question.source === "PYQ" && (
              <span className="rounded-full bg-saffron-100 px-2.5 py-0.5 text-[11px] font-medium text-saffron-700 dark:bg-saffron-900/30 dark:text-saffron-300">
                PYQ
              </span>
            )}
            {isMulti && (
              <span className="rounded-full bg-ink/5 px-2.5 py-0.5 text-[11px] font-medium text-ink/60 dark:bg-white/10 dark:text-ink-dark/60">
                Select all that apply
              </span>
            )}
            <span className="ml-auto flex items-center gap-2">
              <span className="font-mono text-[11px] text-ink/40 dark:text-ink-dark/40">
                +{question.marks}
                {question.negativeMarks ? ` / \u2212${question.negativeMarks}` : ""}
              </span>
              <BookmarkButton
                active={props.bookmarkedIds.has(question.id)}
                onToggle={() => props.onToggleBookmark(question)}
              />
            </span>
          </div>

          <p className="text-lg font-medium leading-relaxed text-ink dark:text-ink-dark">{question.text}</p>

          <div className="mt-5 space-y-2.5">
            {question.options.map((opt) => {
              const isSelected = selectedIds.includes(opt.id);
              const isCorrectOpt = correctIds.includes(opt.id);

              let optionClasses =
                "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition";

              if (mode === "review") {
                if (isSelected && isCorrectOpt) {
                  optionClasses += " border-teal-400 bg-teal-50 dark:border-teal-600 dark:bg-teal-900/25";
                } else if (isSelected && !isCorrectOpt) {
                  optionClasses += " border-coral-400 bg-coral-50 dark:border-coral-600 dark:bg-coral-900/25";
                } else if (!isSelected && isCorrectOpt) {
                  optionClasses += " border-teal-300 bg-teal-50/40 dark:border-teal-700 dark:bg-teal-900/10";
                } else {
                  optionClasses += " border-ink/10 dark:border-white/10";
                }
              } else {
                optionClasses += isSelected
                  ? " border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-900/25"
                  : " border-ink/12 hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-white/10 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-900/10";
              }

              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={mode === "review"}
                  onClick={() => mode === "live" && props.onSelectOption(question.id, opt.id)}
                  className={optionClasses}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-mono font-semibold ${
                      isSelected
                        ? mode === "review"
                          ? isCorrectOpt
                            ? "border-teal-500 bg-teal-500 text-white"
                            : "border-coral-500 bg-coral-500 text-white"
                          : "border-indigo-500 bg-indigo-500 text-white"
                        : "border-ink/25 text-ink/50 dark:border-white/25 dark:text-ink-dark/50"
                    }`}
                  >
                    {opt.id.toUpperCase()}
                  </span>
                  <span className="text-sm text-ink/85 dark:text-ink-dark/85">{opt.text}</span>
                  {mode === "review" && isCorrectOpt && (
                    <span className="ml-auto text-[11px] font-medium text-teal-600 dark:text-teal-400">Correct</span>
                  )}
                </button>
              );
            })}
          </div>

          {mode === "review" && question.explanation && (
            <div className="mt-5 rounded-xl bg-saffron-50 p-4 text-sm text-ink/75 dark:bg-saffron-900/15 dark:text-ink-dark/75">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-saffron-700 dark:text-saffron-400">
                Explanation
              </p>
              {question.explanation}
            </div>
          )}

          {mode === "review" && reviewResult && (
            <p className="mt-4 text-xs font-mono text-ink/50 dark:text-ink-dark/50">
              Outcome: <OutcomeLabel outcome={reviewResult.outcome} /> &middot; Marks awarded: {reviewResult.marksAwarded}
            </p>
          )}
        </div>

        {/* Action row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="rounded-lg border border-ink/15 px-4 py-2 text-sm font-medium text-ink/70 transition hover:bg-ink/5 disabled:opacity-40 dark:border-white/15 dark:text-ink-dark/70 dark:hover:bg-white/5"
            >
              \u2190 Previous
            </button>
            <button
              onClick={goNext}
              disabled={currentIndex === questions.length - 1}
              className="rounded-lg border border-ink/15 px-4 py-2 text-sm font-medium text-ink/70 transition hover:bg-ink/5 disabled:opacity-40 dark:border-white/15 dark:text-ink-dark/70 dark:hover:bg-white/5"
            >
              Next \u2192
            </button>
          </div>

          {mode === "live" ? (
            <div className="flex gap-2">
              <button
                onClick={() => props.onClear(question.id)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-ink/55 transition hover:bg-ink/5 dark:text-ink-dark/55 dark:hover:bg-white/5"
              >
                Clear response
              </button>
              <button
                onClick={() => props.onToggleMark(question.id)}
                className="rounded-lg bg-amber-100 px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/45"
              >
                {liveAttempt?.status === "marked-for-review" ? "Unmark" : "Mark for review"}
              </button>
              <button
                onClick={props.onSubmit}
                className="rounded-lg bg-saffron-500 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-saffron-600"
              >
                Submit test
              </button>
            </div>
          ) : (
            <button
              onClick={props.onExit}
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-indigo-600"
            >
              Back to analytics
            </button>
          )}
        </div>

        <p className="text-center text-[11px] text-ink/35 dark:text-ink-dark/35">
          Shortcuts: <kbd className="font-mono">\u2190</kbd>/<kbd className="font-mono">\u2192</kbd> navigate
          {mode === "live" && (
            <>
              {" "}
              &middot; <kbd className="font-mono">1\u20139</kbd> select &middot; <kbd className="font-mono">M</kbd> mark
              &middot; <kbd className="font-mono">C</kbd> clear
            </>
          )}
        </p>
      </div>

      <div className="lg:sticky lg:top-4 lg:self-start">
        {mode === "live" ? (
          <QuestionPalette
            mode="live"
            questions={questions}
            answers={props.answers}
            currentIndex={currentIndex}
            onJump={onJump}
            bookmarkedIds={props.bookmarkedIds}
          />
        ) : (
          <QuestionPalette
            mode="review"
            questions={questions}
            results={props.results}
            currentIndex={currentIndex}
            onJump={onJump}
            bookmarkedIds={props.bookmarkedIds}
          />
        )}
      </div>
    </div>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: Question["difficulty"] }) {
  const styles: Record<Question["difficulty"], string> = {
    easy: "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
    medium: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    hard: "bg-coral-50 text-coral-700 dark:bg-coral-900/30 dark:text-coral-300",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${styles[difficulty]}`}>{difficulty}</span>;
}

function OutcomeLabel({ outcome }: { outcome: ScoredQuestionResult["outcome"] }) {
  const labels: Record<ScoredQuestionResult["outcome"], string> = {
    correct: "Correct",
    incorrect: "Incorrect",
    partial: "Partial credit",
    unanswered: "Unanswered",
  };
  return <span className="font-semibold">{labels[outcome]}</span>;
}
