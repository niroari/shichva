"use client";

import { useEffect, useRef, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri"] as const;
const DAY_LABELS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי"];
type Day = typeof DAYS[number];

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

const CLEAR = "__clear__";

interface Props {
  classId: string;
}

export default function AdminSchedule({ classId }: Props) {
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [dragSubject, setDragSubject] = useState("");
  const [dragOverKey, setDragOverKey] = useState("");
  const [savingKey, setSavingKey] = useState("");
  const [loading, setLoading] = useState(true);

  // Tracks whether we've done the one-time merge of schedule subjects into the palette
  const mergedRef = useRef(false);

  // Real-time schedule data
  useEffect(() => {
    const q = query(
      collection(db, "classes", classId, "schedule"),
      orderBy("order")
    );
    return onSnapshot(q, (snap) => {
      setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ScheduleRow)));
      setLoading(false);
    });
  }, [classId]);

  // Load stored subjects palette from Firestore
  useEffect(() => {
    getDoc(doc(db, "classes", classId, "meta", "subjects")).then((d) => {
      if (d.exists()) {
        setSubjects((d.data().list as string[]) ?? []);
      }
    });
  }, [classId]);

  // One-time merge: add any subjects already in the schedule into the palette
  useEffect(() => {
    if (mergedRef.current || rows.length === 0) return;
    mergedRef.current = true;

    const fromSchedule = new Set<string>();
    rows.forEach((row) => {
      if (row.type === "הפסקה") return;
      DAYS.forEach((day) => {
        const val = row[day]?.trim();
        if (val) fromSchedule.add(val);
      });
    });

    setSubjects((prev) => {
      const merged = [...new Set([...prev, ...fromSchedule])]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "he"));
      if (merged.length === prev.length) return prev;
      // Persist newly discovered subjects
      setDoc(doc(db, "classes", classId, "meta", "subjects"), { list: merged });
      return merged;
    });
  }, [rows, classId]);

  async function persistSubjects(list: string[]) {
    await setDoc(doc(db, "classes", classId, "meta", "subjects"), { list });
  }

  async function addSubject() {
    const val = newSubject.trim();
    if (!val) return;
    setNewSubject("");
    if (subjects.includes(val)) return;
    const updated = [...subjects, val].sort((a, b) =>
      a.localeCompare(b, "he")
    );
    setSubjects(updated);
    await persistSubjects(updated);
  }

  async function removeSubject(s: string) {
    const updated = subjects.filter((x) => x !== s);
    setSubjects(updated);
    await persistSubjects(updated);
  }

  async function dropOnCell(rowId: string, day: Day) {
    if (!dragSubject) return;
    const value = dragSubject === CLEAR ? "" : dragSubject;
    const key = `${rowId}-${day}`;
    setSavingKey(key);
    setDragOverKey("");
    await updateDoc(doc(db, "classes", classId, "schedule", rowId), {
      [day]: value,
    });
    setSavingKey("");
  }

  if (loading)
    return (
      <p className="text-muted-foreground text-center py-12">טוען מערכת שעות...</p>
    );

  return (
    <div className="admin-schedule-layout">
      {/* ── Subject palette (right in RTL) ── */}
      <div className="admin-palette">
        <p className="admin-palette-title">מקצועות</p>

        <div className="admin-palette-list">
          {subjects.length === 0 && (
            <p style={{ fontSize: "0.78rem", color: "#475569" }}>טרם נוספו</p>
          )}
          {subjects.map((s) => (
            <div key={s} className="admin-palette-row">
              <div
                className={`admin-palette-chip${dragSubject === s ? " dragging" : ""}`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", s);
                  setDragSubject(s);
                }}
                onDragEnd={() => {
                  setDragSubject("");
                  setDragOverKey("");
                }}
              >
                {s}
              </div>
              <button
                className="admin-palette-remove"
                onClick={() => removeSubject(s)}
                title="הסר מהרשימה"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {/* Clear-cell button */}
        <div
          className={`admin-palette-clear${dragSubject === CLEAR ? " dragging" : ""}`}
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData("text/plain", CLEAR);
            setDragSubject(CLEAR);
          }}
          onDragEnd={() => {
            setDragSubject("");
            setDragOverKey("");
          }}
        >
          ✕ מחק תא
        </div>

        {/* Add new subject */}
        <div className="admin-palette-add">
          <input
            type="text"
            placeholder="מקצוע חדש..."
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addSubject()}
          />
          <button
            className="btn-primary"
            onClick={addSubject}
            style={{ padding: "6px 12px", fontSize: "0.85rem" }}
          >
            + הוסף
          </button>
        </div>
      </div>

      {/* ── Schedule table (left in RTL) ── */}
      <div className="admin-sched-wrap">
        <table className="admin-sched-table">
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
                  <tr key={row.id} className="sched-break">
                    <td />
                    <td>{row.time}</td>
                    <td colSpan={6}>{row.sun}</td>
                  </tr>
                );
              }

              return (
                <tr key={row.id}>
                  <td className="sched-period">{row.period}</td>
                  <td className="sched-time">{row.time}</td>
                  {DAYS.map((day) => {
                    const key = `${row.id}-${day}`;
                    const isOver = dragOverKey === key;
                    const isSaving = savingKey === key;
                    const val = row[day];

                    return (
                      <td
                        key={day}
                        className={`sched-drop-cell${isOver ? " sched-drop-over" : ""}${!val ? " sched-drop-empty" : ""}`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (dragSubject) setDragOverKey(key);
                        }}
                        onDragLeave={(e) => {
                          if (
                            !e.currentTarget.contains(
                              e.relatedTarget as Node
                            )
                          )
                            setDragOverKey("");
                        }}
                        onDrop={() => dropOnCell(row.id, day)}
                      >
                        {isSaving ? (
                          <span
                            style={{ color: "#7c3aed", fontSize: "0.72rem" }}
                          >
                            ⟳
                          </span>
                        ) : (
                          val || ""
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
