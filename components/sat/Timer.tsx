"use client";

import { useEffect, useState } from "react";

export function Timer({ initialSeconds = 32 * 60 }: { initialSeconds?: number }) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, []);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="flex flex-col items-center">
      <div className="text-2xl font-semibold tabular-nums tracking-tight text-foreground">
        {hidden ? "" : `${mm}:${ss}`}
      </div>
      <button
        type="button"
        onClick={() => setHidden((h) => !h)}
        className="mt-0.5 rounded-full border border-foreground/40 px-3 py-0.5 text-xs font-medium text-foreground hover:bg-foreground/5"
      >
        {hidden ? "Show" : "Hide"}
      </button>
    </div>
  );
}
