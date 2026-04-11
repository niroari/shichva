"use client";

import Link from "next/link";

const sections = [
  { id: "announcements", label: "הודעות" },
  { id: "events", label: "אירועים" },
  { id: "teachers", label: "מורים" },
  { id: "schedule", label: "מערכת שעות" },
  { id: "seating", label: "מקומות ישיבה" },
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function ClassNav({ classLabel }: { classLabel: string }) {
  return (
    <nav className="fixed top-0 right-0 left-0 z-50 flex items-center justify-center gap-2 flex-wrap px-4 py-3"
      style={{
        background: "rgba(10, 8, 30, 0.88)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <Link
        href="/"
        className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-white/10 ml-2"
      >
        ← שכבת ז׳
      </Link>

      <span className="text-white/20 text-sm">|</span>

      {sections.map((s) => (
        <button
          key={s.id}
          onClick={() => scrollTo(s.id)}
          className="text-sm text-muted-foreground hover:text-foreground px-4 py-1.5 rounded-full hover:bg-white/10 transition-all duration-200 cursor-pointer"
        >
          {s.label}
        </button>
      ))}
    </nav>
  );
}
