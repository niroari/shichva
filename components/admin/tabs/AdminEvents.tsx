"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminGuide from "@/components/admin/AdminGuide";

interface EventDoc {
  id: string;
  date: Timestamp;
  endDate?: Timestamp;
  title: string;
  time: string;
  category: string;
}

const CATEGORIES = ["מבחן", "בוחן", "אירוע", "חג", "חופש", "טיול"];

const MONTH_NAMES = [
  "ינואר","פברואר","מרץ","אפריל","מאי","יוני",
  "יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר",
];

function tsToInput(ts?: Timestamp): string {
  if (!ts) return "";
  const d = ts.toDate();
  // Format as YYYY-MM-DD for <input type="date">
  return d.toISOString().slice(0, 10);
}

function inputToTs(val: string): Timestamp | null {
  if (!val) return null;
  return Timestamp.fromDate(new Date(val));
}

function formatDisplay(ts: Timestamp, endTs?: Timestamp): string {
  const d = ts.toDate();
  const day = d.getDate(), mon = d.getMonth() + 1;
  if (!endTs) return `${day}.${mon}`;
  const e = endTs.toDate();
  const d2 = e.getDate(), m2 = e.getMonth() + 1;
  return mon === m2 ? `${day}–${d2}.${mon}` : `${day}.${mon}–${d2}.${m2}`;
}

function groupLabel(ts: Timestamp): string {
  const d = ts.toDate();
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
}

interface Props {
  classId: string;
}

export default function AdminEvents({ classId }: Props) {
  const [items, setItems] = useState<EventDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Add form
  const [newDate, setNewDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newCat, setNewCat] = useState("אירוע");
  const [saving, setSaving] = useState(false);

  // Inline edit
  const [editId, setEditId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editCat, setEditCat] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const colRef = collection(db, "classes", classId, "events");

  useEffect(() => {
    // Events have no guaranteed 'order' field — sort by date client-side
    const unsub = onSnapshot(colRef, (snap) => {
      const docs = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<EventDoc, "id">),
      }));
      docs.sort((a, b) => a.date.toMillis() - b.date.toMillis());
      setItems(docs);
      setLoading(false);
    });
    return () => unsub();
  }, [classId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const ts = inputToTs(newDate);
    if (!ts) return;
    setSaving(true);
    const data: Record<string, unknown> = {
      date: ts,
      title: newTitle.trim(),
      time: newTime.trim(),
      category: newCat,
    };
    const endTs = inputToTs(newEndDate);
    if (endTs) data.endDate = endTs;
    await addDoc(colRef, data);
    setNewDate("");
    setNewEndDate("");
    setNewTitle("");
    setNewTime("");
    setNewCat("אירוע");
    setSaving(false);
  }

  function startEdit(item: EventDoc) {
    setEditId(item.id);
    setEditDate(tsToInput(item.date));
    setEditEndDate(tsToInput(item.endDate));
    setEditTitle(item.title);
    setEditTime(item.time);
    setEditCat(item.category);
  }

  function cancelEdit() {
    setEditId(null);
  }

  async function saveEdit(item: EventDoc) {
    const ts = inputToTs(editDate);
    if (!ts) return;
    setEditSaving(true);
    const data: Record<string, unknown> = {
      date: ts,
      title: editTitle.trim(),
      time: editTime.trim(),
      category: editCat,
    };
    const endTs = inputToTs(editEndDate);
    // Always write endDate field — set to null to clear it
    data.endDate = endTs ?? null;
    await updateDoc(doc(db, "classes", classId, "events", item.id), data);
    setEditId(null);
    setEditSaving(false);
  }

  async function handleDelete(item: EventDoc) {
    if (!confirm(`למחוק את "${item.title}"?`)) return;
    await deleteDoc(doc(db, "classes", classId, "events", item.id));
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminGuide items={[
        "הוסף אירועים, מבחנים, חגים וחופשות דרך הטופס",
        "בחר תאריך התחלה ותאריך סיום לאירועים שנמשכים כמה ימים",
        "לאחר שמירה האירוע מופיע אוטומטית בלוח האירועים",
      ]} />
      {/* Add form */}
      <div className="admin-card">
        <h2 className="text-lg font-bold text-foreground mb-4">הוספת אירוע</h2>
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <div className="form-row">
            <div className="form-group">
              <label>תאריך התחלה *</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
                dir="ltr"
              />
            </div>
            <div className="form-group">
              <label>תאריך סיום (לאירוע רב-יומי)</label>
              <input
                type="date"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                dir="ltr"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>כותרת *</label>
              <input
                type="text"
                placeholder="שם האירוע"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group" style={{ maxWidth: 120 }}>
              <label>שעה</label>
              <input
                type="text"
                placeholder="למשל: 09:00"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                dir="ltr"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ maxWidth: 200 }}>
              <label>קטגוריה</label>
              <select value={newCat} onChange={(e) => setNewCat(e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <button type="submit" disabled={saving} className="btn-primary" style={{ alignSelf: "flex-end" }}>
              {saving ? "שומר..." : "+ הוסף אירוע"}
            </button>
          </div>
        </form>
      </div>

      {/* Existing list */}
      <div className="admin-card">
        <h2 className="text-lg font-bold text-foreground mb-4">אירועים קיימים</h2>
        {loading ? (
          <p className="text-muted-foreground text-sm">טוען...</p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground text-sm">אין אירועים עדיין.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: 100 }}>תאריך</th>
                  <th>כותרת</th>
                  <th style={{ width: 80 }}>שעה</th>
                  <th style={{ width: 80 }}>קטגוריה</th>
                  <th style={{ width: 120 }}>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) =>
                  editId === item.id ? (
                    <tr key={item.id}>
                      <td>
                        <div className="flex flex-col gap-1">
                          <input
                            className="inline-input"
                            type="date"
                            value={editDate}
                            onChange={(e) => setEditDate(e.target.value)}
                            dir="ltr"
                          />
                          <input
                            className="inline-input"
                            type="date"
                            value={editEndDate}
                            onChange={(e) => setEditEndDate(e.target.value)}
                            dir="ltr"
                          />
                        </div>
                      </td>
                      <td>
                        <input
                          className="inline-input"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="inline-input"
                          value={editTime}
                          onChange={(e) => setEditTime(e.target.value)}
                          dir="ltr"
                        />
                      </td>
                      <td>
                        <select
                          className="inline-input"
                          value={editCat}
                          onChange={(e) => setEditCat(e.target.value)}
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </td>
                      <td className="cell-nowrap">
                        <div className="flex gap-2">
                          <button className="btn-save" onClick={() => saveEdit(item)} disabled={editSaving}>
                            {editSaving ? "..." : "שמור"}
                          </button>
                          <button className="btn-cancel" onClick={cancelEdit}>ביטול</button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={item.id}>
                      <td className="cell-nowrap">
                        <div className="cell-dim" style={{ fontSize: "0.78em", marginBottom: 2 }}>{groupLabel(item.date)}</div>
                        <div>{formatDisplay(item.date, item.endDate)}</div>
                      </td>
                      <td className="cell-trunc">{item.title}</td>
                      <td className="cell-nowrap cell-dim">{item.time || "—"}</td>
                      <td className="cell-nowrap">{item.category}</td>
                      <td className="cell-nowrap">
                        <div className="flex gap-2">
                          <button className="btn-edit" onClick={() => startEdit(item)}>עריכה</button>
                          <button className="btn-danger" onClick={() => handleDelete(item)}>מחיקה</button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
