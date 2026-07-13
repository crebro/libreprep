"use client";

import { useState } from "react";

const formulas: { label: string; body: string }[] = [
  { label: "Circle area", body: "A = πr²" },
  { label: "Circle circumference", body: "C = 2πr" },
  { label: "Rectangle area", body: "A = ℓw" },
  { label: "Triangle area", body: "A = ½bh" },
  { label: "Pythagorean theorem", body: "a² + b² = c²" },
  { label: "Special right 30–60–90", body: "sides: x, x√3, 2x" },
  { label: "Special right 45–45–90", body: "sides: x, x, x√2" },
  { label: "Rectangular solid", body: "V = ℓwh" },
  { label: "Cylinder", body: "V = πr²h" },
  { label: "Sphere", body: "V = (4/3)πr³" },
  { label: "Cone", body: "V = (1/3)πr²h" },
  { label: "Pyramid", body: "V = (1/3)ℓwh" },
];

export function ReferenceSheet({ onClose }: { onClose: () => void }) {
  const [pos, setPos] = useState({ x: 120, y: 120 });

  const onDragStart = (e: React.MouseEvent) => {
    const start = { x: e.clientX, y: e.clientY, ox: pos.x, oy: pos.y };
    const move = (ev: MouseEvent) =>
      setPos({ x: start.ox + ev.clientX - start.x, y: start.oy + ev.clientY - start.y });
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  return (
    <div
      className="fixed z-40 w-[520px] max-w-[95vw] overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
      style={{ left: pos.x, top: pos.y }}
    >
      <div
        onMouseDown={onDragStart}
        className="flex cursor-move items-center justify-between border-b border-border bg-muted px-3 py-2"
      >
        <span className="text-sm font-semibold">Reference Sheet</span>
        <button
          onClick={onClose}
          className="rounded px-2 text-sm text-muted-foreground hover:bg-foreground/10"
        >
          ✕
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 p-4">
        {formulas.map((f) => (
          <div key={f.label} className="rounded-md border border-border bg-background p-3">
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {f.label}
            </div>
            <div className="mt-1 font-serif text-lg">{f.body}</div>
          </div>
        ))}
        <div className="col-span-2 rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
          The number of degrees of arc in a circle is 360. The number of radians of arc in a circle
          is 2π. The sum of the measures in degrees of the angles of a triangle is 180.
        </div>
      </div>
    </div>
  );
}
