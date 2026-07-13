"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { questions, type Question } from "@/lib/sat-questions";
import { Timer } from "@/components/sat/Timer";
import { Highlightable } from "@/components/sat/Highlightable";
import { DesmosPanel } from "@/components/sat/DesmosPanel";
import { ReferenceSheet } from "@/components/sat/ReferenceSheet";

type QuestionState = {
  selected?: "A" | "B" | "C" | "D";
  marked: boolean;
  eliminated: Record<string, boolean>;
};

export default function TestPage() {
  const [idx, setIdx] = useState(0);
  const [states, setStates] = useState<Record<number, QuestionState>>(() =>
    Object.fromEntries(questions.map((q) => [q.id, { marked: false, eliminated: {} }])),
  );
  const [eliminatorOn, setEliminatorOn] = useState(false);
  const [showDesmos, setShowDesmos] = useState(false);
  const [showRef, setShowRef] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [pinNav, setPinNav] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("librePinNav") === "1";
  });

  useEffect(() => {
    localStorage.setItem("librePinNav", pinNav ? "1" : "0");
  }, [pinNav]);

  const q = questions[idx];
  const state = states[q.id];
  const isMath = useMemo(() => !q.passage, [q]);

  const update = (patch: Partial<QuestionState>) =>
    setStates((s) => ({ ...s, [q.id]: { ...s[q.id], ...patch } }));

  const select = (letter: "A" | "B" | "C" | "D") => {
    if (state.eliminated[letter]) return;
    update({ selected: state.selected === letter ? undefined : letter });
  };
  const toggleEliminate = (letter: "A" | "B" | "C" | "D") => {
    const next = { ...state.eliminated, [letter]: !state.eliminated[letter] };
    update({
      eliminated: next,
      selected: state.selected === letter && next[letter] ? undefined : state.selected,
    });
  };

  return (
    <div className="flex h-screen flex-col bg-background font-sans text-foreground">
      {/* Header */}
      <header className="relative border-b border-foreground/15 px-6 py-3">
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-start gap-3">
            <Link href="/" aria-label="Home" className="text-lg font-semibold">
              LibrePrep
            </Link>
            <div>
              <h1 className="text-lg font-semibold">
                Section 1, Module 1: {isMath ? "Math" : "Reading and Writing"}
              </h1>
              <button className="mt-1 text-sm text-foreground/80 hover:underline">
                Directions ⌄
              </button>
            </div>
          </div>

          <Timer />

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setShowRef((v) => !v)}
              className="flex flex-col items-center text-foreground/80 hover:text-foreground"
              aria-label="Reference"
            >
              <RefIcon />
              <span className="mt-0.5">Reference</span>
            </button>
            <button
              onClick={() => setShowDesmos((v) => !v)}
              className="flex flex-col items-center text-foreground/80 hover:text-foreground"
              aria-label="Calculator"
            >
              <CalcIcon />
              <span className="mt-0.5">Calculator</span>
            </button>
            <button
              onClick={() => setPinNav((v) => !v)}
              className={`flex flex-col items-center hover:text-foreground ${
                pinNav ? "text-[#0b5cd6]" : "text-foreground/80"
              }`}
              aria-label="Pin question navigator"
              title="Always show question navigator on bottom-left"
            >
              <PinIcon />
              <span className="mt-0.5">{pinNav ? "Unpin Nav" : "Pin Nav"}</span>
            </button>
          </div>
        </div>
        <div className="absolute inset-x-0 -bottom-px h-[3px] bg-[repeating-linear-gradient(90deg,#d1d5db_0_10px,transparent_10px_16px,#facc15_16px_26px,transparent_26px_32px,#60a5fa_32px_42px,transparent_42px_48px)]" />
      </header>

      {/* Body */}
      <main className="flex flex-1 overflow-hidden">
        {q.passage ? (
          <>
            <section className="w-1/2 overflow-y-auto border-r border-foreground/15 px-10 py-8">
              <Highlightable>
                <p className="font-serif text-[17px] leading-[1.7] text-foreground">{q.passage}</p>
              </Highlightable>
            </section>
            <QuestionPane
              q={q}
              state={state}
              eliminatorOn={eliminatorOn}
              setEliminatorOn={setEliminatorOn}
              onMark={() => update({ marked: !state.marked })}
              onSelect={select}
              onEliminate={toggleEliminate}
            />
          </>
        ) : (
          <div className="mx-auto w-full max-w-3xl overflow-y-auto px-10 py-8">
            <QuestionPane
              q={q}
              state={state}
              eliminatorOn={eliminatorOn}
              setEliminatorOn={setEliminatorOn}
              onMark={() => update({ marked: !state.marked })}
              onSelect={select}
              onEliminate={toggleEliminate}
              fullWidth
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative border-t border-foreground/15 bg-background px-6 py-3">
        <div className="absolute inset-x-0 top-0 h-[3px] bg-[repeating-linear-gradient(90deg,#d1d5db_0_10px,transparent_10px_16px,#facc15_16px_26px,transparent_26px_32px,#60a5fa_32px_42px,transparent_42px_48px)]" />
        <div className="flex items-center justify-between">
          <div className="w-32 text-sm font-medium">Student</div>
          <button
            onClick={() => setShowNav((v) => !v)}
            className="flex items-center gap-2 rounded-md bg-foreground px-5 py-2 text-sm font-medium text-background"
          >
            Question {idx + 1} of {questions.length}
            <span className="text-xs">▲</span>
          </button>
          <div className="flex w-32 justify-end gap-2">
            {idx > 0 && (
              <button
                onClick={() => setIdx((i) => i - 1)}
                className="rounded-full bg-[#0b5cd6] px-5 py-2 text-sm font-semibold text-white hover:bg-[#094bb0]"
              >
                Back
              </button>
            )}
            <button
              onClick={() => setIdx((i) => Math.min(i + 1, questions.length - 1))}
              className="rounded-full bg-[#0b5cd6] px-6 py-2 text-sm font-semibold text-white hover:bg-[#094bb0]"
            >
              Next
            </button>
          </div>
        </div>

        {showNav && !pinNav && (
          <div className="absolute bottom-16 left-1/2 w-[520px] -translate-x-1/2 rounded-xl border border-border bg-card p-4 shadow-2xl">
            <NavGrid
              current={idx}
              states={states}
              onPick={(i) => {
                setIdx(i);
                setShowNav(false);
              }}
            />
          </div>
        )}
      </footer>

      {pinNav && (
        <div className="fixed bottom-20 left-4 z-40 w-64 rounded-xl border border-border bg-card p-3 shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold">Question Navigator</span>
            <button
              onClick={() => setPinNav(false)}
              className="text-xs text-foreground/60 hover:text-foreground"
              aria-label="Unpin"
            >
              ✕
            </button>
          </div>
          <NavGrid current={idx} states={states} onPick={(i) => setIdx(i)} compact />
        </div>
      )}

      {showDesmos && <DesmosPanel onClose={() => setShowDesmos(false)} />}
      {showRef && <ReferenceSheet onClose={() => setShowRef(false)} />}
    </div>
  );
}

function NavGrid({
  current,
  states,
  onPick,
  compact,
}: {
  current: number;
  states: Record<number, QuestionState>;
  onPick: (i: number) => void;
  compact?: boolean;
}) {
  return (
    <>
      {!compact && (
        <div className="mb-3 text-sm font-semibold">Section 1 Question Navigator</div>
      )}
      <div className={`grid gap-2 ${compact ? "grid-cols-5" : "grid-cols-8"}`}>
        {questions.map((qq, i) => {
          const s = states[qq.id];
          const answered = !!s.selected;
          return (
            <button
              key={qq.id}
              onClick={() => onPick(i)}
              className={`relative rounded-md border py-2 text-sm ${
                i === current
                  ? "border-foreground ring-2 ring-foreground/40"
                  : "border-dashed border-foreground/40"
              } ${answered ? "border-solid bg-[#0b5cd6] text-white" : "bg-background"}`}
            >
              {i + 1}
              {s.marked && <span className="absolute -right-1 -top-1 text-[10px]">🚩</span>}
            </button>
          );
        })}
      </div>
    </>
  );
}

function QuestionPane({
  q,
  state,
  eliminatorOn,
  setEliminatorOn,
  onMark,
  onSelect,
  onEliminate,
  fullWidth,
}: {
  q: Question;
  state: QuestionState;
  eliminatorOn: boolean;
  setEliminatorOn: (v: boolean) => void;
  onMark: () => void;
  onSelect: (l: "A" | "B" | "C" | "D") => void;
  onEliminate: (l: "A" | "B" | "C" | "D") => void;
  fullWidth?: boolean;
}) {
  return (
    <section className={`overflow-y-auto px-10 py-8 ${fullWidth ? "" : "w-1/2"}`}>
      <div className="mx-auto max-w-xl">
        <div className="flex items-center justify-between rounded-t-md bg-muted px-3 py-2">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center bg-foreground text-sm font-semibold text-background">
              {q.id}
            </span>
            <button
              onClick={onMark}
              className="flex items-center gap-1.5 text-sm font-medium text-foreground"
            >
              <span className={state.marked ? "text-red-500" : "text-foreground"}>
                {state.marked ? "🚩" : "🔖"}
              </span>
              Mark for Review
            </button>
          </div>
          <button
            onClick={() => setEliminatorOn(!eliminatorOn)}
            className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold ${
              eliminatorOn
                ? "bg-foreground text-background"
                : "text-foreground hover:bg-foreground/10"
            }`}
            aria-label="Toggle answer eliminator"
          >
            <span className="rounded border border-current px-1 leading-none">
              <span className="line-through">ABC</span>
            </span>
          </button>
        </div>

        <div className="border-t border-border pt-6">
          <Highlightable>
            <p className="font-serif text-[17px] leading-[1.6] text-foreground">{q.prompt}</p>
          </Highlightable>

          <div className="mt-6 space-y-3">
            {q.choices.map((c) => {
              const eliminated = !!state.eliminated[c.letter];
              const selected = state.selected === c.letter;
              return (
                <div key={c.letter} className="flex items-center gap-2">
                  <button
                    onClick={() => onSelect(c.letter)}
                    disabled={eliminated}
                    className={`flex flex-1 items-center gap-3 rounded-lg border px-4 py-3 text-left transition ${
                      selected
                        ? "border-[#0b5cd6] bg-[#0b5cd6]/5 ring-2 ring-[#0b5cd6]"
                        : "border-foreground/30 hover:border-foreground/60"
                    } ${eliminated ? "opacity-40" : ""}`}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full border text-sm font-medium ${
                        selected
                          ? "border-[#0b5cd6] bg-[#0b5cd6] text-white"
                          : "border-foreground/40"
                      }`}
                    >
                      {c.letter}
                    </span>
                    <span
                      className={`font-serif text-[16px] ${eliminated ? "line-through" : ""}`}
                    >
                      {c.text}
                    </span>
                  </button>
                  {eliminatorOn && (
                    <button
                      onClick={() => onEliminate(c.letter)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/40 text-sm font-semibold hover:bg-foreground/5"
                      aria-label={`Eliminate ${c.letter}`}
                      title={eliminated ? "Undo eliminate" : "Eliminate"}
                    >
                      {eliminated ? "↺" : <span className="line-through">{c.letter}</span>}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function RefIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h12a2 2 0 012 2v14H6a2 2 0 01-2-2V4z" />
      <path d="M8 8h6M8 12h6M8 16h4" />
    </svg>
  );
}
function CalcIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" />
    </svg>
  );
}
function PinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 17v5" />
      <path d="M9 10.76V5a1 1 0 011-1h4a1 1 0 011 1v5.76a2 2 0 001.11 1.79l1.78.89A2 2 0 0118 15.24V16a1 1 0 01-1 1H7a1 1 0 01-1-1v-.76a2 2 0 011.11-1.79l1.78-.89A2 2 0 009 10.76z" />
    </svg>
  );
}
