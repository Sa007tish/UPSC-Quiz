# Quiz app banks — Objective General Studies (NCERT Subjectwise MCQs)

**328 bank files, 13,974 questions**, converted from the same source PDF into your app's schema. One file per chapter, matching the granularity of the earlier QuizForge export.

## Field mapping / decisions

- **`subject`** — a simplified taxonomy across the book's 10 sections: `History` (History of India + Indian National Movement), `Geography` (World + Indian Geography), `Polity`, `Economy`, `Environment`, `Science` (Physics/Computer-IT/Chemistry/Biology), `General Awareness`, `State GK`. You said there's no existing list to match, so this is my own reasonable pick — easy to rename/merge with find-and-replace if you'd rather split History or Geography into two subjects.
- **`topic`** = chapter title from the book (e.g. "Stone Age"). **`subtopic`** = the book's own sub-section where it has one (e.g. "Ancient History", "Physics", "Bihar"); omitted where the book doesn't subdivide further (e.g. Indian National Movement, Polity).
- **`type`** — reclassified using the structure of each question: `assertion-reason` for "Assertion (A) / Reason (R)" questions, `match-the-following` for "Match List-I with List-II" questions, `single-choice` for everything else. All still use the same `options` / `correctOptionIds` shape.
- **`source: "PYQ"`, `examYear: null`** — every question is a real cited exam question (UPSC, UPPCS, BPSC, state PCS, etc.), so PYQ is accurate, but each chapter mixes many different years, so there's no single bank-level year. The specific exam + year (e.g. "UPPCS (Pre) 2016") is kept per-question in `tags` instead.
- **`tags`** = exam citation(s) + the subtopic slug, so you can filter by exam or by sub-section across chapters.
- **No `defaultNegativeMarkingRatio`** — left out entirely (practice mode, no penalty). It's one field to add per bank if you want exam-mode scoring.
- **`bankId`/question `id`** are built from the full section path (not just the simplified subject), since several chapters share a name across different sections — e.g. "Plateaus" exists in both World and Indian Geography. Verified globally unique across all 328 files and 13,974 questions.

## difficulty and estimatedTimeSeconds — both AI-estimated, not from the source

You asked for these to be filled in, so here's exactly how, since neither exists in the book:

- **`estimatedTimeSeconds`**: baseline of **72 seconds**, the standard UPSC Prelims GS pace (100 questions in 120 minutes). Adjusted up for question types that need more reading/evaluation: +30s for assertion-reason, +45s for match-the-following, +20s for multi-statement "consider the following" questions, plus a small bump for unusually long prompts/options. Rounded to the nearest 5s. Treat these as reasonable starting points, not measured data.
- **`difficulty`**: heuristic based on question structure — assertion-reason and match-the-following default to "hard"; multi-statement combination questions ("Only 1", "Both 1 and 2", etc.) are "hard" with 3+ statements or "medium" with fewer; numerical/calculation options are "medium"; short factual-recall questions with short options are "easy"; everything else defaults to "medium". Distribution across all 13,974: 6,817 easy / 6,084 medium / 1,073 hard. This is a structural guess, not a measure of how hard test-takers actually find each question — worth treating as a rough sort order rather than ground truth.

## Same 8 exclusions as before
6 questions have diagram-only answer options (images, not text) and 2 have a confirmed typo in the book's own printed answer key — see the previous export's README for the exact locations. Both are simply not present in this version either.
