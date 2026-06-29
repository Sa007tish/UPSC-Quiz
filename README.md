# Prep Sheet — UPSC Quiz Practice

A self-hosted quiz app for UPSC prep: pick one or more question banks, shape
a test the way you want it (count, difficulty, tags, timing, marking), take
it with a proper exam-style timer and question palette, and review it
afterwards by navigating the same environment rather than scrolling a flat
list. Includes bookmarking, spaced-repetition review, streaks, an
accuracy-by-topic heatmap, keyboard shortcuts, and UPSC mock-test presets.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- `next-themes` for light/dark/system mode
- No backend, no database — question banks are static JSON files in the repo,
  and your quiz history, bookmarks, and progress live in your browser's
  `localStorage`.

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Adding question banks

See [`data/README.md`](./data/README.md) for the full schema — short version:
drop a `.json` file into `data/question-banks/` matching the documented
schema, commit, and push. No code changes needed; Vercel rebuilds
automatically and the new bank shows up in the app.

## Deploying

1. Push this repo to GitHub.
2. Import it on [vercel.com/new](https://vercel.com/new) — Vercel auto-detects
   Next.js, no config needed.
3. Every push to your main branch redeploys automatically, including new
   question bank files.

## Feature notes

- **Bookmarks**: star any question during a quiz or review; "Bookmarked
  questions" on the dashboard starts an untimed practice session from
  everything you've flagged.
- **Spaced repetition**: every answer updates a simple 5-box Leitner
  schedule per question. Wrong/unanswered resets to "due now"; correct
  pushes it further out. "Due for review" on the dashboard pulls whatever's
  currently due.
- **Insights**: streak tracker, an accuracy heatmap by subject/topic
  (weakest first), and a score-trend sparkline — all computed from your
  local history, no extra tracking needed.
- **Keyboard shortcuts** (while taking or reviewing a quiz): `←`/`→` or
  `P`/`N` to navigate, `1`–`9` to select an option, `M` to mark for review,
  `C` to clear a response.
- **Mock-test presets**: in the test composer, "UPSC Prelims — GS Paper I"
  and "— CSAT Paper II" one-click-fill the question count, 120-minute timer,
  and negative marking toggle to match the real exam structure. The actual
  marks/penalty per question still come from how you authored that bank.

## Notes on data persistence

Quiz history, bookmarks, spaced-repetition progress, and in-progress drafts
all live in `localStorage`, scoped to one browser on one device. There's no
account system and nothing is sent to a server. Use **History → Export as
JSON** to back up your attempt history if you want it outside the browser
(e.g. before clearing site data, or to move to a different device/browser).

## Project structure

```
app/                  Next.js routes (pages + API routes for reading banks)
components/           UI components (the quiz flow lives mostly in AppShell.tsx)
lib/                  Types, scoring, composer, spaced repetition, insights, localStorage helpers
data/question-banks/  Your question bank JSON files — add more here
```
