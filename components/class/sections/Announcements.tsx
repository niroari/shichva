"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";

interface Announcement {
  id: string;
  order: number;
  date: string;
  title: string;
  body?: string;
  imageUrl?: string;
  important: boolean;
}

export default function Announcements({ classId }: { classId: string }) {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

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

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxImage(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

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
    <>
      <div className="space-y-2.5">
        {items.map((ann) => (
          <div
            key={ann.id}
            className={`border-r-[3px] rounded-xl px-4 py-3.5 transition-all duration-150 hover:-translate-x-1 ${
              ann.important
                ? "border-red-500 bg-red-500/[0.07]"
                : "border-[var(--theme-accent)] bg-[var(--card-bg)] border-y border-l border-y-[var(--card-border)] border-l-[var(--card-border)]"
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

            {ann.imageUrl && (
              <div className="mt-2.5 flex justify-center w-full">
                <div
                  className="relative w-full max-w-[220px] sm:max-w-[260px] h-28 sm:h-36 rounded-lg overflow-hidden border border-black/10 dark:border-white/10 cursor-pointer group shadow-xs"
                  onClick={() => setLightboxImage({ url: ann.imageUrl!, title: ann.title })}
                  title="לחץ להגדלה"
                >
                  <Image
                    src={ann.imageUrl}
                    alt={ann.title}
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 220px, 260px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-[11px] px-2 py-0.5 rounded-full backdrop-blur-xs">
                      🔍 לחץ להגדלה
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div className="lightbox-overlay" onClick={() => setLightboxImage(null)}>
          <div className="lightbox-box" onClick={(e) => e.stopPropagation()}>
            <button
              className="lightbox-close"
              onClick={() => setLightboxImage(null)}
              aria-label="סגור"
            >
              ✕
            </button>
            <div className="lightbox-img-wrap">
              <Image
                src={lightboxImage.url}
                alt={lightboxImage.title}
                fill
                unoptimized
                sizes="90vw"
                className="object-contain"
              />
            </div>
            {lightboxImage.title && (
              <p className="lightbox-caption">{lightboxImage.title}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
