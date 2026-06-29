# Adding question banks

Drop a new `.json` file into this folder, commit it, and push to GitHub.
Vercel rebuilds automatically on push, and the new bank appears in the app's
bank selector — no code changes needed.

## File naming

Name the file `<bankId>.json`, matching the `bankId` field inside it
(e.g. `economy-monetary-policy.json`). This isn't strictly required by the
loader (it scans every `.json` file in this folder regardless of name), but
keeping them in sync makes the repo easier to navigate.

## Schema (final)

```jsonc
{
  "bankId": "string, unique across all banks",
  "subject": "string, e.g. 'History', 'Polity', 'Geography', 'Economy'",
  "topic": "string, e.g. 'Modern Indian History'",
  "subtopic": "string, optional, e.g. 'Revolt of 1857'",
  "source": "'AI-generated' | 'PYQ' | 'mock-test'",
  "examYear": "number or null — only set this for real, verified past-year questions",
  "version": "number, bump when you materially edit the bank",
  "defaultNegativeMarkingRatio": "number, optional, e.g. 0.3333 for UPSC's 1/3 rule. Applied to any question that omits its own negativeMarks. Omit entirely (or 0) for no negative marking.",
  "questions": [
    {
      "id": "string, unique across the WHOLE app, not just this bank (see note below)",
      "type": "'single-choice' | 'multi-choice' | 'assertion-reason' | 'match-the-following'",
      "text": "the question text",
      "options": [
        { "id": "a", "text": "option text" }
      ],
      "correctOptionIds": ["array of option ids — supports more than one for multi-choice"],
      "difficulty": "'easy' | 'medium' | 'hard'",
      "marks": "number, marks for a correct answer",
      "negativeMarks": "number, absolute marks deducted for a wrong answer. Set to 0 for no penalty, or omit and rely on the bank's defaultNegativeMarkingRatio.",
      "explanation": "string, optional — shown during review",
      "tags": ["optional array of strings — see 'Tags' below, this powers several features"],
      "estimatedTimeSeconds": "number, optional — used for the 'time vs. average' analytics and the Insights heatmap"
    }
  ]
}
```

Nothing here changed from the original schema — every feature added after the
first version (bookmarks, spaced repetition, accuracy heatmap, mock-test
presets, keyboard shortcuts) is built entirely from fields that already
existed. You don't need to touch existing banks to use any of it.

### Notes

- **`source`**: only mark something `"PYQ"` if it's a verified, real past-year
  question with a known `examYear`. Don't relabel AI-generated practice
  questions as PYQs. Questions from a `"PYQ"` bank get a small "PYQ" badge
  during the quiz, and you can filter to PYQ-only when building a custom test.
- **`correctOptionIds` is always an array**, even for `single-choice` questions
  (just put one id in it). This keeps the scoring logic uniform.
- **Negative marking is per-question, with a per-bank default.** A single
  bank can mix question styles, while still letting you flip a whole bank
  between "practice mode" (no penalty) and "exam mode" (UPSC-style 1/3
  penalty) by setting one field.
- **`estimatedTimeSeconds`** isn't just decorative — it's what the review
  screen and the Insights heatmap compare your actual time against to flag
  questions you're running slow on. Worth setting if you can estimate it
  reasonably (e.g. ask your AI generator to estimate a fair solve time).
- **IDs must be unique across the whole app**, not just within a bank — quiz
  history, bookmarks, and spaced-repetition tracking all key off question id.
  Duplicate ids across banks will cause mix-ups if both are ever used in the
  same composed quiz, or if you bookmark a question that shares an id with
  one in another bank. Prefixing the question id with the bank's short name
  (as in the sample banks) avoids this.
- The app validates structurally (`bankId` and `questions[]` must exist) and
  will skip a malformed file with a warning rather than crashing the whole
  app — check your Vercel build logs if a new bank doesn't show up.

## Tags

`tags` is free-form, but it's wired into three features, so it's worth a
consistent vocabulary across your banks:

1. **Filter chips** on the bank-selection screen and in the custom test
   composer — pick a tag to narrow down questions.
2. **Tag-based composer filters** — build a test from, say, only
   `#writs`-tagged questions across multiple banks.
3. Tags showing up consistently also make the per-bank tag chip list (shown
   on each bank card) actually useful as a glance-able summary.

A reasonable convention: one tag for the narrow sub-topic (`1857-revolt`,
`fundamental-rights`), and optionally a second for a cross-cutting theme
(`writs`, `amendments`, `causes`) so you can pull a thematic test across
subjects later (e.g. every "amendments" question across Polity, however many
banks that ends up spanning).

## Generating banks with AI

Since you're generating these with AI, a reliable approach is to paste the
schema above (or point it at `lib/types.ts` if you're working in-repo) into
your prompt along with the syllabus topic, and ask for output as a single
JSON object matching the schema exactly — no markdown fences, no commentary.
Always skim a sample of the output before committing; spot-check a few
`correctOptionIds` and `explanation` fields against a trusted source, since
factual errors in answer keys are the single most damaging failure mode for
a prep tool like this.
