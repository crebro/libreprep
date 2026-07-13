"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    Desmos?: {
      GraphingCalculator: (el: HTMLElement, opts?: Record<string, unknown>) => { destroy: () => void };
    };
  }
}

export function DesmosPanel({ onClose }: { onClose: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 80, y: 80 });
  const [ready, setReady] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const boot = () => {
      if (!containerRef.current || !window.Desmos) return;
      const calc = window.Desmos.GraphingCalculator(containerRef.current, {
        keypad: true,
        expressions: true,
        settingsMenu: false,
        border: false,
      });
      setReady(true);
      return () => calc.destroy();
    };

    if (window.Desmos) {
      const cleanup = boot();
      return cleanup;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-desmos]');
    if (existing) {
      existing.addEventListener("load", boot);
      return () => existing.removeEventListener("load", boot);
    }
    const s = document.createElement("script");
    s.src = "https://www.desmos.com/api/v1.10/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6";
    s.async = true;
    s.dataset.desmos = "1";
    s.onload = boot;
    document.body.appendChild(s);
  }, []);

  const onDragStart = (e: React.MouseEvent) => {
    dragRef.current = { startX: e.clientX, startY: e.clientY, ox: pos.x, oy: pos.y };
    const move = (ev: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      setPos({ x: d.ox + ev.clientX - d.startX, y: d.oy + ev.clientY - d.startY });
    };
    const up = () => {
      dragRef.current = null;
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  return (
    <div
      className="fixed z-40 w-[640px] max-w-[95vw] overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
      style={{ left: pos.x, top: pos.y }}
    >
      <div
        onMouseDown={onDragStart}
        className="flex cursor-move items-center justify-between border-b border-border bg-muted px-3 py-2"
      >
        <span className="text-sm font-semibold">Calculator</span>
        <button
          onClick={onClose}
          className="rounded px-2 text-sm text-muted-foreground hover:bg-foreground/10"
          aria-label="Close calculator"
        >
          ✕
        </button>
      </div>
      <div ref={containerRef} className="h-[480px] w-full bg-background">
        {!ready && (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading Desmos…
          </div>
        )}
      </div>
    </div>
  );
}
