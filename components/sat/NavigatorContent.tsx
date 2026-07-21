"use client";
import type { QuestionMeta, AnswerStore, NavigatorOptions } from "@/lib/types";
import { useMemo } from "react";

export function NavigatorContent({ rowSize, ...navigatorOptions }:  NavigatorOptions & {rowSize?: number}) {
  const {
    questionIds, answers, currentIdx, classNames, skillNames, onNavigate, onCheck, checkEnabled
  } = navigatorOptions;

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { skills: Map<string, { questions: { meta: QuestionMeta; idx: number; }[]; }>; }
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
    <>
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
                <div className="grid gap-2" style={{gridTemplateColumns: `repeat(${rowSize ?? 15}, minmax(0, 1fr))` }}>
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
    </>
  );
}
