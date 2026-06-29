"use client";

import { useMemo, useState } from "react";
import type { ComposerConfig, Difficulty, QuestionBankMeta, QuestionSource, SelectionMode } from "@/lib/types";

const TIME_PRESETS = [15, 30, 60, 120];
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

const MOCK_PRESETS: { label: string; questionCount: number; timeLimitMinutes: number; note: string }[] = [
  { label: "UPSC Prelims \u2014 GS Paper I", questionCount: 100, timeLimitMinutes: 120, note: "100 Qs \u00b7 120 min" },
  { label: "UPSC Prelims \u2014 CSAT Paper II", questionCount: 80, timeLimitMinutes: 120, note: "80 Qs \u00b7 120 min \u00b7 qualifying" },
];

export function ComposerPanel({
  selectedBanks,
  onBack,
  onStart,
}: {
  selectedBanks: QuestionBankMeta[];
  onBack: () => void;
  onStart: (config: Omit<ComposerConfig, "bankIds">) => void;
}) {
  const [mode, setMode] = useState<SelectionMode>("as-is");
  const [difficulties, setDifficulties] = useState<Difficulty[]>(["easy", "medium", "hard"]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<QuestionSource[]>([]);
  const [questionCount, setQuestionCount] = useState(20);
  const [shuffle, setShuffle] = useState(true);
  const [timed, setTimed] = useState(false);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(30);
  const [negativeMarkingEnabled, setNegativeMarkingEnabled] = useState(false);

  const availableTags = useMemo(() => Array.from(new Set(selectedBanks.flatMap((b) => b.tags))).sort(), [selectedBanks]);
  const availableSources = useMemo(() => Array.from(new Set(selectedBanks.map((b) => b.source))), [selectedBanks]);

  const totalAvailable = useMemo(
    () => selectedBanks.reduce((sum, b) => sum + b.questionCount, 0),
    [selectedBanks]
  );

  const availableForDifficulty = useMemo(
    () =>
      selectedBanks.reduce(
        (sum, b) => sum + difficulties.reduce((s, d) => s + b.difficultyBreakdown[d], 0),
        0
      ),
    [selectedBanks, difficulties]
  );

  const hasNegativeMarkingConfigured = useMemo(
    () => selectedBanks.length > 0, // banks may or may not have it set; the toggle is a global on/off
    [selectedBanks]
  );

  function toggleDifficulty(d: Difficulty) {
    setDifficulties((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  function toggleTag(t: string) {
    setSelectedTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function toggleSource(s: QuestionSource) {
    setSelectedSources((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  function applyMockPreset(preset: (typeof MOCK_PRESETS)[number]) {
    setMode("composed");
    setDifficulties(["easy", "medium", "hard"]);
    setSelectedTags([]);
    setSelectedSources([]);
    setQuestionCount(preset.questionCount);
    setShuffle(true);
    setTimed(true);
    setTimeLimitMinutes(preset.timeLimitMinutes);
    setNegativeMarkingEnabled(true);
  }

  function handleStart() {
    onStart({
      mode,
      questionCount: mode === "composed" ? Math.min(questionCount, availableForDifficulty) : undefined,
      difficulties: mode === "composed" ? difficulties : undefined,
      tags: mode === "composed" && selectedTags.length > 0 ? selectedTags : undefined,
      sources: mode === "composed" && selectedSources.length > 0 ? selectedSources : undefined,
      shuffle: mode === "composed" ? shuffle : false,
      timed,
      timeLimitMinutes: timed ? timeLimitMinutes : undefined,
      negativeMarkingEnabled,
    });
  }

  const canStart = mode === "as-is" ? totalAvailable > 0 : availableForDifficulty > 0 && difficulties.length > 0;

  return (
    <div className="space-y-6 pb-28">
      <button onClick={onBack} className="text-sm font-medium text-ink/55 hover:text-ink dark:text-ink-dark/55 dark:hover:text-ink-dark">
        \u2190 Back to bank selection
      </button>

      <Section title="Selected banks">
        <div className="flex flex-wrap gap-2">
          {selectedBanks.map((b) => (
            <span
              key={b.bankId}
              className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
            >
              {b.topic} ({b.questionCount})
            </span>
          ))}
        </div>
      </Section>

      <Section title="Quick presets">
        <div className="grid gap-3 sm:grid-cols-2">
          {MOCK_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => applyMockPreset(preset)}
              type="button"
              className="rounded-xl border border-ink/12 p-4 text-left transition hover:border-saffron-300 hover:bg-saffron-50/50 dark:border-white/12 dark:hover:border-saffron-500/50 dark:hover:bg-saffron-900/10"
            >
              <p className="font-medium text-ink dark:text-ink-dark">{preset.label}</p>
              <p className="mt-1 text-xs text-ink/55 dark:text-ink-dark/55">{preset.note} &middot; negative marking on</p>
            </button>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink/40 dark:text-ink-dark/40">
          Presets set the test structure (count, time, negative marking on). Each question's actual marks and
          penalty still come from how you authored its bank.
        </p>
      </Section>

      <Section title="How should questions be selected?">
        <div className="grid gap-3 sm:grid-cols-2">
          <ModeCard
            active={mode === "as-is"}
            onClick={() => setMode("as-is")}
            title="Use banks as-is"
            description={`Every question from the selected bank${selectedBanks.length > 1 ? "s" : ""}, in order. ${totalAvailable} questions total.`}
          />
          <ModeCard
            active={mode === "composed"}
            onClick={() => setMode("composed")}
            title="Build a custom test"
            description="Pick how many questions and at what difficulty, sampled across the selected banks."
          />
        </div>
      </Section>

      {mode === "composed" && (
        <Section title="Custom test settings">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink/75 dark:text-ink-dark/75">Difficulty</label>
              <div className="flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    onClick={() => toggleDifficulty(d)}
                    type="button"
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition ${
                      difficulties.includes(d)
                        ? "bg-ink text-white dark:bg-white dark:text-ink"
                        : "border border-ink/15 text-ink/50 dark:border-white/15 dark:text-ink-dark/50"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-ink/45 dark:text-ink-dark/45">
                {availableForDifficulty} question{availableForDifficulty !== 1 ? "s" : ""} match this filter.
              </p>
            </div>

            <div>
              <label htmlFor="qcount" className="mb-1.5 block text-sm font-medium text-ink/75 dark:text-ink-dark/75">
                Number of questions
              </label>
              <input
                id="qcount"
                type="number"
                min={1}
                max={Math.max(availableForDifficulty, 1)}
                value={questionCount}
                onChange={(e) => setQuestionCount(Math.max(1, Number(e.target.value) || 1))}
                className="w-32 rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-indigo-400 dark:border-white/15 dark:bg-white/5"
              />
            </div>

            <Toggle
              checked={shuffle}
              onChange={setShuffle}
              label="Randomize question order"
              description="If off, questions keep their original bank order."
            />

            {availableSources.length > 1 && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink/75 dark:text-ink-dark/75">Source</label>
                <div className="flex flex-wrap gap-2">
                  {availableSources.map((s) => (
                    <button
                      key={s}
                      onClick={() => toggleSource(s)}
                      type="button"
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                        selectedSources.includes(s)
                          ? "bg-ink text-white dark:bg-white dark:text-ink"
                          : "border border-ink/15 text-ink/50 dark:border-white/15 dark:text-ink-dark/50"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-ink/45 dark:text-ink-dark/45">No selection = any source.</p>
              </div>
            )}

            {availableTags.length > 0 && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink/75 dark:text-ink-dark/75">Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {availableTags.map((t) => (
                    <button
                      key={t}
                      onClick={() => toggleTag(t)}
                      type="button"
                      className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                        selectedTags.includes(t)
                          ? "bg-indigo-500 text-white"
                          : "border border-dashed border-ink/15 text-ink/50 dark:border-white/15 dark:text-ink-dark/50"
                      }`}
                    >
                      #{t}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs text-ink/45 dark:text-ink-dark/45">
                  No selection = any tag. Exact question counts are checked when the test starts.
                </p>
              </div>
            )}
          </div>
        </Section>
      )}

      <Section title="Timing">
        <Toggle
          checked={timed}
          onChange={setTimed}
          label="Timed quiz"
          description="Sets an overall countdown that auto-submits the test when it runs out. An elapsed-time clock always runs regardless."
        />
        {timed && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {TIME_PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setTimeLimitMinutes(p)}
                type="button"
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  timeLimitMinutes === p
                    ? "bg-saffron-500 text-white"
                    : "border border-ink/15 text-ink/60 dark:border-white/15 dark:text-ink-dark/60"
                }`}
              >
                {p} min
              </button>
            ))}
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(Math.max(1, Number(e.target.value) || 1))}
                className="w-20 rounded-lg border border-ink/15 bg-white px-2.5 py-1.5 text-sm font-mono outline-none focus:border-indigo-400 dark:border-white/15 dark:bg-white/5"
              />
              <span className="text-xs text-ink/50 dark:text-ink-dark/50">min (custom)</span>
            </div>
          </div>
        )}
      </Section>

      <Section title="Marking scheme">
        <Toggle
          checked={negativeMarkingEnabled}
          onChange={setNegativeMarkingEnabled}
          label="Enable negative marking"
          description="Off by default. When on, wrong answers deduct marks using each question's configured penalty (set per question bank)."
        />
        {negativeMarkingEnabled && !hasNegativeMarkingConfigured && (
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
            Note: banks without a configured penalty will simply deduct 0 — set defaultNegativeMarkingRatio in the bank's JSON to change that.
          </p>
        )}
      </Section>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-white/95 px-4 py-3.5 backdrop-blur dark:border-white/10 dark:bg-[#15171C]/95">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <p className="text-sm text-ink/70 dark:text-ink-dark/70">
            Ready to start a{" "}
            <span className="font-mono font-semibold text-ink dark:text-ink-dark">
              {mode === "as-is" ? totalAvailable : Math.min(questionCount, availableForDifficulty)}
            </span>{" "}
            question test
            {timed ? ` \u00b7 ${timeLimitMinutes} min` : ""}
          </p>
          <button
            onClick={handleStart}
            disabled={!canStart}
            className="rounded-lg bg-saffron-500 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-saffron-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start test \u2192
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl2 border border-ink/10 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
      <h3 className="mb-3 text-sm font-semibold text-ink dark:text-ink-dark">{title}</h3>
      {children}
    </div>
  );
}

function ModeCard({
  active,
  onClick,
  title,
  description,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  description: string;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`rounded-xl border p-4 text-left transition ${
        active
          ? "border-indigo-400 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-900/20"
          : "border-ink/12 hover:border-indigo-300 dark:border-white/12 dark:hover:border-indigo-500/50"
      }`}
    >
      <p className="font-medium text-ink dark:text-ink-dark">{title}</p>
      <p className="mt-1 text-xs text-ink/55 dark:text-ink-dark/55">{description}</p>
    </button>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition ${
          checked ? "bg-teal-500" : "bg-ink/15 dark:bg-white/15"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-[18px]" : "translate-x-0.5"
          }`}
        />
      </button>
      <span>
        <span className="block text-sm font-medium text-ink dark:text-ink-dark">{label}</span>
        {description && <span className="block text-xs text-ink/50 dark:text-ink-dark/50">{description}</span>}
      </span>
    </label>
  );
}
