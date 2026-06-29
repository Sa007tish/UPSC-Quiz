import fs from "fs";
import path from "path";
import type { Difficulty, QuestionBank, QuestionBankMeta } from "./types";

const BANKS_DIR = path.join(process.cwd(), "data", "question-banks");

function emptyBreakdown(): Record<Difficulty, number> {
  return { easy: 0, medium: 0, hard: 0 };
}

/** Reads and parses every *.json file in /data/question-banks. Invalid files are skipped with a console warning rather than crashing the build. */
export function loadAllBanks(): QuestionBank[] {
  if (!fs.existsSync(BANKS_DIR)) {
    console.error(
      `[question-banks] Directory not found: ${BANKS_DIR}. ` +
        `If this is happening on Vercel but not locally, the JSON files likely weren't included in the deployed function — see outputFileTracingIncludes in next.config.js.`
    );
    return [];
  }

  const files = fs.readdirSync(BANKS_DIR).filter((f) => f.endsWith(".json"));
  if (files.length === 0) {
    console.error(`[question-banks] ${BANKS_DIR} exists but contains no .json files.`);
  }
  const banks: QuestionBank[] = [];

  for (const file of files) {
    const fullPath = path.join(BANKS_DIR, file);
    try {
      const raw = fs.readFileSync(fullPath, "utf-8");
      const parsed = JSON.parse(raw) as QuestionBank;

      if (!parsed.bankId || !Array.isArray(parsed.questions)) {
        console.warn(`[question-banks] Skipping ${file}: missing bankId or questions[]`);
        continue;
      }
      banks.push(parsed);
    } catch (err) {
      console.warn(`[question-banks] Skipping ${file}: failed to parse JSON`, err);
    }
  }

  return banks;
}

export function loadBankById(bankId: string): QuestionBank | null {
  // Avoid loading every file when we only need one — try the conventional filename first.
  const direct = path.join(BANKS_DIR, `${bankId}.json`);
  if (fs.existsSync(direct)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(direct, "utf-8")) as QuestionBank;
      if (parsed.bankId === bankId) return parsed;
    } catch {
      // fall through to full scan
    }
  }
  return loadAllBanks().find((b) => b.bankId === bankId) ?? null;
}

export function toMeta(bank: QuestionBank): QuestionBankMeta {
  const breakdown = emptyBreakdown();
  const tagSet = new Set<string>();
  for (const q of bank.questions) {
    if (q.difficulty in breakdown) breakdown[q.difficulty] += 1;
    for (const t of q.tags ?? []) tagSet.add(t);
  }
  return {
    bankId: bank.bankId,
    subject: bank.subject,
    topic: bank.topic,
    subtopic: bank.subtopic,
    source: bank.source,
    examYear: bank.examYear ?? null,
    questionCount: bank.questions.length,
    difficultyBreakdown: breakdown,
    tags: Array.from(tagSet).sort(),
  };
}

export function loadAllBankMeta(): QuestionBankMeta[] {
  return loadAllBanks().map(toMeta);
}
