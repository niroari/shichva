import { notFound } from "next/navigation";
import ClassNav from "@/components/class/ClassNav";
import Announcements from "@/components/class/sections/Announcements";
import Schedule from "@/components/class/sections/Schedule";
import Events from "@/components/class/sections/Events";
import Seating from "@/components/class/sections/Seating";
import Teachers from "@/components/class/sections/Teachers";
import QuickLinks from "@/components/class/sections/QuickLinks";

const classLabels: Record<string, string> = {
  kita1: "כיתה ז׳1",
  kita2: "כיתה ז׳2",
  kita3: "כיתה ז׳3",
  kita4: "כיתה ז׳4",
  kita5: "כיתה ז׳5",
};

export default async function ClassPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const classLabel = classLabels[classId];

  if (!classLabel) notFound();

  return (
    <>
      {/* Geometric background */}
      <div aria-hidden="true" className="geo-bg">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", inset: 0 }}>
          {/* Rings — top right */}
          <circle cx="92%" cy="-60" r="440" fill="none" stroke="rgba(124,58,237,0.07)" strokeWidth="1.5" />
          <circle cx="92%" cy="-60" r="320" fill="none" stroke="rgba(124,58,237,0.055)" strokeWidth="1" />
          <circle cx="92%" cy="-60" r="200" fill="none" stroke="rgba(124,58,237,0.04)" strokeWidth="1" />
          {/* Rings — bottom left */}
          <circle cx="-4%" cy="88%" r="300" fill="none" stroke="rgba(59,130,246,0.065)" strokeWidth="1.5" />
          <circle cx="-4%" cy="88%" r="190" fill="none" stroke="rgba(59,130,246,0.045)" strokeWidth="1" />
          {/* Diagonal accent lines — top right */}
          <line x1="65%" y1="0%" x2="100%" y2="22%" stroke="rgba(124,58,237,0.055)" strokeWidth="1" />
          <line x1="75%" y1="0%" x2="100%" y2="14%" stroke="rgba(124,58,237,0.035)" strokeWidth="1" />
          <line x1="55%" y1="0%" x2="100%" y2="30%" stroke="rgba(124,58,237,0.025)" strokeWidth="1" />
          {/* Small decorative ring — center-left */}
          <circle cx="5%" cy="42%" r="80" fill="none" stroke="rgba(99,102,241,0.06)" strokeWidth="1" />
          <circle cx="5%" cy="42%" r="50" fill="none" stroke="rgba(99,102,241,0.04)" strokeWidth="1" />
        </svg>
      </div>

      <ClassNav classLabel={classLabel} />

      <main className="pt-20 max-w-3xl mx-auto px-4" style={{ position: "relative", zIndex: 1 }}>

        <div className="text-center py-16 flex flex-col items-center gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/school-logo.png"
            alt="חטיבת הביניים בן גוריון הרצליה"
            width={86}
            height={86}
            style={{ filter: "brightness(0) invert(1)", objectFit: "contain" }}
          />
          <h1 className="text-4xl font-bold text-foreground">{classLabel}</h1>
        </div>

        <section id="announcements" className="py-16 border-t border-white/10">
          <h2 className="text-2xl font-bold text-foreground mb-6">הודעות המחנך</h2>
          <Announcements classId={classId} />
        </section>

        <section id="schedule" className="py-16 border-t border-white/10">
          <h2 className="text-2xl font-bold text-foreground mb-6">מערכת שעות</h2>
          <Schedule classId={classId} />
        </section>

        <section id="events" className="py-16 border-t border-white/10">
          <h2 className="text-2xl font-bold text-foreground mb-6">אירועים ומבחנים</h2>
          <Events classId={classId} />
        </section>

        <section id="seating" className="py-16 border-t border-white/10">
          <h2 className="text-2xl font-bold text-foreground mb-6">מקומות ישיבה</h2>
          <Seating classId={classId} />
        </section>

        <section id="teachers" className="py-16 border-t border-white/10">
          <h2 className="text-2xl font-bold text-foreground mb-6">צוות המורים</h2>
          <Teachers classId={classId} />
        </section>

        <section id="links" className="py-16 border-t border-white/10">
          <h2 className="text-2xl font-bold text-foreground mb-6">קישורים חשובים</h2>
          <QuickLinks />
        </section>

      </main>
    </>
  );
}
