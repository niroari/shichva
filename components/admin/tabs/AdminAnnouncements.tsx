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
} from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Announcement {
  id: string;
  order: number;
  date: string;
  title: string;
  body: string;
  important: boolean;
}

interface Props {
  classId: string;
}

export default function AdminAnnouncements({ classId }: Props) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  // Add form state
  const [newDate, setNewDate] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newImportant, setNewImportant] = useState(false);
  const [saving, setSaving] = useState(false);

  // Inline edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editImportant, setEditImportant] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const colRef = collection(db, "classes", classId, "announcements");

  useEffect(() => {
    const q = query(colRef, orderBy("order"));
    const unsub = onSnapshot(q, (snap) => {
      setItems(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Announcement, "id">) }))
      );
      setLoading(false);
    });
    return () => unsub();
  }, [classId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const nextOrder = items.length > 0 ? Math.max(...items.map((i) => i.order)) + 1 : 1;
    await addDoc(colRef, {
      order: nextOrder,
      date: newDate.trim(),
      title: newTitle.trim(),
      body: newBody.trim(),
      important: newImportant,
    });
    setNewDate("");
    setNewTitle("");
    setNewBody("");
    setNewImportant(false);
    setSaving(false);
  }

  function startEdit(item: Announcement) {
    setEditId(item.id);
    setEditDate(item.date);
    setEditTitle(item.title);
    setEditBody(item.body);
    setEditImportant(item.important);
  }

  function cancelEdit() {
    setEditId(null);
  }

  async function saveEdit(item: Announcement) {
    setEditSaving(true);
    await updateDoc(doc(db, "classes", classId, "announcements", item.id), {
      date: editDate.trim(),
      title: editTitle.trim(),
      body: editBody.trim(),
      important: editImportant,
    });
    setEditId(null);
    setEditSaving(false);
  }

  async function handleDelete(item: Announcement) {
    if (!confirm(`למחוק את "${item.title}"?`)) return;
    await deleteDoc(doc(db, "classes", classId, "announcements", item.id));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Add form */}
      <div className="admin-card">
        <h2 className="text-lg font-bold text-foreground mb-4">הוספת הודעה</h2>
        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <div className="form-row">
            <div className="form-group" style={{ maxWidth: 160 }}>
              <label>תאריך</label>
              <input
                type="text"
                placeholder="למשל: 10.4"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>כותרת *</label>
              <input
                type="text"
                placeholder="כותרת ההודעה"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>תוכן (אופציונלי)</label>
            <textarea
              placeholder="פרטים נוספים..."
              value={newBody}
              onChange={(e) => setNewBody(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="form-check">
              <input
                type="checkbox"
                checked={newImportant}
                onChange={(e) => setNewImportant(e.target.checked)}
              />
              <span className="text-sm text-muted-foreground">הודעה חשובה</span>
            </label>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary mr-auto"
            >
              {saving ? "שומר..." : "+ הוסף הודעה"}
            </button>
          </div>
        </form>
      </div>

      {/* Existing list */}
      <div className="admin-card">
        <h2 className="text-lg font-bold text-foreground mb-4">הודעות קיימות</h2>
        {loading ? (
          <p className="text-muted-foreground text-sm">טוען...</p>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground text-sm">אין הודעות עדיין.</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>תאריך</th>
                  <th>כותרת</th>
                  <th>תוכן</th>
                  <th>חשוב</th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) =>
                  editId === item.id ? (
                    // Edit row
                    <tr key={item.id}>
                      <td>
                        <input
                          className="inline-input"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          style={{ width: 80 }}
                        />
                      </td>
                      <td>
                        <input
                          className="inline-input"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          style={{ minWidth: 160 }}
                        />
                      </td>
                      <td>
                        <input
                          className="inline-input"
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          style={{ minWidth: 200 }}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={editImportant}
                          onChange={(e) => setEditImportant(e.target.checked)}
                        />
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            className="btn-save"
                            onClick={() => saveEdit(item)}
                            disabled={editSaving}
                          >
                            {editSaving ? "..." : "שמור"}
                          </button>
                          <button className="btn-cancel" onClick={cancelEdit}>
                            ביטול
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    // Display row
                    <tr key={item.id}>
                      <td style={{ whiteSpace: "nowrap" }}>{item.date}</td>
                      <td>
                        {item.important && (
                          <span className="important-badge">חשוב</span>
                        )}{" "}
                        {item.title}
                      </td>
                      <td style={{ color: "var(--color-muted-foreground)", fontSize: "0.85em" }}>
                        {item.body || "—"}
                      </td>
                      <td>{item.important ? "✓" : ""}</td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn-edit" onClick={() => startEdit(item)}>
                            עריכה
                          </button>
                          <button className="btn-danger" onClick={() => handleDelete(item)}>
                            מחיקה
                          </button>
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
