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
import { NavigatorOverlay } from "../../components/sat/NavigatorOverlay";
import { CompactNavigator } from "../../components/sat/CompactNavigator";
import { QuestionPane } from "../../components/sat/QuestionPane";

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
  const [showFullNav, setShowFullNav] = useState(false);
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
          .order("primary_class_id", { ascending: true })
          .order("skill_id", { ascending: true })
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

      {/* Navigator - compact popup */}
      {showNav && !showFullNav && (
        <CompactNavigator
          questionIds={questionIds}
          answers={answers}
          currentIdx={idx}
          classNames={classNames}
          skillNames={skillNames}
          onClose={() => setShowNav(false)}
          onExpand={() => {
            setShowFullNav(true);
          }}
          onNavigate={(i) => {
            navigateTo(i);
            setShowNav(false);
          }}
          onCheck={checkAnswer}
          checkEnabled={checkEnabled} 
        />
      )}

      {/* Navigator - full page */}
      {showFullNav && (
        <NavigatorOverlay
          questionIds={questionIds}
          answers={answers}
          currentIdx={idx}
          classNames={classNames}
          skillNames={skillNames}
          onClose={() => {
            setShowFullNav(false);
            setShowNav(false);
          }}
          onNavigate={(i) => {
            navigateTo(i);
            setShowFullNav(false);
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
