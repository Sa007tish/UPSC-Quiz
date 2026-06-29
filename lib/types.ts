// Core data model for question banks. These types are the single source of
// truth for the JSON schema described in /data/README.md — keep them in sync.

export type QuestionType =
  | "single-choice"
  | "multi-choice"
  | "assertion-reason"
  | "match-the-following";

export type Difficulty = "easy" | "medium" | "hard";

export type QuestionSource = "AI-generated" | "PYQ" | "mock-test";

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options: QuestionOption[];
  correctOptionIds: string[];
  difficulty: Difficulty;
  marks: number;
  /** Absolute value deducted for a wrong answer. 0 = no negative marking. */
  negativeMarks: number;
  explanation?: string;
  tags?: string[];
  estimatedTimeSeconds?: number;
  /** Denormalized from the parent bank at composition time, for analytics grouping. */
  subject?: string;
  topic?: string;
  bankId?: string;
  source?: QuestionSource;
}

export interface QuestionBank {
  bankId: string;
  subject: string;
  topic: string;
  subtopic?: string;
  source: QuestionSource;
  examYear?: number | null;
  version: number;
  /** Default negative marking ratio applied to questions that omit negativeMarks (0 = off). */
  defaultNegativeMarkingRatio?: number;
  questions: Question[];
}

/** Lightweight metadata used for the bank-selection screen (no question payloads). */
export interface QuestionBankMeta {
  bankId: string;
  subject: string;
  topic: string;
  subtopic?: string;
  source: QuestionSource;
  examYear?: number | null;
  questionCount: number;
  difficultyBreakdown: Record<Difficulty, number>;
  /** Unique tags across every question in the bank, for filter chips. */
  tags: string[];
}

// ---------- Test composition ----------

export type SelectionMode = "as-is" | "composed";

export interface ComposerConfig {
  mode: SelectionMode;
  bankIds: string[];
  /** Only used when mode === "composed" */
  questionCount?: number;
  difficulties?: Difficulty[]; // empty/undefined = any
  tags?: string[]; // empty/undefined = any
  sources?: QuestionSource[]; // empty/undefined = any
  shuffle?: boolean;
  timed: boolean;
  timeLimitMinutes?: number;
  /** Per-question countdown instead of/alongside one overall timer */
  perQuestionTimeLimitSeconds?: number;
  negativeMarkingEnabled: boolean;
  /** Set when this attempt was built from a special pool rather than a manual bank selection. */
  poolSource?: "bookmarks" | "due-for-review";
}

// ---------- Attempt / session state ----------

export type AnswerStatus = "unanswered" | "answered" | "marked-for-review";

export interface QuestionAttempt {
  questionId: string;
  selectedOptionIds: string[];
  status: AnswerStatus;
  timeSpentSeconds: number;
  visitCount: number;
}

export interface QuizAttempt {
  attemptId: string;
  startedAt: string; // ISO timestamp
  completedAt?: string;
  config: ComposerConfig;
  /** Snapshot of the actual questions used, so history stays valid even if banks change later */
  questions: Question[];
  answers: Record<string, QuestionAttempt>;
  totalTimeSeconds: number;
}

export interface ScoredQuestionResult {
  question: Question;
  attempt: QuestionAttempt;
  outcome: "correct" | "incorrect" | "partial" | "unanswered";
  marksAwarded: number;
}

export interface QuizResult {
  attempt: QuizAttempt;
  results: ScoredQuestionResult[];
  totalMarksPossible: number;
  totalMarksAwarded: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  partialCount: number;
  accuracyPercent: number; // among attempted
  averageTimePerQuestion: number;
  subjectBreakdown: Record<string, { correct: number; incorrect: number; unanswered: number; total: number }>;
}

// ---------- Bookmarks ----------

export interface BookmarkRecord {
  questionId: string;
  bankId: string;
  subject?: string;
  addedAt: string;
}

// ---------- Spaced repetition (Leitner-style) ----------

/** Box 1 = due immediately (weakest), Box 5 = longest interval (mastered). */
export interface SRRecord {
  questionId: string;
  bankId: string;
  subject?: string;
  topic?: string;
  box: 1 | 2 | 3 | 4 | 5;
  dueAt: string; // ISO timestamp
  timesSeen: number;
  timesCorrect: number;
  lastOutcome: ScoredQuestionResult["outcome"];
  lastSeenAt: string;
}

// ---------- Insights ----------

export interface SubjectHeatmapCell {
  subject: string;
  topic: string;
  attempted: number;
  correct: number;
  incorrect: number;
  partial: number;
  unanswered: number;
  accuracyPercent: number;
  avgTimeSeconds: number;
  avgEstimatedTimeSeconds: number | null;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  practicedToday: boolean;
  totalActiveDays: number;
}

export interface BankTrendPoint {
  attemptId: string;
  date: string; // ISO
  accuracyPercent: number;
  scorePercent: number;
}

