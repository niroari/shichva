"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ProcessedEvent {
  id: string;
  date: Date;
  sortEnd: Date;
  display: string;
  title: string;
  time: string;
  cat: string;
}

interface MonthGroup {
  label: string;
  events: ProcessedEvent[];
  allPast: boolean;
}

const MONTH_NAMES = [
  "ינואר","פברואר","מרץ","אפריל","מאי","יוני",
  "יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר",
];

const CATEGORIES = [
  { cats: "מבחן",    label: "מבחן",      dot: "bg-red-400",     badge: "bg-red-400/25 text-red-300" },
  { cats: "בוחן",    label: "בוחן",      dot: "bg-orange-400",  badge: "bg-orange-400/25 text-orange-300" },
  { cats: "אירוע",   label: "אירוע",     dot: "bg-blue-400",    badge: "bg-blue-400/25 text-blue-300" },
  { cats: "חג,חופש", label: "חג / חופש", dot: "bg-violet-400",  badge: "bg-violet-400/25 text-violet-300" },
  { cats: "טיול",    label: "טיול",      dot: "bg-emerald-400", badge: "bg-emerald-400/25 text-emerald-300" },
];

function getCatStyle(cat: string) {
  return (
    CATEGORIES.find((c) => c.cats.split(",").includes(cat)) ?? {
      dot: "bg-blue-400",
      badge: "bg-blue-400/25 text-blue-300",
      label: cat,
    }
  );
}

function formatRange(start: Date, end?: Date): string {
  const d1 = start.getDate(), m1 = start.getMonth() + 1;
  if (!end || isNaN(end.getTime())) return `${d1}.${m1}`;
  const d2 = end.getDate(), m2 = end.getMonth() + 1;
  return m1 === m2 ? `${d1}–${d2}.${m1}` : `${d1}.${m1}–${d2}.${m2}`;
}

export default function Events({ classId }: { classId: string }) {
  const [monthGroups, setMonthGroups] = useState<MonthGroup[]>([]);
  const [monthIdx, setMonthIdx] = useState(0);
  const [showPast, setShowPast] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getDocs(collection(db, "classes", classId, "events"))
      .then((snapshot) => {
        if (snapshot.empty) {
          setMonthGroups([]);
          setLoading(false);
          return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const events: ProcessedEvent[] = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            const date = data.date?.toDate() ?? new Date(NaN);
            const endDate = data.endDate?.toDate() as Date | undefined;
            const sortEnd =
              endDate && !isNaN(endDate.getTime()) ? endDate : date;
            return {
              id: doc.id,
              date,
              sortEnd,
              display: formatRange(date, endDate),
              title: data.title || "",
              time: data.time || "",
              cat: data.category || "",
            };
          })
          .filter((e) => e.title && !isNaN(e.date.getTime()))
          .sort((a, b) => a.date.getTime() - b.date.getTime());

        const groupMap: Record<string, { label: string; events: ProcessedEvent[] }> = {};
        const groupOrder: string[] = [];

        events.forEach((e) => {
          const key = `${e.date.getFullYear()}-${e.date.getMonth()}`;
          if (!groupMap[key]) {
            groupMap[key] = {
              label: `${MONTH_NAMES[e.date.getMonth()]} ${e.date.getFullYear()}`,
              events: [],
            };
            groupOrder.push(key);
          }
          groupMap[key].events.push(e);
        });

        const groups: MonthGroup[] = groupOrder.map((key) => ({
          label: groupMap[key].label,
          events: groupMap[key].events,
          allPast: groupMap[key].events.every((e) => e.sortEnd < today),
        }));

        const firstNonPast = groups.findIndex((g) => !g.allPast);
        setMonthGroups(groups);
        setMonthIdx(firstNonPast >= 0 ? firstNonPast : groups.length - 1);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [classId]);

  if (loading) return <p className="text-muted-foreground text-center py-5">טוען אירועים...</p>;
  if (error) return <p className="text-red-400 text-center py-5">שגיאה בטעינת האירועים</p>;
  if (monthGroups.length === 0) return <p className="text-muted-foreground text-center py-5">אין אירועים</p>;

  const group = monthGroups[monthIdx];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const displayPast = showPast || group.allPast;
  const activeCats = activeFilter ? activeFilter.split(",") : null;

  const visibleEvents = group.events.filter((e) => {
    if (!displayPast && e.sortEnd < today) return false;
    if (activeCats && !activeCats.includes(e.cat)) return false;
    return true;
  });

  return (
    <div>
      {/* Category legend / filter */}
      <div className="flex flex-wrap gap-2 mb-5 justify-center">
        {CATEGORIES.map((c) => {
          const isActive = activeFilter === c.cats;
          const isDimmed = activeFilter !== null && activeFilter !== c.cats;
          return (
            <button
              key={c.cats}
              onClick={() => setActiveFilter(isActive ? null : c.cats)}
              className={`flex items-center gap-1.5 text-sm px-3 py-1 rounded-full border transition-all duration-150 cursor-pointer select-none ${
                isActive
                  ? "border-white/25 bg-white/10 text-slate-100"
                  : isDimmed
                  ? "border-transparent text-slate-400 opacity-30"
                  : "border-transparent text-slate-300 hover:opacity-80"
              }`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
              {c.label}
            </button>
          );
        })}
      </div>


      {/* Month navigator — direction: ltr so ‹ is physically left (= forward) */}
      <div
        className="flex items-center justify-between max-w-xl mx-auto mb-4"
        style={{ direction: "ltr" }}
      >
        <button
          onClick={() => setMonthIdx((i) => i + 1)}
          disabled={monthIdx === monthGroups.length - 1}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/[0.13] bg-white/[0.07] text-slate-300 text-xl hover:bg-white/[0.14] hover:text-slate-100 transition-all disabled:opacity-20 disabled:cursor-default cursor-pointer"
        >
          ‹
        </button>
        <span className="font-bold text-foreground text-lg" style={{ direction: "rtl" }}>
          {group.label}
        </span>
        <button
          onClick={() => setMonthIdx((i) => i - 1)}
          disabled={monthIdx === 0}
          className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/[0.13] bg-white/[0.07] text-slate-300 text-xl hover:bg-white/[0.14] hover:text-slate-100 transition-all disabled:opacity-20 disabled:cursor-default cursor-pointer"
        >
          ›
        </button>
      </div>

      {/* Events list */}
      {visibleEvents.length === 0 ? (
        <p className="text-muted-foreground text-center py-5">אין אירועים לחודש זה</p>
      ) : (
        <div className="space-y-1 max-w-xl mx-auto">
          {visibleEvents.map((e) => {
            const isPast = e.sortEnd < today;
            const style = getCatStyle(e.cat);
            return (
              <div
                key={e.id}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.06] transition-colors ${
                  isPast && displayPast ? "opacity-40" : ""
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${style.dot}`} />
                <span className="text-sm font-semibold text-slate-400 whitespace-nowrap min-w-[60px]">
                  {e.display}
                </span>
                <span className="flex-1 text-slate-100 text-sm">{e.title}</span>
                {e.time && (
                  <span className="text-xs text-slate-500 whitespace-nowrap">{e.time}</span>
                )}
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap ${style.badge}`}>
                  {style.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
