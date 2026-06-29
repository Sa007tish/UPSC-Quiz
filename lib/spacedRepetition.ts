import type { QuizResult, SRRecord } from "./types";

// Days until a question becomes due again, indexed by box (1-5).
// Box 1 = due immediately. Box 5 = "mastered", reviewed only occasionally.
const BOX_INTERVAL_DAYS: Record<number, number> = {
  1: 0,
  2: 1,
  3: 3,
  4: 7,
  5: 14,
};

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Updates (or creates) the spaced-repetition record for a single question
 * based on how it was just answered. Correct answers advance the box
 * (longer until due again); incorrect or unanswered resets to box 1 (due now).
 * Partial credit holds the box steady — neither mastered nor reset.
 */
export function updateRecordForResult(
  existing: SRRecord | undefined,
  questionId: string,
  bankId: string,
  subject: string | undefined,
  topic: string | undefined,
  outcome: SRRecord["lastOutcome"],
  now: Date = new Date()
): SRRecord {
  const prevBox = existing?.box ?? 1;
  let nextBox: SRRecord["box"];

  if (outcome === "correct") {
    nextBox = Math.min(5, prevBox + 1) as SRRecord["box"];
  } else if (outcome === "partial") {
    nextBox = prevBox;
  } else {
    // incorrect or unanswered
    nextBox = 1;
  }

  return {
    questionId,
    bankId,
    subject,
    topic,
    box: nextBox,
    dueAt: addDays(now, BOX_INTERVAL_DAYS[nextBox]).toISOString(),
    timesSeen: (existing?.timesSeen ?? 0) + 1,
    timesCorrect: (existing?.timesCorrect ?? 0) + (outcome === "correct" ? 1 : 0),
    lastOutcome: outcome,
    lastSeenAt: now.toISOString(),
  };
}

/** Folds an entire quiz result into a records map, returning the updated map. */
export function applyResultToRecords(
  records: Record<string, SRRecord>,
  result: QuizResult,
  now: Date = new Date()
): Record<string, SRRecord> {
  const updated = { ...records };
  for (const r of result.results) {
    const q = r.question;
    updated[q.id] = updateRecordForResult(
      updated[q.id],
      q.id,
      q.bankId ?? "",
      q.subject,
      q.topic,
      r.outcome,
      now
    );
  }
  return updated;
}

export function getDueRecords(records: Record<string, SRRecord>, now: Date = new Date()): SRRecord[] {
  return Object.values(records).filter((r) => new Date(r.dueAt).getTime() <= now.getTime());
}

export function getWeakRecords(records: Record<string, SRRecord>): SRRecord[] {
  return Object.values(records).filter((r) => r.box <= 2);
}
