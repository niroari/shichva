"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Announcement {
  id: string;
  order: number;
  date: string;
  title: string;
  body?: string;
  important: boolean;
}

export default function Announcements({ classId }: { classId: string }) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "classes", classId, "announcements"),
      orderBy("order")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() } as Announcement))
          .sort((a, b) => Number(b.important) - Number(a.important));
        setItems(data);
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
    return <p className="text-muted-foreground text-center py-5">טוען הודעות...</p>;
  }

  if (error) {
    return <p className="text-red-400 text-center py-5">שגיאה בטעינת הודעות</p>;
  }

  if (items.length === 0) {
    return <p className="text-muted-foreground text-center py-5">אין הודעות כרגע</p>;
  }

  return (
    <div className="space-y-2.5">
      {items.map((ann) => (
        <div
          key={ann.id}
          className={`border-r-[3px] rounded-xl px-4 py-3.5 transition-all duration-150 hover:-translate-x-1 ${
            ann.important
              ? "border-red-500 bg-red-500/[0.07]"
              : "border-blue-500 bg-white/[0.04]"
          }`}
        >
          <div className="text-xs text-muted-foreground mb-1">{ann.date}</div>
          <div className="flex items-center gap-2 font-bold text-foreground text-sm mb-1">
            {ann.important && (
              <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
            )}
            {ann.title}
          </div>
          {ann.body && (
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {ann.body}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
