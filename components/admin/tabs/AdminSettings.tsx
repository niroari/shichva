"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AdminGuide from "@/components/admin/AdminGuide";

interface Props {
  classId: string;
}

export interface ClassSettings {
  className?: string;
  schoolName?: string;
  theme?: string;
}

const THEME_OPTIONS = [
  { id: "kita1", label: "כחול", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.15)", border: "rgba(56, 189, 248, 0.4)" },
  { id: "kita2", label: "סגול", color: "#a855f7", bg: "rgba(168, 85, 247, 0.15)", border: "rgba(168, 85, 247, 0.4)" },
  { id: "kita3", label: "ירוק", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.4)" },
  { id: "kita4", label: "כתום", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.4)" },
  { id: "kita5", label: "ורוד", color: "#ec4899", bg: "rgba(236, 72, 153, 0.15)", border: "rgba(236, 72, 153, 0.4)" },
];

export default function AdminSettings({ classId }: Props) {
  const [className, setClassName] = useState("כיתה ח׳2");
  const [schoolName, setSchoolName] = useState("חטיבת הביניים בן גוריון הרצליה");
  const [theme, setTheme] = useState("kita2");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const guideItems = [
    "שם הכיתה מוצג בכותרת הראשית של האתר ובפאנל הניהול.",
    "שם בית הספר מוצג מעל כותרת הכיתה.",
    "ערכת הנושא קובעת את צבעי ההדגשה, הכפתורים והרקעים הגרפיים באתר.",
    "השינויים נשמרים ישירות ומתעדכנים בזמן אמת לכל המבקרים.",
  ];

  useEffect(() => {
    async function loadSettings() {
      try {
        const snap = await getDoc(doc(db, "classes", classId, "meta", "settings"));
        if (snap.exists()) {
          const data = snap.data() as ClassSettings;
          if (data.className) setClassName(data.className);
          if (data.schoolName) setSchoolName(data.schoolName);
          if (data.theme) setTheme(data.theme);
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [classId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      await setDoc(
        doc(db, "classes", classId, "meta", "settings"),
        {
          className: className.trim(),
          schoolName: schoolName.trim(),
          theme,
          updatedAt: new Date(),
        },
        { merge: true }
      );
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error("Error saving settings:", err);
      alert("אירעה שגיאה בעת שמירת ההגדרות");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">טוען הגדרות...</div>;
  }

  return (
    <div className="space-y-6">
      <AdminGuide items={guideItems} />

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Details Card */}
        <div
          className="rounded-2xl p-6 space-y-5"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--card-border)",
            backdropFilter: "blur(12px)",
          }}
        >
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <span>⚙️</span> פרטי האתר והכיתה
          </h2>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">שם הכיתה</label>
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="לדוגמה: כיתה ח׳2 או כיתה ט׳1"
              required
              className="w-full rounded-xl px-4 py-2.5 text-sm text-foreground outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            />
            <span className="text-xs text-muted-foreground">יוצג ככותרת הראשית בדף הכיתה.</span>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-foreground">שם בית הספר / מוסד</label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="לדוגמה: חטיבת הביניים בן גוריון הרצליה"
              required
              className="w-full rounded-xl px-4 py-2.5 text-sm text-foreground outline-none transition-all"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            />
            <span className="text-xs text-muted-foreground">מופיע מעל שם הכיתה בכותרת העליונה.</span>
          </div>
        </div>

        {/* Theme Card */}
        <div
          className="rounded-2xl p-6 space-y-5"
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--card-border)",
            backdropFilter: "blur(12px)",
          }}
        >
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <span>🎨</span> צבע וערכת נושא
          </h2>
          <p className="text-xs text-muted-foreground">
            בחר את צבע ההדגשה המוביל לאתר הכיתה שלך:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {THEME_OPTIONS.map((opt) => {
              const isSelected = theme === opt.id;
              return (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setTheme(opt.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected ? "ring-2 ring-offset-2 ring-offset-background" : "hover:bg-white/5 opacity-80 hover:opacity-100"
                  }`}
                  style={{
                    backgroundColor: isSelected ? opt.bg : "rgba(255,255,255,0.03)",
                    borderColor: isSelected ? opt.border : "rgba(255,255,255,0.1)",
                    outlineColor: opt.color,
                  }}
                >
                  <span
                    className="w-7 h-7 rounded-full mb-2 shadow-sm"
                    style={{ backgroundColor: opt.color }}
                  />
                  <span className="text-sm font-semibold text-foreground">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 cursor-pointer shadow-lg"
            style={{
              background: "var(--theme-accent, #7c3aed)",
            }}
          >
            {saving ? "שומר..." : "שמור הגדרות"}
          </button>

          {savedSuccess && (
            <span className="text-emerald-400 text-sm font-medium flex items-center gap-1.5 animate-fade-in">
              <span>✓</span> ההגדרות נשמרו בהצלחה!
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
