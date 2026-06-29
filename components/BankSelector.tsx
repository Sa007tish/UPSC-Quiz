"use client";

import { useMemo, useState } from "react";
import type { QuestionBankMeta } from "@/lib/types";

export function BankSelector({
  banks,
  selectedIds,
  onChangeSelected,
  onContinue,
}: {
  banks: QuestionBankMeta[];
  selectedIds: string[];
  onChangeSelected: (ids: string[]) => void;
  onContinue: () => void;
}) {
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [groupBy, setGroupBy] = useState<"subject" | "topic">("subject");

  const subjects = useMemo(() => Array.from(new Set(banks.map((b) => b.subject))).sort(), [banks]);
  const allTags = useMemo(() => Array.from(new Set(banks.flatMap((b) => b.tags))).sort(), [banks]);
  const sources = useMemo(() => Array.from(new Set(banks.map((b) => b.source))).sort(), [banks]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return banks.filter((b) => {
      if (subjectFilter && b.subject !== subjectFilter) return false;
      if (tagFilter && !b.tags.includes(tagFilter)) return false;
      if (sourceFilter && b.source !== sourceFilter) return false;
      if (!q) return true;
      return (
        b.subject.toLowerCase().includes(q) ||
        b.topic.toLowerCase().includes(q) ||
        (b.subtopic ?? "").toLowerCase().includes(q)
      );
    });
  }, [banks, search, subjectFilter, tagFilter, sourceFilter]);

  const grouped = useMemo(() => {
    const groups = new Map<string, QuestionBankMeta[]>();
    for (const b of filtered) {
      const key = groupBy === "subject" ? b.subject : b.topic;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(b);
    }
    return Array.from(groups.entries());
  }, [filtered, groupBy]);

  const selectedSet = new Set(selectedIds);
  const selectedBanks = banks.filter((b) => selectedSet.has(b.bankId));
  const totalQuestions = selectedBanks.reduce((sum, b) => sum + b.questionCount, 0);

  function toggle(bankId: string) {
    if (selectedSet.has(bankId)) {
      onChangeSelected(selectedIds.filter((id) => id !== bankId));
    } else {
      onChangeSelected([...selectedIds, bankId]);
    }
  }

  if (banks.length === 0) {
    return (
      <EmptyState
        title="No question banks yet"
        body="Add a .json file to /data/question-banks in the repo, following the schema in data/README.md, then commit and push — it'll show up here automatically once Vercel redeploys."
      />
    );
  }

  return (
    <div className="space-y-5 pb-28">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subject, topic, or subtopic\u2026"
            className="w-full rounded-lg border border-ink/15 bg-white px-3.5 py-2.5 text-sm shadow-soft outline-none focus:border-indigo-400 dark:border-white/15 dark:bg-white/5 dark:text-ink-dark"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-ink/15 bg-white p-1 text-xs dark:border-white/15 dark:bg-white/5">
          {(["subject", "topic"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGroupBy(g)}
              className={`rounded-md px-2.5 py-1.5 font-medium capitalize transition ${
                groupBy === g ? "bg-indigo-500 text-white" : "text-ink/60 dark:text-ink-dark/60"
              }`}
            >
              Group by {g}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip active={subjectFilter === null} onClick={() => setSubjectFilter(null)} label="All subjects" />
        {subjects.map((s) => (
          <Chip key={s} active={subjectFilter === s} onClick={() => setSubjectFilter(s)} label={s} />
        ))}
      </div>

      {sources.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <Chip active={sourceFilter === null} onClick={() => setSourceFilter(null)} label="Any source" />
          {sources.map((s) => (
            <Chip key={s} active={sourceFilter === s} onClick={() => setSourceFilter(s)} label={s} />
          ))}
        </div>
      )}

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tagFilter && (
            <Chip active onClick={() => setTagFilter(null)} label={`#${tagFilter} \u00d7`} />
          )}
          {!tagFilter &&
            allTags.slice(0, 12).map((t) => (
              <button
                key={t}
                onClick={() => setTagFilter(t)}
                type="button"
                className="rounded-full border border-dashed border-ink/15 px-2.5 py-1 text-[11px] text-ink/45 transition hover:border-ink/30 hover:text-ink/70 dark:border-white/15 dark:text-ink-dark/45 dark:hover:text-ink-dark/70"
              >
                #{t}
              </button>
            ))}
        </div>
      )}

      {grouped.map(([groupName, groupBanks]) => (
        <div key={groupName}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/45 dark:text-ink-dark/45">
            {groupName} &middot; {groupBanks.length} bank{groupBanks.length !== 1 ? "s" : ""}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {groupBanks.map((b) => (
              <BankCard key={b.bankId} bank={b} selected={selectedSet.has(b.bankId)} onToggle={() => toggle(b.bankId)} />
            ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <EmptyState title="No banks match your filters" body="Try clearing the search or selecting a different subject." />
      )}

      {selectedBanks.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-white/95 px-4 py-3.5 backdrop-blur dark:border-white/10 dark:bg-[#15171C]/95">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
            <p className="text-sm text-ink/70 dark:text-ink-dark/70">
              <span className="font-mono font-semibold text-ink dark:text-ink-dark">{selectedBanks.length}</span> bank
              {selectedBanks.length !== 1 ? "s" : ""} selected &middot;{" "}
              <span className="font-mono font-semibold text-ink dark:text-ink-dark">{totalQuestions}</span> questions
              available
            </p>
            <button
              onClick={onContinue}
              className="rounded-lg bg-saffron-500 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-saffron-600"
            >
              Continue to test setup \u2192
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BankCard({
  bank,
  selected,
  onToggle,
}: {
  bank: QuestionBankMeta;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      type="button"
      className={`flex items-start gap-3 rounded-xl2 border p-4 text-left shadow-soft transition ${
        selected
          ? "border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-900/20"
          : "border-ink/10 bg-white hover:border-indigo-300 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-indigo-500/50"
      }`}
    >
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
          selected ? "border-indigo-500 bg-indigo-500 text-white" : "border-ink/25 dark:border-white/25"
        }`}
      >
        {selected && (
          <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
            <path d="M5 12l5 5L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <div className="flex-1">
        <p className="font-medium text-ink dark:text-ink-dark">{bank.topic}</p>
        {bank.subtopic && <p className="text-xs text-ink/55 dark:text-ink-dark/55">{bank.subtopic}</p>}
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="rounded-full bg-ink/5 px-2 py-0.5 font-mono text-ink/60 dark:bg-white/10 dark:text-ink-dark/60">
            {bank.questionCount} Qs
          </span>
          {bank.source !== "AI-generated" && (
            <span className="rounded-full bg-saffron-100 px-2 py-0.5 font-medium text-saffron-700 dark:bg-saffron-900/30 dark:text-saffron-300">
              {bank.source}
              {bank.examYear ? ` \u2019${String(bank.examYear).slice(2)}` : ""}
            </span>
          )}
          <DifficultyDots breakdown={bank.difficultyBreakdown} />
        </div>
        {bank.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {bank.tags.slice(0, 3).map((t) => (
              <span key={t} className="text-[10px] text-ink/35 dark:text-ink-dark/35">
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

function DifficultyDots({ breakdown }: { breakdown: QuestionBankMeta["difficultyBreakdown"] }) {
  return (
    <span className="flex items-center gap-1 text-ink/40 dark:text-ink-dark/40">
      <span title={`${breakdown.easy} easy`} className="flex items-center gap-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
        {breakdown.easy}
      </span>
      <span title={`${breakdown.medium} medium`} className="flex items-center gap-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        {breakdown.medium}
      </span>
      <span title={`${breakdown.hard} hard`} className="flex items-center gap-0.5">
        <span className="h-1.5 w-1.5 rounded-full bg-coral-400" />
        {breakdown.hard}
      </span>
    </span>
  );
}

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "bg-ink text-white dark:bg-white dark:text-ink"
          : "bg-white text-ink/60 border border-ink/12 hover:border-ink/25 dark:bg-white/5 dark:text-ink-dark/60 dark:border-white/12"
      }`}
    >
      {label}
    </button>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl2 border border-dashed border-ink/15 bg-white/50 p-8 text-center dark:border-white/15 dark:bg-white/[0.02]">
      <p className="font-medium text-ink dark:text-ink-dark">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink/55 dark:text-ink-dark/55">{body}</p>
    </div>
  );
}
