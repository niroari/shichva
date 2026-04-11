"use client";

import { useEffect, useRef, useState } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type SeatField =
  | "desk1_right" | "desk1_left"
  | "desk2_right" | "desk2_left"
  | "desk3_right" | "desk3_left"
  | "desk4_right" | "desk4_left";

interface SeatingRow {
  id: string;
  order: number;
  desk1_right: string; desk1_left: string;
  desk2_right: string; desk2_left: string;
  desk3_right: string; desk3_left: string;
  desk4_right: string; desk4_left: string;
}

const DESK_PAIRS: [SeatField, SeatField][] = [
  ["desk1_right", "desk1_left"],
  ["desk2_right", "desk2_left"],
  ["desk3_right", "desk3_left"],
  ["desk4_right", "desk4_left"],
];

interface DragSrc {
  rowId: string;
  field: SeatField;
  name: string;
}

interface Adding {
  rowId: string;
  field: SeatField;
}

interface Props {
  classId: string;
}

export default function AdminSeating({ classId }: Props) {
  const [rows, setRows] = useState<SeatingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragSrc, setDragSrc] = useState<DragSrc | null>(null);
  const [dragOverKey, setDragOverKey] = useState("");
  const [adding, setAdding] = useState<Adding | null>(null);
  const [addingName, setAddingName] = useState("");
  const addInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, "classes", classId, "seating"),
      orderBy("order")
    );
    return onSnapshot(q, (snap) => {
      setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() } as SeatingRow)));
      setLoading(false);
    });
  }, [classId]);

  // Auto-focus the input when add mode activates
  useEffect(() => {
    if (adding) {
      setTimeout(() => addInputRef.current?.focus(), 0);
    }
  }, [adding]);

  function cellKey(rowId: string, field: SeatField) {
    return `${rowId}::${field}`;
  }

  async function handleDrop(targetRowId: string, targetField: SeatField) {
    if (!dragSrc) return;
    const { rowId: srcRowId, field: srcField, name: srcName } = dragSrc;

    // Drop on self — no-op
    if (srcRowId === targetRowId && srcField === targetField) {
      setDragOverKey("");
      return;
    }

    const targetRow = rows.find((r) => r.id === targetRowId);
    const targetName = targetRow ? targetRow[targetField] || "" : "";

    const batch = writeBatch(db);
    if (srcRowId === targetRowId) {
      // Same row — one write
      batch.update(doc(db, "classes", classId, "seating", srcRowId), {
        [srcField]: targetName,
        [targetField]: srcName,
      });
    } else {
      // Different rows — two writes
      batch.update(doc(db, "classes", classId, "seating", srcRowId), {
        [srcField]: targetName,
      });
      batch.update(doc(db, "classes", classId, "seating", targetRowId), {
        [targetField]: srcName,
      });
    }

    await batch.commit();
    setDragSrc(null);
    setDragOverKey("");
  }

  async function confirmAdd() {
    const name = addingName.trim();
    if (!name || !adding) {
      setAdding(null);
      setAddingName("");
      return;
    }
    await updateDoc(doc(db, "classes", classId, "seating", adding.rowId), {
      [adding.field]: name,
    });
    setAdding(null);
    setAddingName("");
  }

  async function removeSeat(rowId: string, field: SeatField, name: string) {
    if (!confirm(`להסיר את ${name}?`)) return;
    await updateDoc(doc(db, "classes", classId, "seating", rowId), {
      [field]: "",
    });
  }

  if (loading)
    return <p className="text-muted-foreground text-center py-12">טוען...</p>;

  const totalRows = rows.length;

  return (
    <div className="admin-seating">
      <p className="text-muted-foreground text-sm text-center mb-5">
        גרור תלמיד/ה למקום אחר כדי להחליף · לחץ + להוספה · לחץ × להסרה
      </p>

      {rows.map((row, rowIdx) => (
        <div key={row.id} className="admin-seating-row">
          <span className="admin-row-label">שורה {totalRows - rowIdx}</span>
          <div className="admin-desks">
            {DESK_PAIRS.map(([rightField, leftField], deskIdx) => (
              <div key={deskIdx} className="admin-desk">
                {([rightField, leftField] as SeatField[]).map((field) => {
                  const key = cellKey(row.id, field);
                  const name = row[field] || "";
                  const isOver = dragOverKey === key;
                  const isDraggingSelf =
                    dragSrc?.rowId === row.id && dragSrc?.field === field;
                  const isAdding =
                    adding?.rowId === row.id && adding?.field === field;

                  // ── Adding mode ──
                  if (isAdding) {
                    return (
                      <div key={field} className="admin-seat admin-seat-adding">
                        <input
                          ref={addInputRef}
                          className="admin-seat-input"
                          value={addingName}
                          onChange={(e) => setAddingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") confirmAdd();
                            if (e.key === "Escape") {
                              setAdding(null);
                              setAddingName("");
                            }
                          }}
                          placeholder="שם..."
                        />
                        <button
                          className="admin-seat-confirm"
                          onMouseDown={(e) => {
                            e.preventDefault(); // prevent input blur before click
                            confirmAdd();
                          }}
                        >
                          ✓
                        </button>
                      </div>
                    );
                  }

                  // ── Empty seat ──
                  if (!name) {
                    return (
                      <div
                        key={field}
                        className={`admin-seat admin-seat-empty${isOver ? " drag-over" : ""}`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (dragSrc) setDragOverKey(key);
                        }}
                        onDragLeave={(e) => {
                          if (!e.currentTarget.contains(e.relatedTarget as Node))
                            setDragOverKey("");
                        }}
                        onDrop={() => handleDrop(row.id, field)}
                        onClick={() => {
                          setAdding({ rowId: row.id, field });
                          setAddingName("");
                        }}
                      >
                        <span className="admin-seat-plus">+</span>
                      </div>
                    );
                  }

                  // ── Occupied seat ──
                  return (
                    <div
                      key={field}
                      className={`admin-seat admin-seat-occupied${isDraggingSelf ? " dragging" : ""}${isOver ? " drag-over" : ""}`}
                      draggable
                      onDragStart={() =>
                        setDragSrc({ rowId: row.id, field, name })
                      }
                      onDragEnd={() => {
                        setDragSrc(null);
                        setDragOverKey("");
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragSrc && !isDraggingSelf) setDragOverKey(key);
                      }}
                      onDragLeave={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node))
                          setDragOverKey("");
                      }}
                      onDrop={() => handleDrop(row.id, field)}
                    >
                      <span className="admin-seat-name">{name}</span>
                      <button
                        className="admin-seat-remove"
                        title="הסר"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSeat(row.id, field, name);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Classroom footer — board + door */}
      <div className="admin-seating-footer">
        <div className="admin-seating-door">דלת</div>
        <div className="admin-seating-board">לוח</div>
      </div>
    </div>
  );
}
