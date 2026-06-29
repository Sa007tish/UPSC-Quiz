import type { BankTrendPoint, QuizAttempt, StreakInfo, SubjectHeatmapCell } from "./types";
import { scoreQuizAttempt } from "./scoring";

function dateKey(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

export function computeSubjectHeatmap(history: QuizAttempt[]): SubjectHeatmapCell[] {
  const cells = new Map<
    string,
    {
      subject: string;
      topic: string;
      attempted: number;
      correct: number;
      incorrect: number;
      partial: number;
      unanswered: number;
      timeSum: number;
      timeCount: number;
      estSum: number;
      estCount: number;
    }
  >();

  for (const attempt of history) {
    const result = scoreQuizAttempt(attempt);
    for (const r of result.results) {
      const subject = r.question.subject ?? "General";
      const topic = r.question.topic ?? "—";
      const key = `${subject}::${topic}`;
      if (!cells.has(key)) {
        cells.set(key, {
          subject,
          topic,
          attempted: 0,
          correct: 0,
          incorrect: 0,
          partial: 0,
          unanswered: 0,
          timeSum: 0,
          timeCount: 0,
          estSum: 0,
          estCount: 0,
        });
      }
      const cell = cells.get(key)!;

      if (r.outcome === "correct") cell.correct += 1;
      else if (r.outcome === "incorrect") cell.incorrect += 1;
      else if (r.outcome === "partial") cell.partial += 1;
      else cell.unanswered += 1;

      if (r.outcome !== "unanswered") cell.attempted += 1;

      if (r.attempt.timeSpentSeconds > 0) {
        cell.timeSum += r.attempt.timeSpentSeconds;
        cell.timeCount += 1;
      }
      if (r.question.estimatedTimeSeconds) {
        cell.estSum += r.question.estimatedTimeSeconds;
        cell.estCount += 1;
      }
    }
  }

  return Array.from(cells.values())
    .map((c) => ({
      subject: c.subject,
      topic: c.topic,
      attempted: c.attempted,
      correct: c.correct,
      incorrect: c.incorrect,
      partial: c.partial,
      unanswered: c.unanswered,
      accuracyPercent: c.attempted > 0 ? Math.round(((c.correct + c.partial) / c.attempted) * 1000) / 10 : 0,
      avgTimeSeconds: c.timeCount > 0 ? Math.round(c.timeSum / c.timeCount) : 0,
      avgEstimatedTimeSeconds: c.estCount > 0 ? Math.round(c.estSum / c.estCount) : null,
    }))
    .sort((a, b) => a.accuracyPercent - b.accuracyPercent);
}

export function computeStreak(history: QuizAttempt[]): StreakInfo {
  const dateSet = new Set(history.filter((a) => a.completedAt).map((a) => dateKey(a.completedAt!)));

  if (dateSet.size === 0) {
    return { currentStreak: 0, longestStreak: 0, practicedToday: false, totalActiveDays: 0 };
  }

  const sortedDates = Array.from(dateSet).sort();
  const todayKey = dateKey(new Date().toISOString());
  const practicedToday = dateSet.has(todayKey);

  // Current streak: walk backward from today (or yesterday, if today hasn't
  // happened yet) for as long as consecutive days are present.
  let currentStreak = 0;
  const cursor = new Date();
  if (!practicedToday) {
    // If today isn't logged yet, the streak is still "alive" as long as
    // yesterday was logged — don't zero it out just because it's still early.
    cursor.setDate(cursor.getDate() - 1);
  }
  while (dateSet.has(dateKey(cursor.toISOString()))) {
    currentStreak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Longest streak: scan the sorted unique dates for the longest consecutive run.
  let longestStreak = 1;
  let run = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diffDays === 1) {
      run += 1;
    } else {
      run = 1;
    }
    longestStreak = Math.max(longestStreak, run);
  }

  return { currentStreak, longestStreak, practicedToday, totalActiveDays: dateSet.size };
}

export function computeTrend(history: QuizAttempt[], subject?: string): BankTrendPoint[] {
  return history
    .filter((a) => a.completedAt)
    .filter((a) => !subject || a.questions.some((q) => q.subject === subject))
    .map((a) => {
      const r = scoreQuizAttempt(a);
      return {
        attemptId: a.attemptId,
        date: a.completedAt!,
        accuracyPercent: r.accuracyPercent,
        scorePercent: r.totalMarksPossible > 0 ? Math.round((r.totalMarksAwarded / r.totalMarksPossible) * 1000) / 10 : 0,
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
