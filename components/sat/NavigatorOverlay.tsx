"use client";
import type { QuestionMeta, AnswerStore, NavigatorOptions } from "@/lib/types";
import { useMemo } from "react";
import { NavigatorContent } from "./NavigatorContent";

/* ─── Navigator Overlay ─── */
export function NavigatorOverlay(navigatorOptions: NavigatorOptions) {
  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-6 py-4">
        <h2 className="text-lg font-semibold">Question Navigator</h2>
        <button
          onClick={navigatorOptions.onClose}
          className="rounded-full bg-[#0b5cd6] px-6 py-2 text-sm font-semibold text-white hover:bg-[#094bb0] disabled:opacity-50 cursor-pointer"
          aria-label="Close"
        >
          Go Back
        </button>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <NavigatorContent {...navigatorOptions} />
      </div>
    </div>
  );
}
