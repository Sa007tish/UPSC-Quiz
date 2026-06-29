"use client";

import { useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { ComposerConfig, Question, QuestionBank, QuestionBankMeta, QuizAttempt, QuizResult, SRRecord } from "@/lib/types";
import { composeQuestions, buildQuestionsFromIds } from "@/lib/composer";
import { scoreQuizAttempt } from "@/lib/scoring";
import { applyResultToRecords, getDueRecords } from "@/lib/spacedRepetition";
import * as storage from "@/lib/storage";
import { ThemeToggle } from "./ThemeToggle";
import { Dashboard } from "./Dashboard";
import { BankSelector, EmptyState } from "./BankSelector";
import { ComposerPanel } from "./ComposerPanel";
import { QuizRunner } from "./QuizRunner";
import { AnalyticsPanel } from "./AnalyticsPanel";
import { HistoryPanel } from "./HistoryPanel";
import { InsightsPanel } from "./InsightsPanel";

type Screen = "dashboard" | "select" | "configure" | "quiz" | "analytics" | "review" | "history" | "insights";

export function AppShell() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const [banks, setBanks] = useState<QuestionBankMeta[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(true);
  const [bankLoadError, setBankLoadError] = useState(false);

  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [starting, setStarting] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);

  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number | undefined>(undefined);

  const [history, setHistory] = useState<QuizAttempt[]>([]);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [srRecords, setSRRecords] = useState<Record<string, SRRecord>>({});

  // Initial load: bank metadata, history, bookmarks, SR records, and resume
  // any in-progress draft.
  useEffect(() => {
    fetch("/api/banks")
      .then((r) => r.json())
      .then((d) => setBanks(d.banks ?? []))
      .catch(() => setBankLoadError(true))
      .finally(() => setLoadingBanks(false));

    setHistory(storage.getHistory());
    setBookmarkedIds(new Set(storage.getBookmarks().map((b) => b.questionId)));
    setSRRecords(storage.getSRRecords());

    const draft = storage.getDraft();
    if (draft && !draft.completedAt) {
      setAttempt(draft);
      setElapsedSeconds(draft.totalTimeSeconds);
      setRemainingSeconds(
        draft.config.timed && draft.config.timeLimitMinutes
          ? Math.max(0, draft.config.timeLimitMinutes * 60 - draft.totalTimeSeconds)
          : undefined
      );
      setScreen("quiz");
    }
  }, []);

  // Per-second ticking while a live quiz is in progress: advances the elapsed
  // clock, the countdown (if timed), and the current question's time-spent.
  useEffect(() => {
    if (screen !== "quiz" || !attempt) return;
    const qId = attempt.questions[currentIndex]?.id;
    if (!qId) return;

    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
      setRemainingSeconds((r) => (r === undefined ? undefined : Math.max(0, r - 1)));
      setAttempt((prev) => {
        if (!prev) return prev;
        const existing = prev.answers[qId];
        const updated: QuizAttempt = {
          ...prev,
          totalTimeSeconds: prev.totalTimeSeconds + 1,
          answers: {
            ...prev.answers,
            [qId]: { ...existing, timeSpentSeconds: existing.timeSpentSeconds + 1 },
          },
        };
        storage.saveDraft(updated);
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [screen, attempt?.attemptId, currentIndex]);

  // Auto-submit when a timed quiz's countdown hits zero.
  useEffect(() => {
    if (screen === "quiz" && remainingSeconds === 0 && attempt) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds]);

  const selectedBankMetas = useMemo(
    () => banks.filter((b) => selectedBankIds.includes(b.bankId)),
    [banks, selectedBankIds]
  );

  const dueCount = useMemo(() => getDueRecords(srRecords).length, [srRecords]);

  function jumpTo(index: number) {
    setCurrentIndex(index);
    setAttempt((prev) => {
      if (!prev) return prev;
      const q = prev.questions[index];
      if (!q) return prev;
      const existing = prev.answers[q.id];
      return { ...prev, answers: { ...prev.answers, [q.id]: { ...existing, visitCount: existing.visitCount + 1 } } };
    });
  }

  function selectOption(questionId: string, optionId: string) {
    setAttempt((prev) => {
      if (!prev) return prev;
      const question = prev.questions.find((q) => q.id === questionId);
      if (!question) return prev;
      const existing = prev.answers[questionId];
      let selected: string[];
      if (question.type === "multi-choice") {
        selected = existing.selectedOptionIds.includes(optionId)
          ? existing.selectedOptionIds.filter((id) => id !== optionId)
          : [...existing.selectedOptionIds, optionId];
      } else {
        selected = [optionId];
      }
      const preserveMark = existing.status === "marked-for-review";
      return {
        ...prev,
        answers: {
          ...prev.answers,
          [questionId]: {
            ...existing,
            selectedOptionIds: selected,
            status: preserveMark ? "marked-for-review" : selected.length > 0 ? "answered" : "unanswered",
          },
        },
      };
    });
  }

  function toggleMark(questionId: string) {
    setAttempt((prev) => {
      if (!prev) return prev;
      const existing = prev.answers[questionId];
      const newStatus =
        existing.status === "marked-for-review"
          ? existing.selectedOptionIds.length > 0
            ? "answered"
            : "unanswered"
          : "marked-for-review";
      return { ...prev, answers: { ...prev.answers, [questionId]: { ...existing, status: newStatus } } };
    });
  }

  function clearResponse(questionId: string) {
    setAttempt((prev) => {
      if (!prev) return prev;
      const existing = prev.answers[questionId];
      return { ...prev, answers: { ...prev.answers, [questionId]: { ...existing, selectedOptionIds: [], status: "unanswered" } } };
    });
  }

  function handleToggleBookmark(question: Question) {
    const updated = storage.toggleBookmark(question.id, question.bankId ?? "", question.subject);
    setBookmarkedIds(new Set(updated.map((b) => b.questionId)));
  }

  function handleSubmit() {
    setAttempt((current) => {
      if (!current) return current;
      const completed: QuizAttempt = { ...current, completedAt: new Date().toISOString() };
      storage.saveCompletedAttempt(completed);
      const r = scoreQuizAttempt(completed);
      setResult(r);
      setHistory(storage.getHistory());
      setSRRecords((prevRecords) => {
        const updatedRecords = applyResultToRecords(prevRecords, r);
        storage.saveSRRecords(updatedRecords);
        return updatedRecords;
      });
      setScreen("analytics");
      return completed;
    });
  }

  function beginAttempt(questions: Question[], config: ComposerConfig) {
    const newAttempt: QuizAttempt = {
      attemptId: uuidv4(),
      startedAt: new Date().toISOString(),
      config,
      questions,
      answers: Object.fromEntries(
        questions.map((q) => [
          q.id,
          { questionId: q.id, selectedOptionIds: [], status: "unanswered" as const, timeSpentSeconds: 0, visitCount: 0 },
        ])
      ),
      totalTimeSeconds: 0,
    };
    setAttempt(newAttempt);
    setResult(null);
    setCurrentIndex(0);
    setElapsedSeconds(0);
    setRemainingSeconds(config.timed && config.timeLimitMinutes ? config.timeLimitMinutes * 60 : undefined);
    storage.saveDraft(newAttempt);
    setScreen("quiz");
  }

  async function handleStartComposer(partial: Omit<ComposerConfig, "bankIds">) {
    setAppError(null);
    setStarting(true);
    try {
      const responses = await Promise.all(
        selectedBankIds.map(async (id) => {
          const res = await fetch(`/api/banks/${id}`);
          if (!res.ok) throw new Error(`Failed to load bank ${id}`);
          const data = await res.json();
          return data.bank as QuestionBank;
        })
      );

      const config: ComposerConfig = { ...partial, bankIds: selectedBankIds };
      const questions = composeQuestions(responses, config);

      if (questions.length === 0) {
        setAppError("No questions matched your filters. Try adjusting difficulty, tags, or selecting more banks.");
        setStarting(false);
        return;
      }

      beginAttempt(questions, config);
    } catch (err) {
      console.error(err);
      setAppError("Could not load the selected question banks. Please try again.");
    } finally {
      setStarting(false);
    }
  }

  async function handleStartFromPool(kind: "bookmarks" | "due-for-review") {
    setAppError(null);
    setStarting(true);
    try {
      let ids: Set<string>;
      let bankIdsNeeded: string[];

      if (kind === "bookmarks") {
        const marks = storage.getBookmarks();
        ids = new Set(marks.map((m) => m.questionId));
        bankIdsNeeded = Array.from(new Set(marks.map((m) => m.bankId).filter(Boolean)));
      } else {
        const due = getDueRecords(srRecords);
        ids = new Set(due.map((d) => d.questionId));
        bankIdsNeeded = Array.from(new Set(due.map((d) => d.bankId).filter(Boolean)));
      }

      if (ids.size === 0 || bankIdsNeeded.length === 0) {
        setStarting(false);
        return;
      }

      const responses = await Promise.all(
        bankIdsNeeded.map(async (id) => {
          const res = await fetch(`/api/banks/${id}`);
          if (!res.ok) return null;
          const data = await res.json();
          return data.bank as QuestionBank;
        })
      );
      const validBanks = responses.filter((b): b is QuestionBank => b !== null);
      const questions = buildQuestionsFromIds(validBanks, ids, true);

      if (questions.length === 0) {
        setAppError("Couldn't find those questions anymore — their banks may have changed.");
        setStarting(false);
        return;
      }

      const config: ComposerConfig = {
        mode: "composed",
        bankIds: bankIdsNeeded,
        shuffle: true,
        timed: false,
        negativeMarkingEnabled: false,
        poolSource: kind,
      };
      beginAttempt(questions, config);
    } catch (err) {
      console.error(err);
      setAppError("Could not start this practice session. Please try again.");
    } finally {
      setStarting(false);
    }
  }

  function handleSelectHistory(historicAttempt: QuizAttempt) {
    setAttempt(historicAttempt);
    setResult(scoreQuizAttempt(historicAttempt));
    setCurrentIndex(0);
    setScreen("analytics");
  }

  function handleExportHistory() {
    const json = storage.exportHistoryAsJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `upsc-quiz-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function goHome() {
    setScreen("dashboard");
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/90 backdrop-blur dark:border-white/10 dark:bg-paper-dark/90">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3.5">
          <button onClick={goHome} className="flex items-center gap-2 font-display text-lg font-bold text-ink dark:text-ink-dark">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-saffron-500 font-mono text-sm text-white">
              \u2713
            </span>
            Prep Sheet
          </button>
          <nav className="flex items-center gap-3">
            {screen !== "quiz" && screen !== "review" && (
              <>
                <button
                  onClick={() => setScreen("insights")}
                  className={`text-sm font-medium transition ${
                    screen === "insights" ? "text-indigo-600 dark:text-indigo-400" : "text-ink/55 hover:text-ink dark:text-ink-dark/55 dark:hover:text-ink-dark"
                  }`}
                >
                  Insights
                </button>
                <button
                  onClick={() => setScreen("history")}
                  className={`text-sm font-medium transition ${
                    screen === "history" ? "text-indigo-600 dark:text-indigo-400" : "text-ink/55 hover:text-ink dark:text-ink-dark/55 dark:hover:text-ink-dark"
                  }`}
                >
                  History
                </button>
              </>
            )}
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {appError && (
          <div className="mb-4 flex items-start justify-between gap-3 rounded-lg bg-coral-50 px-4 py-3 text-sm text-coral-700 dark:bg-coral-900/20 dark:text-coral-300">
            <span>{appError}</span>
            <button onClick={() => setAppError(null)} className="shrink-0 text-coral-500 hover:text-coral-700 dark:text-coral-400">
              \u2715
            </button>
          </div>
        )}

        {screen === "dashboard" && (
          <Dashboard
            banks={banks}
            recentHistory={history}
            bookmarkCount={bookmarkedIds.size}
            dueCount={dueCount}
            onStartQuiz={() => setScreen("select")}
            onViewHistory={() => setScreen("history")}
            onViewInsights={() => setScreen("insights")}
            onPracticeBookmarks={() => handleStartFromPool("bookmarks")}
            onPracticeDue={() => handleStartFromPool("due-for-review")}
          />
        )}

        {screen === "select" &&
          (loadingBanks ? (
            <LoadingState />
          ) : bankLoadError ? (
            <EmptyState title="Couldn't load question banks" body="Check that the dev/build server is running and /data/question-banks contains valid JSON files." />
          ) : (
            <BankSelector
              banks={banks}
              selectedIds={selectedBankIds}
              onChangeSelected={setSelectedBankIds}
              onContinue={() => setScreen("configure")}
            />
          ))}

        {screen === "configure" && (
          <>
            <ComposerPanel
              selectedBanks={selectedBankMetas}
              onBack={() => setScreen("select")}
              onStart={handleStartComposer}
            />
            {starting && <LoadingState label="Loading questions\u2026" />}
          </>
        )}

        {screen === "quiz" && attempt && (
          <QuizRunner
            mode="live"
            questions={attempt.questions}
            answers={attempt.answers}
            currentIndex={currentIndex}
            elapsedSeconds={elapsedSeconds}
            remainingSeconds={remainingSeconds}
            onJump={jumpTo}
            onSelectOption={selectOption}
            onToggleMark={toggleMark}
            onClear={clearResponse}
            onSubmit={handleSubmit}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={handleToggleBookmark}
          />
        )}

        {screen === "analytics" && result && (
          <AnalyticsPanel
            result={result}
            onReview={() => {
              setCurrentIndex(0);
              setScreen("review");
            }}
            onNewQuiz={() => {
              setSelectedBankIds([]);
              setScreen("select");
            }}
          />
        )}

        {screen === "review" && result && (
          <QuizRunner
            mode="review"
            questions={result.attempt.questions}
            results={result.results}
            currentIndex={currentIndex}
            onJump={setCurrentIndex}
            onExit={() => setScreen("analytics")}
            bookmarkedIds={bookmarkedIds}
            onToggleBookmark={handleToggleBookmark}
          />
        )}

        {screen === "history" && (
          <HistoryPanel
            history={history}
            onSelect={handleSelectHistory}
            onClear={() => {
              storage.clearHistory();
              setHistory([]);
            }}
            onExport={handleExportHistory}
          />
        )}

        {screen === "insights" && <InsightsPanel history={history} />}
      </main>
    </div>
  );
}

function LoadingState({ label = "Loading\u2026" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-ink/50 dark:text-ink-dark/50">
      <span className="h-2 w-2 animate-pulse rounded-full bg-saffron-400" />
      {label}
    </div>
  );
}
