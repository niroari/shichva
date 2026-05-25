"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
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

function getCategoryBadgeClass(category: string): string {
  switch (category) {
    case "מבחן":
      return "bg-red-500/20 text-red-300 border-red-500/30";
    case "בוחן":
      return "bg-orange-500/20 text-orange-300 border-orange-500/30";
    case "חג":
    case "חופש":
      return "bg-violet-500/20 text-violet-300 border-violet-500/30";
    case "טיול":
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    default:
      return "bg-blue-500/20 text-blue-300 border-blue-500/30";
  }
}

interface Props {
  classId: string;
}

export default function AdminEvents({ classId }: Props) {
  const [items, setItems] = useState<EventDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // View state
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  // Calendar navigation states (using UTC dates to prevent timezone offsets)
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  });

  // Selected cell context
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  });
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Unified Form States for Drawer & Classic view
  const [formId, setFormId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formCat, setFormCat] = useState("אירוע");
  const [formSaving, setFormSaving] = useState(false);

  const colRef = collection(db, "classes", classId, "events");

  // Fetch and sync events
  useEffect(() => {
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

  // Keyboard navigation listener (close drawer on Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsDrawerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Today local YYYY-MM-DD
  const todayStr = (() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  })();

  // Construct grid cells (42 cells: 6 rows of 7 days)
  const startDayOfWeek = currentMonth.getUTCDay(); // Sunday is 0, Saturday is 6
  const gridStartDate = new Date(
    Date.UTC(
      currentMonth.getUTCFullYear(),
      currentMonth.getUTCMonth(),
      1 - startDayOfWeek
    )
  );

  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    cells.push(
      new Date(
        Date.UTC(
          gridStartDate.getUTCFullYear(),
          gridStartDate.getUTCMonth(),
          gridStartDate.getUTCDate() + i
        )
      )
    );
  }

  // Handle drawer form submit (unified add & edit)
  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ts = inputToTs(formDate);
    if (!ts) return;
    setFormSaving(true);

    const data: Record<string, unknown> = {
      date: ts,
      title: formTitle.trim(),
      time: formTime.trim(),
      category: formCat,
    };
    const endTs = inputToTs(formEndDate);
    data.endDate = endTs ?? null;

    try {
      if (formId) {
        await updateDoc(doc(db, "classes", classId, "events", formId), data);
        setFormId(null);
      } else {
        await addDoc(colRef, data);
      }
      setFormTitle("");
      setFormTime("");
      setFormCat("אירוע");
      setFormEndDate("");
      // Keep drawer open so user can see daily events list update
    } catch (err) {
      console.error("Error saving event:", err);
    } finally {
      setFormSaving(false);
    }
  }

  // Delete event
  async function handleDeleteEvent(event: EventDoc) {
    if (!confirm(`למחוק את "${event.title}"?`)) return;
    try {
      await deleteDoc(doc(db, "classes", classId, "events", event.id));
      if (formId === event.id) {
        setFormId(null);
        setFormTitle("");
        setFormTime("");
        setFormCat("אירוע");
        setFormEndDate("");
      }
    } catch (err) {
      console.error("Error deleting event:", err);
    }
  }

  // Set form values to edit an event
  function loadEventToForm(event: EventDoc) {
    setFormId(event.id);
    setFormTitle(event.title);
    setFormTime(event.time);
    setFormCat(event.category);
    setFormDate(tsToInput(event.date));
    setFormEndDate(tsToInput(event.endDate));
  }

  // Reset form to Add mode
  function resetForm() {
    setFormId(null);
    setFormTitle("");
    setFormTime("");
    setFormCat("אירוע");
    setFormEndDate("");
  }

  // Filter events matching selectedDate inside the drawer
  const selectedDateStr = selectedDate.toISOString().slice(0, 10);
  const dayEvents = items.filter((item) => {
    const startStr = tsToInput(item.date);
    if (!item.endDate) return startStr === selectedDateStr;
    const endStr = tsToInput(item.endDate);
    return startStr <= selectedDateStr && selectedDateStr <= endStr;
  });

  return (
    <div className="flex flex-col gap-6">
      <AdminGuide
        items={[
          "הוסף אירועים, מבחנים, חגים וחופשות ללוח השנה",
          "לחץ על תא בלוח השנה כדי להציג את אירועי היום ולהוסיף אירוע חדש",
          "במידת הצורך ניתן לעבור לתצוגת רשימה קלאסית",
        ]}
      />

      {/* View Mode Toggle */}
      <div className="flex justify-between items-center gap-4">
        <div className="flex gap-1.5 p-1 bg-white/[0.04] border border-white/10 rounded-xl">
          <button
            onClick={() => setViewMode("calendar")}
            style={
              viewMode === "calendar"
                ? {
                    backgroundColor: "rgba(var(--theme-accent-rgb), 0.15)",
                    borderColor: "rgba(var(--theme-accent-rgb), 0.45)",
                    color: "var(--theme-accent)",
                  }
                : {}
            }
            className={`text-sm px-4 py-2 rounded-lg transition-all cursor-pointer font-medium border ${
              viewMode === "calendar"
                ? ""
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            לוח שנה
          </button>
          <button
            onClick={() => setViewMode("list")}
            style={
              viewMode === "list"
                ? {
                    backgroundColor: "rgba(var(--theme-accent-rgb), 0.15)",
                    borderColor: "rgba(var(--theme-accent-rgb), 0.45)",
                    color: "var(--theme-accent)",
                  }
                : {}
            }
            className={`text-sm px-4 py-2 rounded-lg transition-all cursor-pointer font-medium border ${
              viewMode === "list"
                ? ""
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            רשימה
          </button>
        </div>
        <div className="text-xs text-muted-foreground hidden sm:block">
          {viewMode === "calendar" && "לחץ על תא בלוח לפתיחת תפריט הוספה/עריכה"}
        </div>
      </div>

      {/* ── CALENDAR VIEW MODE ── */}
      {viewMode === "calendar" && (
        <div className="admin-card flex flex-col gap-6">
          {/* Month Controls */}
          <div className="flex items-center justify-between" style={{ direction: "ltr" }}>
            <button
              onClick={() =>
                setCurrentMonth(
                  new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() + 1, 1))
                )
              }
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/[0.13] bg-white/[0.07] text-slate-300 text-xl hover:bg-white/[0.14] hover:text-slate-100 transition-all cursor-pointer"
            >
              ‹
            </button>
            <span className="font-bold text-foreground text-lg" style={{ direction: "rtl" }}>
              {MONTH_NAMES[currentMonth.getUTCMonth()]} {currentMonth.getUTCFullYear()}
            </span>
            <button
              onClick={() =>
                setCurrentMonth(
                  new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth() - 1, 1))
                )
              }
              className="w-9 h-9 flex items-center justify-center rounded-lg border border-white/[0.13] bg-white/[0.07] text-slate-300 text-xl hover:bg-white/[0.14] hover:text-slate-100 transition-all cursor-pointer"
            >
              ›
            </button>
          </div>

          {/* Grid Container */}
          <div className="w-full overflow-x-auto rounded-xl border border-white/10">
            <div className="min-w-[700px] grid grid-cols-7 border-collapse">
              {/* Day Name Headers */}
              {["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"].map((dayName) => (
                <div
                  key={dayName}
                  className="p-2 text-center text-xs font-semibold text-muted-foreground border-b border-white/10 bg-white/[0.02]"
                >
                  {dayName}
                </div>
              ))}

              {/* Day Grid Cells */}
              {cells.map((cellDate, idx) => {
                const cellStr = cellDate.toISOString().slice(0, 10);
                const isCurrentMonth = cellDate.getUTCMonth() === currentMonth.getUTCMonth();
                const isToday = cellStr === todayStr;

                // Find events matching this day cell
                const cellEvents = items.filter((item) => {
                  const startStr = tsToInput(item.date);
                  if (!item.endDate) return startStr === cellStr;
                  const endStr = tsToInput(item.endDate);
                  return startStr <= cellStr && cellStr <= endStr;
                });

                return (
                  <div
                    key={cellStr}
                    onClick={() => {
                      setSelectedDate(cellDate);
                      setFormId(null);
                      setFormTitle("");
                      setFormTime("");
                      setFormCat("אירוע");
                      setFormDate(cellStr);
                      setFormEndDate("");
                      setIsDrawerOpen(true);
                    }}
                    className={`min-h-[105px] flex flex-col justify-between p-2 border-b border-r border-white/10 hover:bg-white/[0.04] transition-colors cursor-pointer select-none ${
                      isCurrentMonth ? "" : "opacity-30"
                    } ${
                      idx % 7 === 0 ? "border-l border-white/10" : ""
                    } ${
                      isToday ? "bg-[rgba(var(--theme-accent-rgb),0.07)]" : ""
                    }`}
                    style={
                      isToday
                        ? {
                            outline: "1px solid var(--theme-accent)",
                            zIndex: 1,
                          }
                        : {}
                    }
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span
                        className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday ? "text-white" : "text-slate-300"
                        }`}
                        style={isToday ? { backgroundColor: "var(--theme-accent)" } : {}}
                      >
                        {cellDate.getUTCDate()}
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[70px] scrollbar-thin">
                      {cellEvents.slice(0, 3).map((event) => {
                        const badgeClass = getCategoryBadgeClass(event.category);
                        return (
                          <div
                            key={event.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDate(cellDate);
                              loadEventToForm(event);
                              setIsDrawerOpen(true);
                            }}
                            className={`text-[10px] px-1.5 py-0.5 rounded border truncate font-medium text-right block leading-tight hover:brightness-125 transition-all ${badgeClass}`}
                          >
                            {event.title}
                          </div>
                        );
                      })}
                      {cellEvents.length > 3 && (
                        <div className="text-[9px] text-muted-foreground text-center font-medium">
                          +{cellEvents.length - 3} נוספים
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── LIST VIEW MODE (CLASSIC EDITORS) ── */}
      {viewMode === "list" && (
        <>
          {/* Classic Add Form */}
          <div className="admin-card">
            <h2 className="text-lg font-bold text-foreground mb-4">
              {formId ? "עריכת אירוע" : "הוספת אירוע"}
            </h2>
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
              <div className="form-row">
                <div className="form-group">
                  <label>תאריך התחלה *</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    dir="ltr"
                  />
                </div>
                <div className="form-group">
                  <label>תאריך סיום (לאירוע רב-יומי)</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
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
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ maxWidth: 120 }}>
                  <label>שעה</label>
                  <input
                    type="text"
                    placeholder="למשל: 09:00"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    dir="ltr"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group" style={{ maxWidth: 200 }}>
                  <label>קטגוריה</label>
                  <select value={formCat} onChange={(e) => setFormCat(e.target.value)}>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2" style={{ alignSelf: "flex-end" }}>
                  <button type="submit" disabled={formSaving} className="btn-primary">
                    {formSaving ? "שומר..." : formId ? "שמור שינויים" : "+ הוסף אירוע"}
                  </button>
                  {formId && (
                    <button type="button" onClick={resetForm} className="btn-cancel">
                      ביטול
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Classic Event Table */}
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
                    {items.map((item) => (
                      <tr key={item.id} className={formId === item.id ? "bg-white/[0.04]" : ""}>
                        <td className="cell-nowrap">
                          <div className="cell-dim" style={{ fontSize: "0.78em", marginBottom: 2 }}>
                            {groupLabel(item.date)}
                          </div>
                          <div>{formatDisplay(item.date, item.endDate)}</div>
                        </td>
                        <td className="cell-trunc">{item.title}</td>
                        <td className="cell-nowrap cell-dim">{item.time || "—"}</td>
                        <td className="cell-nowrap">{item.category}</td>
                        <td className="cell-nowrap">
                          <div className="flex gap-2">
                            <button
                              className="btn-edit"
                              onClick={() => {
                                loadEventToForm(item);
                                // Scroll up to the form
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                            >
                              עריכה
                            </button>
                            <button className="btn-danger" onClick={() => handleDeleteEvent(item)}>
                              מחיקה
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── SLIDING SIDE DRAWER ── */}
      {/* Drawer Backdrop Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 z-[99] ${
          isDrawerOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsDrawerOpen(false)}
      />

      {/* Drawer Container Panel */}
      <div
        className={`fixed top-0 bottom-0 left-0 w-full max-w-md bg-[#16122d] border-r border-white/10 shadow-2xl flex flex-col z-[100] transition-transform duration-300 ease-in-out ${
          isDrawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-foreground leading-snug">
              {selectedDate.toLocaleDateString("he-IL", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">אירועים ליום שנבחר</p>
          </div>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="text-muted-foreground hover:text-foreground text-xl p-2 cursor-pointer hover:bg-white/5 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Drawer Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Day's Events List */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              אירועים קיימים ביום זה
            </h4>
            {dayEvents.length === 0 ? (
              <p className="text-sm text-slate-400 italic bg-white/[0.02] rounded-lg p-3 border border-dashed border-white/5">
                אין אירועים רשומים ליום זה.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {dayEvents.map((event) => {
                  const badgeClass = getCategoryBadgeClass(event.category);
                  return (
                    <div
                      key={event.id}
                      className="bg-white/[0.03] border border-white/5 rounded-xl p-3 flex flex-col gap-2 relative group hover:bg-white/[0.05] transition-colors"
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${badgeClass}`}>
                          {event.category}
                        </span>
                        {event.time && (
                          <span className="text-xs text-muted-foreground ltr">{event.time}</span>
                        )}
                      </div>
                      <h5 className="text-sm font-semibold text-foreground">{event.title}</h5>
                      {event.endDate && (
                        <p className="text-[11px] text-muted-foreground">
                          טווח: {formatDisplay(event.date, event.endDate)}
                        </p>
                      )}
                      <div className="flex gap-2 justify-end mt-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => loadEventToForm(event)}
                          className="text-xs text-blue-400 hover:text-blue-300 font-medium px-2 py-1 rounded bg-blue-500/10 hover:bg-blue-500/20 transition-colors cursor-pointer"
                        >
                          עריכה
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event)}
                          className="text-xs text-red-400 hover:text-red-300 font-medium px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 transition-colors cursor-pointer"
                        >
                          מחיקה
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Unified Add/Edit Form */}
          <div className="border-t border-white/10 pt-6">
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {formId ? "עריכת פרטי אירוע" : "הוספת אירוע חדש ליום זה"}
              </h4>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">כותרת האירוע *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  placeholder="למשל: יום הורים, מבחן במתמטיקה"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-lg p-2 text-sm text-foreground outline-none focus:border-[var(--theme-accent)] transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">תאריך התחלה *</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    dir="ltr"
                    className="w-full bg-white/[0.06] border border-white/10 rounded-lg p-2 text-sm text-foreground outline-none focus:border-[var(--theme-accent)] transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">תאריך סיום</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    dir="ltr"
                    className="w-full bg-white/[0.06] border border-white/10 rounded-lg p-2 text-sm text-foreground outline-none focus:border-[var(--theme-accent)] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">שעה (לא חובה)</label>
                  <input
                    type="text"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    placeholder="למשל: 09:00"
                    dir="ltr"
                    className="w-full bg-white/[0.06] border border-white/10 rounded-lg p-2 text-sm text-foreground outline-none focus:border-[var(--theme-accent)] transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-muted-foreground">קטגוריה</label>
                  <select
                    value={formCat}
                    onChange={(e) => setFormCat(e.target.value)}
                    className="w-full bg-white/[0.06] border border-white/10 rounded-lg p-2 text-sm text-foreground outline-none focus:border-[var(--theme-accent)] transition-colors"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="bg-slate-900">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="submit"
                  disabled={formSaving}
                  className="flex-1 py-2.5 text-sm font-semibold rounded-lg shadow-lg cursor-pointer text-white transition-all hover:brightness-110"
                  style={{ backgroundColor: "var(--theme-accent)" }}
                >
                  {formSaving ? "שומר..." : formId ? "עדכן אירוע" : "+ הוסף אירוע"}
                </button>
                {formId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-cancel px-4 py-2.5 text-sm rounded-lg cursor-pointer"
                  >
                    ביטול
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

