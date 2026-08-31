"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ScheduleRow {
  id: string;
  order: number;
  period: string;
  time: string;
  type: string;
  sun: string;
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
}

type DayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri";

const DAYS: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri"];
const DAY_LABELS: Record<DayKey, string> = {
  sun: "ראשון",
  mon: "שני",
  tue: "שלישי",
  wed: "רביעי",
  thu: "חמישי",
  fri: "שישי",
};

function getTodayDayKey(): DayKey {
  const day = new Date().getDay(); // 0: Sun, 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat
  if (day >= 0 && day <= 4) return DAYS[day];
  if (day === 5) return "fri";
  return "sun"; // On Saturday, show Sunday's schedule
}

export default function Schedule({ classId }: { classId: string }) {
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayKey>(getTodayDayKey);
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily");

  useEffect(() => {
    const q = query(
      collection(db, "classes", classId, "schedule"),
      orderBy("order")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setRows(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ScheduleRow)));
        setLoading(false);
      },
      () => {
        setError(true);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [classId]);

  if (loading) {
    return <p className="text-muted-foreground text-center py-5">טוען מערכת שעות...</p>;
  }

  if (error) {
    return <p className="text-red-400 text-center py-5">שגיאה בטעינת המערכת</p>;
  }

  if (rows.length === 0) {
    return <p className="text-muted-foreground text-center py-5">אין נתונים</p>;
  }

  const todayKey = getTodayDayKey();

  return (
    <div className="flex flex-col gap-3.5">
      {/* Mode Switcher */}
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex p-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setViewMode("daily")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              viewMode === "daily"
                ? "bg-[rgba(var(--theme-accent-rgb),0.15)] border border-[rgba(var(--theme-accent-rgb),0.4)] text-[var(--theme-accent)] shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            📅 תצוגה יומית
          </button>
          <button
            type="button"
            onClick={() => setViewMode("weekly")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              viewMode === "weekly"
                ? "bg-[rgba(var(--theme-accent-rgb),0.15)] border border-[rgba(var(--theme-accent-rgb),0.4)] text-[var(--theme-accent)] shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            📊 טבלה שבועית
          </button>
        </div>

        {viewMode === "daily" && (
          <span className="text-[11px] text-muted-foreground hidden sm:inline-block">
            לחץ על יום להצגת השיעורים
          </span>
        )}
      </div>

      {/* ── DAILY VIEW ── */}
      {viewMode === "daily" ? (
        <div className="flex flex-col gap-3">
          {/* Day Tabs */}
          <div className="grid grid-cols-6 gap-1 sm:gap-2 p-1 bg-white/[0.03] border border-[var(--card-border)] rounded-xl">
            {DAYS.map((day) => {
              const isSelected = selectedDay === day;
              const isToday = todayKey === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all cursor-pointer relative ${
                    isSelected
                      ? "bg-[rgba(var(--theme-accent-rgb),0.18)] border border-[rgba(var(--theme-accent-rgb),0.45)] text-[var(--theme-accent)] font-bold shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  <span className="text-xs sm:text-sm">{DAY_LABELS[day]}</span>
                  {isToday && (
                    <span className="text-[9px] px-1 rounded-full bg-[rgba(var(--theme-accent-rgb),0.2)] text-[var(--theme-accent)] mt-0.5 leading-tight">
                      היום
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Day Lessons List */}
          <div className="flex flex-col gap-2">
            {rows.map((row) => {
              if (row.type === "הפסקה") {
                return (
                  <div
                    key={row.id}
                    className="flex items-center justify-between py-2 px-3.5 rounded-xl bg-[rgba(var(--theme-accent-rgb),0.06)] border border-[rgba(var(--theme-accent-rgb),0.15)] text-xs text-foreground/85"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">☕</span>
                      <span className="font-semibold">{row.sun || "הפסקה"}</span>
                    </div>
                    <span className="text-muted-foreground text-[11px]" dir="ltr">
                      {row.time}
                    </span>
                  </div>
                );
              }

              const subject = row[selectedDay]?.trim();
              const hasLesson = Boolean(subject && subject !== "—");

              return (
                <div
                  key={row.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    hasLesson
                      ? "bg-[var(--card-bg)] border-[var(--card-border)] shadow-xs"
                      : "bg-white/[0.02] border-white/5 opacity-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0"
                      style={{
                        backgroundColor: "rgba(var(--theme-accent-rgb), 0.15)",
                        color: "var(--theme-accent)",
                        border: "1px solid rgba(var(--theme-accent-rgb), 0.3)",
                      }}
                    >
                      {row.period}
                    </div>
                    <div className="flex flex-col">
                      <span
                        className={`text-sm font-bold leading-tight ${
                          hasLesson ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {subject || "חלון / אין שיעור"}
                      </span>
                      <span className="text-[11px] text-muted-foreground mt-0.5" dir="ltr" style={{ textAlign: "right" }}>
                        {row.time}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── WEEKLY TABLE VIEW ── */
        <div className="schedule-wrapper">
          <table className="schedule-table">
            <thead>
              <tr>
                <th style={{ minWidth: 52 }}>
                  <span className="sm:hidden">שיעור</span>
                  <span className="hidden sm:inline">שיעור</span>
                </th>
                <th className="hidden sm:table-cell" style={{ minWidth: 80 }}>
                  שעות
                </th>
                {DAYS.map((d) => (
                  <th key={d}>{DAY_LABELS[d]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                if (row.type === "הפסקה") {
                  return (
                    <tr key={row.id} className="schedule-break">
                      <td className="sm:hidden text-[10px]" dir="ltr">
                        {row.time}
                      </td>
                      <td className="hidden sm:table-cell text-xs" dir="ltr">
                        {row.time}
                      </td>
                      <td colSpan={6}>{row.sun}</td>
                    </tr>
                  );
                }

                return (
                  <tr key={row.id}>
                    <td>
                      <div className="flex flex-col items-center justify-center">
                        <span className="font-bold text-sm" style={{ color: "var(--theme-accent)" }}>
                          {row.period}
                        </span>
                        <span className="text-[10px] text-muted-foreground block sm:hidden whitespace-nowrap leading-none mt-0.5" dir="ltr">
                          {row.time}
                        </span>
                      </div>
                    </td>
                    <td className="text-muted-foreground text-xs whitespace-nowrap hidden sm:table-cell" dir="ltr">
                      {row.time}
                    </td>
                    {DAYS.map((day) => (
                      <td key={day} className={!row[day] ? "text-muted-foreground/40" : "text-foreground"}>
                        {row[day] || "—"}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

