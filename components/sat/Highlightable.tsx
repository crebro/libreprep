"use client";

import { useEffect, useRef, useState } from "react";

const COLORS = [
  { name: "yellow", bg: "#fde68a" },
  { name: "green", bg: "#bbf7d0" },
  { name: "blue", bg: "#bfdbfe" },
  { name: "pink", bg: "#fbcfe8" },
];

export function Highlightable({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [popover, setPopover] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMouseUp = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        setPopover(null);
        return;
      }
      const range = sel.getRangeAt(0);
      if (!el.contains(range.commonAncestorContainer)) return;
      const rect = range.getBoundingClientRect();
      const cRect = el.getBoundingClientRect();
      setPopover({
        x: rect.left - cRect.left + rect.width / 2,
        y: rect.top - cRect.top - 8,
      });
    };

    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "MARK" && el.contains(t)) {
        const parent = t.parentNode!;
        while (t.firstChild) parent.insertBefore(t.firstChild, t);
        parent.removeChild(t);
        parent.normalize();
        setPopover(null);
      }
    };

    document.addEventListener("mouseup", onMouseUp);
    el.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("mouseup", onMouseUp);
      el.removeEventListener("click", onClick);
    };
  }, []);

  const highlight = (color: string) => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    const mark = document.createElement("mark");
    mark.style.backgroundColor = color;
    mark.style.borderRadius = "2px";
    mark.style.padding = "0 1px";
    mark.style.cursor = "pointer";
    try {
      range.surroundContents(mark);
    } catch {
      const frag = range.extractContents();
      mark.appendChild(frag);
      range.insertNode(mark);
    }
    sel.removeAllRanges();
    setPopover(null);
  };

  return (
    <div ref={ref} className="relative">
      {children}
      {popover && (
        <div
          className="absolute z-30 flex -translate-x-1/2 -translate-y-full gap-1 rounded-lg border border-border bg-popover p-1.5 shadow-lg"
          style={{ left: popover.x, top: popover.y }}
        >
          {COLORS.map((c) => (
            <button
              key={c.name}
              onMouseDown={(e) => {
                e.preventDefault();
                highlight(c.bg);
              }}
              className="h-6 w-6 rounded-full border border-foreground/10 transition-transform hover:scale-110"
              style={{ backgroundColor: c.bg }}
              aria-label={`Highlight ${c.name}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
