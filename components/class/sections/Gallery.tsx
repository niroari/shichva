"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";

interface GalleryPhoto {
  id: string;
  url: string;
  caption: string;
  createdAt: number;
}

export default function Gallery({ classId }: { classId: string }) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<GalleryPhoto | null>(null);

  useEffect(() => {
    getDocs(query(collection(db, "classes", classId, "gallery"), orderBy("createdAt", "desc")))
      .then((snap) => {
        setPhotos(snap.docs.map((d) => ({ id: d.id, ...d.data() } as GalleryPhoto)));
        setLoading(false);
      });
  }, [classId]);

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightbox) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setLightbox(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox]);

  if (loading || photos.length === 0) return null;

  return (
    <>
      <section id="gallery" className="py-16 border-t border-white/10">
        <h2 className="text-2xl font-bold text-foreground mb-6">גלריה</h2>
        <div className="gallery-grid">
          {photos.map((photo) => (
            <button
              key={photo.id}
              className="gallery-thumb"
              onClick={() => setLightbox(photo)}
              title={photo.caption || undefined}
            >
              <Image
                src={photo.url}
                alt={photo.caption || "תמונה"}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div className="lightbox-overlay" onClick={() => setLightbox(null)}>
          <div className="lightbox-box" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setLightbox(null)}>✕</button>
            <div className="lightbox-img-wrap">
              <Image
                src={lightbox.url}
                alt={lightbox.caption || "תמונה"}
                fill
                sizes="90vw"
                className="object-contain"
              />
            </div>
            {lightbox.caption && (
              <p className="lightbox-caption">{lightbox.caption}</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
