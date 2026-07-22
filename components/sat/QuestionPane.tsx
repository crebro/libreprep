"use client";
import { Highlightable } from "@/components/sat/Highlightable";
import type { QuestionFull, QuestionState } from "@/lib/types";
import { BookmarkIcon as BookmarkIconSolid } from "@heroicons/react/20/solid";
import { BookmarkIcon as BookmarkIconOutline } from "@heroicons/react/24/outline";

/* ─── Question Pane ─── */
export function QuestionPane({
  q, state, eliminatorOn, setEliminatorOn, checkEnabled, onMark, onSelect, onEliminate, onCheck, onTextChange, fullWidth,
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
            <span className="flex h-7 px-2 items-center justify-center bg-foreground text-sm font-semibold text-background">
              {q.sat_question_id ?? q.id.slice(0, 4)}
            </span>
            <button
              onClick={onMark}
              className="flex items-center gap-1.5 text-sm font-medium text-foreground"
            >
              <span className={state.marked ? "text-red-800" : "text-foreground"}>
                {state.marked ? <BookmarkIconSolid className="size-6"/> : <BookmarkIconOutline className="size-6"/>}
              </span>
              Mark for Review
            </button>
          </div>
          {!isSPR && (
            <button
              onClick={() => setEliminatorOn(!eliminatorOn)}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold ${eliminatorOn
                  ? "bg-foreground text-background"
                  : "text-foreground hover:bg-foreground/10"}`}
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
            <p className="font-serif text-[17px] leading-[1.6] text-foreground" dangerouslySetInnerHTML={{ __html: q.stem }} />
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
                  className={`flex-1 rounded-lg border px-4 py-3 text-sm transition ${state.checked
                      ? state.correct
                        ? "border-green-500 bg-green-50"
                        : "border-red-500 bg-red-50"
                      : "border-foreground/30 focus:border-[#0b5cd6] focus:ring-2 focus:ring-[#0b5cd6]/20"}`} />
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
                    <div key={opt.label} className="flex items-center gap-2 relative">
                      <button
                        onClick={() => onSelect(opt.label)}
                        disabled={eliminated || state.checked}
                        className={`flex flex-1 items-center gap-3 rounded-lg border px-4 py-3 text-left transition ${selected
                            ? state.checked
                              ? state.correct
                                ? "border-green-500 bg-green-50 ring-2 ring-green-500"
                                : "border-red-500 bg-red-50 ring-2 ring-red-500"
                              : "border-[#0b5cd6] bg-[#0b5cd6]/5 ring-2 ring-[#0b5cd6]"
                            : state.checked && opt.is_correct
                              ? "border-green-500 bg-green-50"
                              : "border-foreground/30 hover:border-foreground/60"} ${eliminated ? "opacity-40" : ""}`}
                      >
                        <div
                          className={`flex h-7 aspect-square items-center justify-center rounded-full border text-sm font-medium ${selected
                              ? state.checked
                                ? state.correct
                                  ? "border-green-500 bg-green-500 text-white"
                                  : "border-red-500 bg-red-500 text-white"
                                : "border-[#0b5cd6] bg-[#0b5cd6] text-white"
                              : state.checked && opt.is_correct
                                ? "border-green-500 bg-green-500 text-white"
                                : "border-foreground/40"}`}
                        >
                          {opt.label}
                        </div>
                        <span className={`font-serif text-[16px] ${eliminated ? "line-through" : ""}`} dangerouslySetInnerHTML={{ __html: opt.option_text }} />
                      </button>
                      {!state.checked && eliminatorOn && (
                        <button
                          onClick={() => onEliminate(opt.label)}
                          className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/40 text-sm font-semibold hover:bg-foreground/5 absolute"
                          style={{right: '0', transform: 'translateX(120%)'}}
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
