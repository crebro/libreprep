"use client";
import type { QuestionMeta, AnswerStore, NavigatorOptions } from "@/lib/types";
import { NavigatorContent } from "./NavigatorContent";

export function CompactNavigator({
  onExpand,
  ...navigatorOptions
}: NavigatorOptions & {
  
  onExpand: () => void;
}) {
  return (
    <div className="fixed bottom-20 left-1/2 z-50 w-[480px] -translate-x-1/2 rounded-xl border border-border bg-card p-4 shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold">Question Navigator</span>
        <div className="flex items-center gap-2">
          <button
            onClick={onExpand}
            className="rounded bg-foreground/10 px-2 py-1 text-xs font-medium hover:bg-foreground/20"
            title="Expand to full view"
          >
            ⛶ Expand
          </button>
          <button
            onClick={navigatorOptions.onClose}
            className="text-xs text-foreground/60 hover:text-foreground"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="max-h-[50vh] overflow-y-scroll p-4">
        <NavigatorContent {...navigatorOptions} rowSize={10} />
      </div>
    </div>
  );
}
