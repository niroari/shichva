"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { notFound, useParams } from "next/navigation";
import LoginForm from "@/components/admin/LoginForm";

const classLabels: Record<string, string> = {
  kita1: "כיתה ז׳1",
  kita2: "כיתה ז׳2",
  kita3: "כיתה ז׳3",
  kita4: "כיתה ז׳4",
  kita5: "כיתה ז׳5",
};

const TABS = [
  { id: "announcements", label: "הודעות" },
  { id: "events",        label: "אירועים" },
  { id: "teachers",      label: "מורים" },
  { id: "schedule",      label: "מערכת שעות" },
  { id: "seating",       label: "מקומות ישיבה" },
];

export default function AdminPage() {
  const params = useParams();
  const classId = params.classId as string;
  const classLabel = classLabels[classId];

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("announcements");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (!classLabel) return notFound();
  if (authLoading) return null;
  if (!user) return <LoginForm />;

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <div
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-3"
        style={{
          background: "rgba(10,8,30,0.92)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="font-bold text-foreground">{classLabel}</span>
          <span className="text-white/20">|</span>
          <span className="text-muted-foreground text-sm">ניהול</span>
        </div>
        <button
          onClick={() => signOut(auth)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-white/10"
        >
          יציאה
        </button>
      </div>

      {/* Tab navigation */}
      <div
        className="flex gap-2 px-6 py-3 overflow-x-auto"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`text-sm px-4 py-2 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-violet-600/30 text-violet-300 border border-violet-500/40"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <p className="text-muted-foreground text-center py-12">
          טאב <strong className="text-foreground">{TABS.find(t => t.id === activeTab)?.label}</strong> — בקרוב
        </p>
      </div>
    </div>
  );
}
