"use client";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { sections, type Section } from "@/lib/sat-filters";

export default function HomePage() {
  const [activeSection, setActiveSection] = useState<"english" | "math">("english");
  const [selectedClasses, setSelectedClasses] = useState<Record<string, boolean>>({});
  const [selectedSkills, setSelectedSkills] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [selectedDifficulty, setSelectedDifficulty] = useState<Record<string, boolean>>({
    E: false,
    M: false,
    H: false,
  });
  const [checkEnabled, setCheckEnabled] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(true);

  const section = sections.find((s) => s.id === activeSection)!;

  const toggleClass = (sec: Section, classId: string) => {
    const cls = sec.classes.find((c) => c.id === classId)!;
    const isOn = !selectedClasses[classId];
    setSelectedClasses((s) => ({ ...s, [classId]: isOn }));
    setSelectedSkills((s) => {
      const next = { ...s };
      for (const sk of cls.skills) next[sk.id] = isOn;
      return next;
    });
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkills((s) => ({ ...s, [skillId]: !s[skillId] }));
  };

  const toggleDifficulty = (d: string) => {
    setSelectedDifficulty((s) => ({ ...s, [d]: !s[d] }));
  };

  const counts = useMemo(() => {
    const perSection = sections.map((sec) => {
      let skillCount = 0;
      for (const c of sec.classes) for (const sk of c.skills) if (selectedSkills[sk.id]) skillCount++;
      return { id: sec.id, skillCount };
    });
    return perSection;
  }, [selectedSkills]);

  const totalSkills = counts.reduce((a, c) => a + c.skillCount, 0);

  const anyDifficultySelected = Object.values(selectedDifficulty).some(Boolean);
  const difficultyLabel = anyDifficultySelected
    ? Object.entries(selectedDifficulty)
        .filter(([, v]) => v)
        .map(([k]) => k)
        .join(",")
    : "E,M,H";

  const buildTestUrl = () => {
    const params = new URLSearchParams();
    params.set("subject", activeSection);

    const classShortcodes = section.classes
      .filter((c) => selectedClasses[c.id])
      .map((c) => c.shortcode);
    if (classShortcodes.length > 0) params.set("classes", classShortcodes.join(","));

    const skillShortcodes = section.classes
      .flatMap((c) => c.skills)
      .filter((sk) => selectedSkills[sk.id])
      .map((sk) => sk.shortcode);
    if (skillShortcodes.length > 0) params.set("skills", skillShortcodes.join(","));

    params.set("difficulty", difficultyLabel);
    params.set("check", checkEnabled ? "true" : "false");

    return `/test?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-[#f7f5f0] font-sans text-[#0b1a2b]">
      {/* Nav */}
      <nav className="border-b border-[#0b1a2b]/10 bg-[#f7f5f0]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Image src="/libreprep-logo.png" alt="LibrePrep Logo" width={50} height={50} />
          </div>
          <Link
            href={buildTestUrl()}
            className="rounded-full bg-[#03345D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#052a4a]"
          >
            Start test →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-8 pt-14 text-center">
        <div className="flex justify-center ">
          <Image src="/libreprep-long.svg" alt="LibrePrep Logo" width={983} height={512} style={{ width: '300px', height: 'auto' }} loading={'eager'} />
        </div>
        <h1 className="font-serif text-5xl font-semibold tracking-tight text-[#03345D]">
          Free the SAT.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-[#0b1a2b]/70">
          Build a custom question set from the SAT domains and skills you actually want to
          practice — then attempt it in a full Bluebook-style test interface.
        </p>
      </section>

      {/* Filter builder */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="rounded-2xl border border-[#0b1a2b]/10 bg-white shadow-sm">
          {/* Section tabs */}
          <div className="flex border-b border-[#0b1a2b]/10">
            {sections.map((s) => {
              const active = activeSection === s.id;
              const count = counts.find((c) => c.id === s.id)!.skillCount;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`relative flex-1 px-6 py-4 text-left transition ${
                    active ? "bg-[#03345D] text-white" : "text-[#0b1a2b] hover:bg-[#0b1a2b]/5"
                  }`}
                >
                  <div className="text-xs uppercase tracking-wide opacity-70">Section</div>
                  <div className="mt-0.5 flex items-center gap-2 text-lg font-semibold">
                    {s.name}
                    {count > 0 && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          active ? "bg-white/20" : "bg-[#03345D] text-white"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Difficulty selector */}
          <div className="border-b border-[#0b1a2b]/10 px-6 py-4">
            <div className="text-xs uppercase tracking-wide text-[#0b1a2b]/50 mb-2">Difficulty</div>
            <div className="flex gap-2">
              {(["E", "M", "H"] as const).map((d) => {
                const label = d === "E" ? "Easy" : d === "M" ? "Medium" : "Hard";
                const on = !!selectedDifficulty[d];
                return (
                  <button
                    key={d}
                    onClick={() => toggleDifficulty(d)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                      on
                        ? "border-[#03345D] bg-[#03345D] text-white"
                        : "border-[#0b1a2b]/25 text-[#0b1a2b] hover:border-[#03345D]"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {!anyDifficultySelected && (
              <div className="mt-1 text-xs text-[#0b1a2b]/50">All difficulties selected</div>
            )}
          </div>

          {/* Classes and skills */}
          <div className="divide-y divide-[#0b1a2b]/10">
            {section.classes.map((cls) => {
              const isExpanded = expanded[cls.id] ?? true;
              const classOn = !!selectedClasses[cls.id];
              const activeSkills = cls.skills.filter((sk) => selectedSkills[sk.id]).length;
              return (
                <div key={cls.id} className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <button
                      role="switch"
                      aria-checked={classOn}
                      onClick={() => toggleClass(section, cls.id)}
                      className={`relative h-6 w-11 rounded-full transition ${
                        classOn ? "bg-[#03345D]" : "bg-[#0b1a2b]/20"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                          classOn ? "left-[22px]" : "left-0.5"
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => setExpanded((e) => ({ ...e, [cls.id]: !isExpanded }))}
                      className="flex flex-1 items-center justify-between"
                    >
                      <div className="text-left">
                        <div className="font-medium">{cls.name}</div>
                        <div className="text-xs text-[#0b1a2b]/60">
                          {activeSkills} of {cls.skills.length} skills selected
                        </div>
                      </div>
                      <span className="text-[#0b1a2b]/40">{isExpanded ? "▾" : "▸"}</span>
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-3 flex flex-wrap gap-2 pl-14">
                      {cls.skills.map((sk) => {
                        const on = !!selectedSkills[sk.id];
                        return (
                          <button
                            key={sk.id}
                            onClick={() => toggleSkill(sk.id)}
                            className={`rounded-full border px-3 py-1.5 text-sm transition ${
                              on
                                ? "border-[#03345D] bg-[#03345D] text-white"
                                : "border-[#0b1a2b]/25 text-[#0b1a2b] hover:border-[#03345D]"
                            }`}
                          >
                            {sk.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Advanced settings */}
          <div className="border-b border-[#0b1a2b]/10">
            <button
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex w-full items-center justify-between px-6 py-3 text-sm font-medium text-[#0b1a2b]/70 hover:text-[#0b1a2b]"
            >
              Advanced Settings
              <span className="text-[#0b1a2b]/40">{showAdvanced ? "▾" : "▸"}</span>
            </button>
            {showAdvanced && (
              <div className="px-6 pb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <button
                    role="switch"
                    aria-checked={checkEnabled}
                    onClick={() => setCheckEnabled((v) => !v)}
                    className={`relative h-6 w-11 rounded-full transition ${
                      checkEnabled ? "bg-[#03345D]" : "bg-[#0b1a2b]/20"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                        checkEnabled ? "left-[22px]" : "left-0.5"
                      }`}
                    />
                  </button>
                  <span className="text-sm">Enable check button</span>
                </label>
                <p className="mt-1 text-xs text-[#0b1a2b]/50 pl-14">
                  Show a check button after answering each question to verify if your answer is correct.
                </p>
              </div>
            )}
          </div>

          {/* Footer CTA */}
          <div className="flex items-center justify-between bg-[#f7f5f0]/60 px-6 py-4">
            <div className="text-sm text-[#0b1a2b]/70">
              {totalSkills === 0
                ? "No skills selected — you'll get a mixed practice set."
                : `${totalSkills} skill${totalSkills === 1 ? "" : "s"} selected`}
            </div>
            <Link
              href={buildTestUrl()}
              className="rounded-full bg-[#03345D] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#052a4a]"
            >
              Start practice test →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
