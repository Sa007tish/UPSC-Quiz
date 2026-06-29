import type { ComposerConfig, Question, QuestionBank } from "./types";

export function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Snapshot questions from their bank with subject/topic/bankId/source denormalized
 * on, and negativeMarks resolved against the bank's default ratio if a question
 * omits it. This makes each Question self-contained so quiz history stays
 * meaningful even if the source bank is later edited or removed. */
export function snapshotQuestions(bank: QuestionBank): Question[] {
  return bank.questions.map((q) => {
    let negativeMarks = q.negativeMarks;
    if ((negativeMarks === undefined || negativeMarks === null) && bank.defaultNegativeMarkingRatio) {
      negativeMarks = Math.round(q.marks * bank.defaultNegativeMarkingRatio * 100) / 100;
    }
    return {
      ...q,
      negativeMarks: negativeMarks ?? 0,
      subject: bank.subject,
      topic: bank.topic,
      bankId: bank.bankId,
      source: bank.source,
    };
  });
}

/**
 * Builds the final, ordered question list for a quiz attempt.
 * - "as-is": concatenates every question from every selected bank, in bank order.
 * - "composed": pools all questions from selected banks, applies difficulty /
 *   tag / source filters, then samples up to questionCount (shuffled if requested).
 */
export function composeQuestions(banks: QuestionBank[], config: ComposerConfig): Question[] {
  const pool = banks.flatMap(snapshotQuestions);

  if (config.mode === "as-is") {
    return config.shuffle ? shuffleArray(pool) : pool;
  }

  let filtered = pool;
  if (config.difficulties && config.difficulties.length > 0) {
    filtered = filtered.filter((q) => config.difficulties!.includes(q.difficulty));
  }
  if (config.tags && config.tags.length > 0) {
    filtered = filtered.filter((q) => q.tags?.some((t) => config.tags!.includes(t)));
  }
  if (config.sources && config.sources.length > 0) {
    filtered = filtered.filter((q) => q.source && config.sources!.includes(q.source));
  }

  const shuffled = shuffleArray(filtered);
  const count = config.questionCount && config.questionCount > 0 ? config.questionCount : shuffled.length;
  const selected = shuffled.slice(0, count);

  // If the user didn't ask for shuffle, restore the original bank order among
  // the selected subset for a more predictable read-through.
  if (!config.shuffle) {
    const selectedIds = new Set(selected.map((q) => q.id));
    return filtered.filter((q) => selectedIds.has(q.id));
  }

  return selected;
}

/**
 * Builds a question list from a specific set of question ids, regardless of
 * which bank(s) they came from — used for the bookmarks and
 * spaced-repetition ("due for review") quick-practice pools.
 */
export function buildQuestionsFromIds(banks: QuestionBank[], ids: Set<string>, shuffle = true): Question[] {
  const pool = banks.flatMap(snapshotQuestions).filter((q) => ids.has(q.id));
  return shuffle ? shuffleArray(pool) : pool;
}
