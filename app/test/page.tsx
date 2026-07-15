"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sections } from "@/lib/sat-filters";
import { Highlightable } from "@/components/sat/Highlightable";
import { DesmosPanel } from "@/components/sat/DesmosPanel";
import { ReferenceSheet } from "@/components/sat/ReferenceSheet";
import { saveAnswers, loadAnswers, buildSessionKey } from "@/lib/idb";
import type { QuestionMeta, QuestionFull, QuestionState, AnswerStore } from "@/lib/types";

const BATCH_SIZE = 5;

type Phase = "loading" | "ready" | "error" | "empty";

const classNames = (() => {
  const m = new Map<string, string>();
  for (const sec of sections)
    for (const cls of sec.classes) m.set(cls.shortcode, cls.name);
  return m;
})();

const skillNames = (() => {
  const m = new Map<string, string>();
  for (const sec of sections)
    for (const cls of sec.classes)
      for (const sk of cls.skills) m.set(sk.shortcode, sk.name);
  return m;
})();

function TestPageInner() {
  const searchParams = useSearchParams();
  const subject = searchParams.get("subject") as "english" | "math" | null;
  const classesParam = searchParams.get("classes") ?? "";
  const skillsParam = searchParams.get("skills") ?? "";
  const difficultyParam = searchParams.get("difficulty") ?? "";
  const checkEnabled = searchParams.get("check") === "true";

  const classShortcodes = useMemo(() => classesParam.split(",").filter(Boolean), [classesParam]);
  const skillShortcodes = useMemo(() => skillsParam.split(",").filter(Boolean), [skillsParam]);
  const difficultyValues = useMemo(() => difficultyParam.split(",").filter(Boolean), [difficultyParam]);

  const [phase, setPhase] = useState<Phase>(() => (subject ? "loading" : "error"));
  const [errorMsg, setErrorMsg] = useState(() =>
    subject ? "" : "No subject specified. Go back to the home page to start.",
  );
  const [questionIds, setQuestionIds] = useState<QuestionMeta[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerStore>({});
  const [loadedBatches, setLoadedBatches] = useState<Map<number, QuestionFull[]>>(new Map());
  const [eliminatorOn, setEliminatorOn] = useState(false);
  const [showDesmos, setShowDesmos] = useState(false);
  const [showRef, setShowRef] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const [showCheckPrompt, setShowCheckPrompt] = useState(false);
  const checkPromptDismissed = useRef(false);

  const sessionKey = useMemo(() => {
    if (typeof window === "undefined") return "";
    return buildSessionKey(searchParams);
  }, [searchParams]);

  // Load persisted answers
  useEffect(() => {
    if (!sessionKey) return;
    loadAnswers(sessionKey).then((saved) => {
      if (saved) setAnswers(saved);
    });
  }, [sessionKey]);

  // Persist answers
  useEffect(() => {
    if (!sessionKey || Object.keys(answers).length === 0) return;
    saveAnswers(sessionKey, answers);
  }, [sessionKey, answers]);

  // Check prompt after 20 answers
  const answeredCount = useMemo(
    () =>
      Object.values(answers).filter((a) => a.selected !== undefined || a.textAnswer).length,
    [answers],
  );

  useEffect(() => {
    if (answeredCount >= 20 && checkEnabled && !checkPromptDismissed.current) {
      setShowCheckPrompt(true);
    }
  }, [answeredCount, checkEnabled]);

  // Phase 1: fetch question IDs
  useEffect(() => {
    if (!subject) return;

    let cancelled = false;

    (async () => {
      try {
        let query = supabase
          .from("questions")
          .select("id, subject, primary_class_id, skill_id, question_type, difficulty, sat_question_id, primary_class:primary_classes!inner(shortcode), skill:skills!inner(shortcode)")
          .eq("subject", subject)
          .order("created_at", { ascending: true });

        if (classShortcodes.length > 0) {
          query = query.in("primary_classes.shortcode", classShortcodes);
        }
        if (skillShortcodes.length > 0) {
          query = query.in("skills.shortcode", skillShortcodes);
        }
        if (difficultyValues.length > 0 && difficultyValues.length < 3) {
          query = query.in("difficulty", difficultyValues as ("E" | "M" | "H")[]);
        }

        const { data, error } = await query;
        if (error) throw error;

        if (cancelled) return;

        if (!data || data.length === 0) {
          setPhase("empty");
          return;
        }

        setQuestionIds(data as QuestionMeta[]);
        setPhase("ready");

        // Pre-fetch the first batch
        const firstBatchIds = data.slice(0, BATCH_SIZE).map((q: QuestionMeta) => q.id);
        if (firstBatchIds.length > 0) {
          const { data: batchData } = await supabase
            .from("questions")
            .select("*, options(*)")
            .in("id", firstBatchIds);
          if (batchData && !cancelled) {
            const questions = (batchData as unknown as QuestionFull[]).sort(
              (a, b) => firstBatchIds.indexOf(a.id) - firstBatchIds.indexOf(b.id),
            );
            setLoadedBatches((prev) => {
              const next = new Map(prev);
              next.set(0, questions);
              return next;
            });
          }
        }
      } catch (err) {
        if (cancelled) return;
        setPhase("error");
        setErrorMsg(err instanceof Error ? err.message : "Failed to load questions.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [subject, classShortcodes, skillShortcodes, difficultyValues]);


  // Batch fetching - use functional update to avoid stale closures
  const fetchBatch = useCallback(
    async (batchIndex: number) => {
      const start = batchIndex * BATCH_SIZE;
      const ids = questionIds.slice(start, start + BATCH_SIZE).map((q) => q.id);
      if (ids.length === 0) return;

      try {
        const { data, error } = await supabase
          .from("questions")
          .select("*, options(*)")
          .in("id", ids);

        if (error) throw error;

        const questions = (data as unknown as QuestionFull[]).sort(
          (a, b) => ids.indexOf(a.id) - ids.indexOf(b.id),
        );

        setLoadedBatches((prev) => {
          if (prev.has(batchIndex)) return prev;
          const next = new Map(prev);
          next.set(batchIndex, questions);
          return next;
        });
      } catch (err) {
        console.error("Batch fetch error:", err);
      }
    },
    [questionIds],
  );

  const navigateTo = useCallback(
    (newIdx: number) => {
      if (newIdx >= 0 && newIdx < questionIds.length) {
        setIdx(newIdx);
        const batchIndex = Math.floor(newIdx / BATCH_SIZE);
        fetchBatch(batchIndex);
      }
    },
    [questionIds.length, fetchBatch],
  );

  const currentBatchIndex = Math.floor(idx / BATCH_SIZE);
  const currentBatch = loadedBatches.get(currentBatchIndex) ?? [];
  const localIdx = idx % BATCH_SIZE;
  const currentQuestion = currentBatch[localIdx] ?? null;
  const currentState: QuestionState = currentQuestion
    ? answers[currentQuestion.id] ?? { marked: false, eliminated: {} }
    : { marked: false, eliminated: {} };

  const updateAnswer = useCallback(
    (questionId: string, patch: Partial<QuestionState>) => {
      setAnswers((prev) => ({
        ...prev,
        [questionId]: { ...prev[questionId], marked: false, eliminated: {}, ...patch },
      }));
    },
    [],
  );

  const selectOption = useCallback(
    (letter: string) => {
      if (!currentQuestion) return;
      const state = answers[currentQuestion.id] ?? { marked: false, eliminated: {} };
      if (state.eliminated?.[letter]) return;
      const newSelected = state.selected === letter ? undefined : letter;
      updateAnswer(currentQuestion.id, { selected: newSelected, checked: undefined, correct: undefined });
    },
    [currentQuestion, answers, updateAnswer],
  );

  const toggleEliminate = useCallback(
    (letter: string) => {
      if (!currentQuestion) return;
      const state = answers[currentQuestion.id] ?? { marked: false, eliminated: {} };
      const newEliminated = { ...state.eliminated, [letter]: !state.eliminated?.[letter] };
      updateAnswer(currentQuestion.id, {
        eliminated: newEliminated,
        selected: state.selected === letter && newEliminated[letter] ? undefined : state.selected,
      });
    },
    [currentQuestion, answers, updateAnswer],
  );

  const checkAnswer = useCallback(
    (questionId: string) => {
      const state = answers[questionId];
      if (!state) return;
      const q = questionIds.find((qi) => qi.id === questionId);
      if (!q) return;

      let fullQ: QuestionFull | undefined;
      for (const batch of loadedBatches.values()) {
        fullQ = batch.find((bq) => bq.id === questionId);
        if (fullQ) break;
      }
      if (!fullQ) return;

      let correct = false;
      if (q.question_type === "mcq") {
        const correctOption = fullQ.options.find((o) => o.is_correct);
        correct = correctOption?.label === state.selected;
      } else {
        const text = (state.textAnswer ?? "").trim().toLowerCase();
        const accepted = (fullQ.accepted_answers as string[]) ?? [];
        correct = accepted.some((a) => a.trim().toLowerCase() === text);
      }

      updateAnswer(questionId, { checked: true, correct });
    },
    [answers, questionIds, loadedBatches, updateAnswer],
  );

  const handleCheck = useCallback(() => {
    if (!currentQuestion) return;
    checkAnswer(currentQuestion.id);
  }, [currentQuestion, checkAnswer]);

  const isCurrentBatchLoaded = loadedBatches.has(currentBatchIndex);

  if (phase === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-foreground border-t-transparent mx-auto" />
          <p className="text-sm text-foreground/60">Loading questions...</p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground mb-2">Something went wrong</p>
          <p className="text-sm text-foreground/60 mb-4">{errorMsg}</p>
          <Link href="/" className="rounded-full bg-[#0b5cd6] px-6 py-2 text-sm font-semibold text-white hover:bg-[#094bb0]">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (phase === "empty") {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg font-semibold text-foreground mb-2">No questions found</p>
          <p className="text-sm text-foreground/60 mb-4">Try adjusting your filters on the home page.</p>
          <Link href="/" className="rounded-full bg-[#0b5cd6] px-6 py-2 text-sm font-semibold text-white hover:bg-[#094bb0]">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const isMath = currentQuestion?.subject === "math";
  const hasStimulus = currentQuestion?.stimulus != null && currentQuestion.stimulus !== "";

  return (
    <div className="flex h-screen flex-col bg-background font-sans text-foreground">
      {/* Header */}
      <header className="relative border-b border-foreground/15 px-6 py-3">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center justify-center gap-3">
            <Link href="/" aria-label="Home" className="text-lg font-semibold">
              LibrePrep
            </Link>
            <div>
              <h1 className="text-lg font-semibold">
                {isMath ? "Math" : "Reading & Writing"}
              </h1>
            </div>
          </div>

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
          </div>
        </div>
        <div className="absolute inset-x-0 -bottom-px h-[3px] bg-[repeating-linear-gradient(90deg,#d1d5db_0_10px,transparent_10px_16px,#facc15_16px_26px,transparent_26px_32px,#60a5fa_32px_42px,transparent_42px_48px)]" />
      </header>

      {/* Body */}
      <main className="flex flex-1 overflow-hidden">
        {!isCurrentBatchLoaded || !currentQuestion ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-foreground border-t-transparent" />
          </div>
        ) : hasStimulus ? (
          <>
            <section className="w-1/2 overflow-y-auto border-r border-foreground/15 px-10 py-8">
              <Highlightable>
                <p className="font-serif text-[17px] leading-[1.7] text-foreground" dangerouslySetInnerHTML={{__html: currentQuestion.stimulus || ''}} />
              </Highlightable>
            </section>
            <QuestionPane
              q={currentQuestion}
              state={currentState}
              eliminatorOn={eliminatorOn}
              setEliminatorOn={setEliminatorOn}
              checkEnabled={checkEnabled}
              onMark={() =>
                updateAnswer(currentQuestion.id, {
                  marked: !currentState.marked,
                })
              }
              onSelect={selectOption}
              onEliminate={toggleEliminate}
              onCheck={handleCheck}
              onTextChange={(text) =>
                updateAnswer(currentQuestion.id, {
                  textAnswer: text,
                  checked: undefined,
                  correct: undefined,
                })
              }
            />
          </>
        ) : (
          <div className="mx-auto w-full max-w-3xl overflow-y-auto px-10 py-8">
            <QuestionPane
              q={currentQuestion}
              state={currentState}
              eliminatorOn={eliminatorOn}
              setEliminatorOn={setEliminatorOn}
              checkEnabled={checkEnabled}
              onMark={() =>
                updateAnswer(currentQuestion.id, {
                  marked: !currentState.marked,
                })
              }
              onSelect={selectOption}
              onEliminate={toggleEliminate}
              onCheck={handleCheck}
              onTextChange={(text) =>
                updateAnswer(currentQuestion.id, {
                  textAnswer: text,
                  checked: undefined,
                  correct: undefined,
                })
              }
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
            onClick={() => setShowNav(true)}
            className="flex items-center gap-2 rounded-md bg-foreground px-5 py-2 text-sm font-medium text-background"
          >
            Question {idx + 1} of {questionIds.length}
            <span className="text-xs">▲</span>
          </button>
          <div className="flex w-32 justify-end gap-2">
            {idx > 0 && (
              <button
                onClick={() => navigateTo(idx - 1)}
                className="rounded-full bg-[#0b5cd6] px-5 py-2 text-sm font-semibold text-white hover:bg-[#094bb0]"
              >
                Back
              </button>
            )}
            <button
              onClick={() => navigateTo(idx + 1)}
              disabled={idx >= questionIds.length - 1}
              className="rounded-full bg-[#0b5cd6] px-6 py-2 text-sm font-semibold text-white hover:bg-[#094bb0] disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </footer>

      {/* Navigator overlay */}
      {showNav && (
        <NavigatorOverlay
          questionIds={questionIds}
          answers={answers}
          currentIdx={idx}
          classNames={classNames}
          skillNames={skillNames}
          onClose={() => setShowNav(false)}
          onNavigate={(i) => {
            navigateTo(i);
            setShowNav(false);
          }}
          onCheck={checkAnswer}
          checkEnabled={checkEnabled}
        />
      )}

      {/* Check prompt */}
      {showCheckPrompt && checkEnabled && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-border bg-card p-4 shadow-2xl">
          <p className="text-sm font-medium mb-2">
            You&apos;ve answered 20 questions. Consider reviewing with the Check feature.
          </p>
          <button
            onClick={() => {
              setShowCheckPrompt(false);
              checkPromptDismissed.current = true;
            }}
            className="rounded-full bg-[#0b5cd6] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#094bb0]"
          >
            Got it
          </button>
        </div>
      )}

      {showDesmos && <DesmosPanel onClose={() => setShowDesmos(false)} />}
      {showRef && <ReferenceSheet onClose={() => setShowRef(false)} />}
    </div>
  );
}

export default function TestPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-foreground border-t-transparent" />
        </div>
      }
    >
      <TestPageInner />
    </Suspense>
  );
}

/* ─── Question Pane ─── */

function QuestionPane({
  q,
  state,
  eliminatorOn,
  setEliminatorOn,
  checkEnabled,
  onMark,
  onSelect,
  onEliminate,
  onCheck,
  onTextChange,
  fullWidth,
}: {
  q: QuestionFull;
  state: QuestionState;
  eliminatorOn: boolean;
  setEliminatorOn: (v: boolean) => void;
  checkEnabled: boolean;
  onMark: () => void;
  onSelect: (letter: string) => void;
  onEliminate: (letter: string) => void;
  onCheck: () => void;
  onTextChange: (text: string) => void;
  fullWidth?: boolean;
}) {
  const isSPR = q.question_type === "spr";
  const hasSelection = isSPR ? !!state.textAnswer : !!state.selected;
  const canCheck = checkEnabled && hasSelection && !state.checked;

  return (
    <section className={`overflow-y-auto px-10 py-8 ${fullWidth ? "" : "w-1/2"}`}>
      <div className="mx-auto max-w-xl">
        <div className="flex items-center justify-between rounded-t-md bg-muted px-3 py-2">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center bg-foreground text-sm font-semibold text-background">
              {q.id.slice(0, 4)}
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
          {!isSPR && (
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
          )}
        </div>

        <div className="border-t border-border pt-6">
          <Highlightable>
            <p className="font-serif text-[17px] leading-[1.6] text-foreground" dangerouslySetInnerHTML={{__html: q.stem}} />
          </Highlightable>

          {q.image_url && (
            <div className="mt-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={q.image_url} alt="Question image" className="max-h-64 rounded border border-border" />
            </div>
          )}

          {isSPR ? (
            <div className="mt-6">
              <label className="block text-sm font-medium text-foreground mb-2">Your answer</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={state.textAnswer ?? ""}
                  onChange={(e) => onTextChange(e.target.value)}
                  disabled={state.checked}
                  placeholder="Type your answer"
                  className={`flex-1 rounded-lg border px-4 py-3 text-sm transition ${
                    state.checked
                      ? state.correct
                        ? "border-green-500 bg-green-50"
                        : "border-red-500 bg-red-50"
                      : "border-foreground/30 focus:border-[#0b5cd6] focus:ring-2 focus:ring-[#0b5cd6]/20"
                  }`}
                />
                {canCheck && (
                  <button
                    onClick={onCheck}
                    className="rounded-full bg-[#0b5cd6] px-4 py-3 text-sm font-semibold text-white hover:bg-[#094bb0]"
                  >
                    Check
                  </button>
                )}
                {state.checked && (
                  <span className={`text-sm font-medium ${state.correct ? "text-green-600" : "text-red-600"}`}>
                    {state.correct ? "Correct" : "Incorrect"}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {q.options
                .slice()
                .sort((a, b) => a.order_index - b.order_index)
                .map((opt) => {
                  const eliminated = !!state.eliminated?.[opt.label];
                  const selected = state.selected === opt.label;
                  return (
                    <div key={opt.label} className="flex items-center gap-2">
                      <button
                        onClick={() => onSelect(opt.label)}
                        disabled={eliminated || state.checked}
                        className={`flex flex-1 items-center gap-3 rounded-lg border px-4 py-3 text-left transition ${
                          selected
                            ? state.checked
                              ? state.correct
                                ? "border-green-500 bg-green-50 ring-2 ring-green-500"
                                : "border-red-500 bg-red-50 ring-2 ring-red-500"
                              : "border-[#0b5cd6] bg-[#0b5cd6]/5 ring-2 ring-[#0b5cd6]"
                            : state.checked && opt.is_correct
                              ? "border-green-500 bg-green-50"
                              : "border-foreground/30 hover:border-foreground/60"
                        } ${eliminated ? "opacity-40" : ""}`}
                      >
                        <div
                          className={`flex h-7 aspect-square items-center justify-center rounded-full border text-sm font-medium ${
                            selected
                              ? state.checked
                                ? state.correct
                                  ? "border-green-500 bg-green-500 text-white"
                                  : "border-red-500 bg-red-500 text-white"
                                : "border-[#0b5cd6] bg-[#0b5cd6] text-white"
                              : state.checked && opt.is_correct
                                ? "border-green-500 bg-green-500 text-white"
                                : "border-foreground/40"
                          }`}
                        >
                          {opt.label}
                        </div>
                        <span className={`font-serif text-[16px] ${eliminated ? "line-through" : ""}`} dangerouslySetInnerHTML={{__html: opt.option_text}} />
                      </button>
                      {!state.checked && eliminatorOn && (
                        <button
                          onClick={() => onEliminate(opt.label)}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/40 text-sm font-semibold hover:bg-foreground/5"
                          aria-label={`Eliminate ${opt.label}`}
                          title={eliminated ? "Undo eliminate" : "Eliminate"}
                        >
                          {eliminated ? "↺" : <span className="line-through">{opt.label}</span>}
                        </button>
                      )}
                    </div>
                  );
                })}
              {canCheck && (
                <div className="pt-2">
                  <button
                    onClick={onCheck}
                    className="rounded-full bg-[#0b5cd6] px-6 py-2 text-sm font-semibold text-white hover:bg-[#094bb0]"
                  >
                    Check
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─── Navigator Overlay ─── */

function NavigatorOverlay({
  questionIds,
  answers,
  currentIdx,
  classNames,
  skillNames,
  onClose,
  onNavigate,
  onCheck,
  checkEnabled,
}: {
  questionIds: QuestionMeta[];
  answers: AnswerStore;
  currentIdx: number;
  classNames: Map<string, string>;
  skillNames: Map<string, string>;
  onClose: () => void;
  onNavigate: (i: number) => void;
  onCheck: (questionId: string) => void;
  checkEnabled: boolean;
  }) {

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { skills: Map<string, { questions: { meta: QuestionMeta; idx: number }[] }> }
    >();

    for (let i = 0; i < questionIds.length; i++) {
      const q = questionIds[i];
      const classShortcode = q.primary_class?.shortcode ?? q.primary_class_id;
      if (!map.has(classShortcode)) {
        map.set(classShortcode, { skills: new Map() });
      }
      const classEntry = map.get(classShortcode)!;

      const skillShortcode = q.skill?.shortcode ?? q.skill_id;
      if (!classEntry.skills.has(skillShortcode)) {
        classEntry.skills.set(skillShortcode, { questions: [] });
      }
      classEntry.skills.get(skillShortcode)!.questions.push({ meta: q, idx: i });
    }

    return map;
  }, [questionIds]);

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-6 py-4">
        <h2 className="text-lg font-semibold">Question Navigator</h2>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-foreground/60 hover:bg-foreground/10 hover:text-foreground"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        {[...grouped.entries()].map(([classShortcode, classData]) => (
          <div key={classShortcode} className="mb-8">
            <h3 className="text-base font-semibold mb-3 text-foreground/80">
              {classNames.get(classShortcode) ?? classShortcode}
            </h3>
            {[...classData.skills.entries()].map(([skillShortcode, skillData]) => (
              <div key={skillShortcode} className="mb-4 pl-4">
                <h4 className="text-sm font-medium mb-2 text-foreground/60">
                  {skillNames.get(skillShortcode) ?? skillShortcode}
                </h4>
                <div className="grid grid-cols-15 gap-2">
                  {skillData.questions.map(({ meta, idx }) => {
                    const state = answers[meta.id];
                    const isAnswered = !!state?.selected || !!state?.textAnswer;
                    const isCurrent = idx === currentIdx;
                    const isChecked = state?.checked;
                    const isCorrect = state?.correct;
                    const isMarked = state?.marked;

                    let bgClass = "bg-background";
                    let borderClass = "border-dashed border-foreground/40";

                    if (isChecked) {
                      bgClass = isCorrect ? "bg-green-100" : "bg-red-100";
                      borderClass = isCorrect ? "border-green-500" : "border-red-500";
                    } else if (isAnswered) {
                      bgClass = "bg-[#0b5cd6] text-white";
                      borderClass = "border-solid border-[#0b5cd6]";
                    }

                    if (isCurrent) {
                      borderClass = "border-solid border-foreground ring-2 ring-foreground/40";
                    }

                    return (
                      <div key={meta.id} className="relative">
                        <button
                          onClick={() => onNavigate(idx)}
                          className={`relative rounded-md border py-2 text-sm transition ${bgClass} ${borderClass} w-full`}
                        >
                          {idx + 1}
                          {isMarked && (
                            <span className="absolute -right-1 -top-1 text-[10px]">🚩</span>
                          )}
                        </button>
                        {checkEnabled && isAnswered && !isChecked && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCheck(meta.id);
                            }}
                            className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-[#0b5cd6] text-[8px] font-bold text-white flex items-center justify-center"
                            title="Check answer"
                          >
                            ✓
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Icons ─── */

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
