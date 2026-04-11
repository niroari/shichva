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

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri"] as const;
const DAY_LABELS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"];

export default function Schedule({ classId }: { classId: string }) {
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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

  return (
    <div className="schedule-wrapper">
      <table className="schedule-table">
        <thead>
          <tr>
            <th>שיעור</th>
            <th>שעות</th>
            {DAY_LABELS.map((d) => (
              <th key={d}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            if (row.type === "הפסקה") {
              return (
                <tr key={row.id} className="schedule-break">
                  <td />
                  <td>{row.time}</td>
                  <td colSpan={6}>{row.sun}</td>
                </tr>
              );
            }

            return (
              <tr key={row.id}>
                <td className="font-bold text-blue-400">{row.period}</td>
                <td className="text-slate-400 text-xs whitespace-nowrap">{row.time}</td>
                {DAYS.map((day) => (
                  <td key={day} className={!row[day] ? "text-slate-600" : ""}>
                    {row[day] || "—"}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
