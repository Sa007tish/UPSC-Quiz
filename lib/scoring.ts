import type {
  ComposerConfig,
  Question,
  QuestionAttempt,
  QuizAttempt,
  QuizResult,
  ScoredQuestionResult,
} from "./types";

function arraysEqualAsSets(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((x) => setA.has(x));
}

/**
 * Scores a single question. Negative marking only applies if the quiz config
 * has it enabled — otherwise wrong answers simply score 0, never less.
 */
export function scoreQuestion(
  question: Question,
  attempt: QuestionAttempt | undefined,
  negativeMarkingEnabled: boolean
): ScoredQuestionResult {
  const selected = attempt?.selectedOptionIds ?? [];

  if (selected.length === 0) {
    return {
      question,
      attempt: attempt ?? {
        questionId: question.id,
        selectedOptionIds: [],
        status: "unanswered",
        timeSpentSeconds: 0,
        visitCount: 0,
      },
      outcome: "unanswered",
      marksAwarded: 0,
    };
  }

  const isFullyCorrect = arraysEqualAsSets(selected, question.correctOptionIds);

  if (isFullyCorrect) {
    return { question, attempt: attempt!, outcome: "correct", marksAwarded: question.marks };
  }

  // Partial credit only applies to multi-choice questions where the candidate
  // selected a non-empty proper subset of the correct options and nothing wrong.
  if (question.type === "multi-choice") {
    const selectedSet = new Set(selected);
    const correctSet = new Set(question.correctOptionIds);
    const hasWrongSelection = selected.some((id) => !correctSet.has(id));
    const correctSelectedCount = selected.filter((id) => correctSet.has(id)).length;

    if (!hasWrongSelection && correctSelectedCount > 0) {
      const partialMarks =
        (question.marks * correctSelectedCount) / question.correctOptionIds.length;
      return {
        question,
        attempt: attempt!,
        outcome: "partial",
        marksAwarded: Math.round(partialMarks * 100) / 100,
      };
    }
  }

  const penalty = negativeMarkingEnabled ? question.negativeMarks ?? 0 : 0;
  return { question, attempt: attempt!, outcome: "incorrect", marksAwarded: -penalty };
}

export function scoreQuizAttempt(attempt: QuizAttempt): QuizResult {
  const results = attempt.questions.map((q) =>
    scoreQuestion(q, attempt.answers[q.id], attempt.config.negativeMarkingEnabled)
  );

  let totalMarksPossible = 0;
  let totalMarksAwarded = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let unansweredCount = 0;
  let partialCount = 0;
  let attemptedTimeTotal = 0;
  let attemptedCount = 0;

  const subjectBreakdown: QuizResult["subjectBreakdown"] = {};

  for (const r of results) {
    totalMarksPossible += r.question.marks;
    totalMarksAwarded += r.marksAwarded;

    const subj = inferSubjectKey(r.question);
    if (!subjectBreakdown[subj]) {
      subjectBreakdown[subj] = { correct: 0, incorrect: 0, unanswered: 0, total: 0 };
    }
    subjectBreakdown[subj].total += 1;

    if (r.outcome === "correct") {
      correctCount += 1;
      subjectBreakdown[subj].correct += 1;
    } else if (r.outcome === "incorrect") {
      incorrectCount += 1;
      subjectBreakdown[subj].incorrect += 1;
    } else if (r.outcome === "partial") {
      partialCount += 1;
      subjectBreakdown[subj].correct += 1; // count partial as a correct attempt for breakdown purposes
    } else {
      unansweredCount += 1;
      subjectBreakdown[subj].unanswered += 1;
    }

    if (r.attempt.timeSpentSeconds > 0) {
      attemptedTimeTotal += r.attempt.timeSpentSeconds;
      attemptedCount += 1;
    }
  }

  const attemptedTotal = correctCount + incorrectCount + partialCount;
  const accuracyPercent =
    attemptedTotal > 0 ? Math.round(((correctCount + partialCount) / attemptedTotal) * 1000) / 10 : 0;

  return {
    attempt,
    results,
    totalMarksPossible: Math.round(totalMarksPossible * 100) / 100,
    totalMarksAwarded: Math.round(totalMarksAwarded * 100) / 100,
    correctCount,
    incorrectCount,
    unansweredCount,
    partialCount,
    accuracyPercent,
    averageTimePerQuestion: attemptedCount > 0 ? Math.round(attemptedTimeTotal / attemptedCount) : 0,
    subjectBreakdown,
  };
}

// Questions carry a denormalized `subject` set by the composer at quiz-build
// time (snapshotted from their parent bank), since attempt.questions is a
// flat list independent of the original banks.
function inferSubjectKey(question: Question): string {
  return question.subject ?? "General";
}
