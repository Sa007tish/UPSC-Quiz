import type { BookmarkRecord, QuizAttempt, SRRecord } from "./types";

const HISTORY_KEY = "upsc-quiz:history:v1";
const DRAFT_KEY = "upsc-quiz:in-progress:v1";

function isBrowser() {
  return typeof window !== "undefined";
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getHistory(): QuizAttempt[] {
  if (!isBrowser()) return [];
  return safeParse<QuizAttempt[]>(localStorage.getItem(HISTORY_KEY), []);
}

export function saveCompletedAttempt(attempt: QuizAttempt) {
  if (!isBrowser()) return;
  const history = getHistory();
  history.unshift(attempt);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (err) {
    console.error("Failed to save quiz history (storage may be full):", err);
  }
  clearDraft();
}

export function deleteAttempt(attemptId: string) {
  if (!isBrowser()) return;
  const history = getHistory().filter((a) => a.attemptId !== attemptId);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function clearHistory() {
  if (!isBrowser()) return;
  localStorage.removeItem(HISTORY_KEY);
}

// ---------- In-progress draft (so a refresh mid-quiz doesn't lose state) ----------

export function saveDraft(attempt: QuizAttempt) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(attempt));
  } catch (err) {
    console.error("Failed to save in-progress quiz draft:", err);
  }
}

export function getDraft(): QuizAttempt | null {
  if (!isBrowser()) return null;
  return safeParse<QuizAttempt | null>(localStorage.getItem(DRAFT_KEY), null);
}

export function clearDraft() {
  if (!isBrowser()) return;
  localStorage.removeItem(DRAFT_KEY);
}

// ---------- Export / inspect ----------

export function exportHistoryAsJson(): string {
  return JSON.stringify(getHistory(), null, 2);
}

// ---------- Bookmarks ----------

const BOOKMARKS_KEY = "upsc-quiz:bookmarks:v1";
const SR_RECORDS_KEY = "upsc-quiz:sr-records:v1";

export function getBookmarks(): BookmarkRecord[] {
  if (!isBrowser()) return [];
  return safeParse<BookmarkRecord[]>(localStorage.getItem(BOOKMARKS_KEY), []);
}

export function isBookmarked(questionId: string): boolean {
  return getBookmarks().some((b) => b.questionId === questionId);
}

export function toggleBookmark(questionId: string, bankId: string, subject?: string): BookmarkRecord[] {
  if (!isBrowser()) return [];
  const current = getBookmarks();
  const exists = current.some((b) => b.questionId === questionId);
  const next = exists
    ? current.filter((b) => b.questionId !== questionId)
    : [...current, { questionId, bankId, subject, addedAt: new Date().toISOString() }];
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next));
  return next;
}

// ---------- Spaced repetition records ----------

export function getSRRecords(): Record<string, SRRecord> {
  if (!isBrowser()) return {};
  return safeParse<Record<string, SRRecord>>(localStorage.getItem(SR_RECORDS_KEY), {});
}

export function saveSRRecords(records: Record<string, SRRecord>) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(SR_RECORDS_KEY, JSON.stringify(records));
  } catch (err) {
    console.error("Failed to save spaced-repetition records:", err);
  }
}
