import { notFound } from "next/navigation";
import ClassNav from "@/components/class/ClassNav";
import Announcements from "@/components/class/sections/Announcements";
import Schedule from "@/components/class/sections/Schedule";
import Events from "@/components/class/sections/Events";
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
      <ClassNav classLabel={classLabel} />

      <main className="pt-20 max-w-3xl mx-auto px-4">

        <div className="text-center py-16">
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

        <section id="teachers" className="py-16 border-t border-white/10">
          <h2 className="text-2xl font-bold text-foreground mb-6">צוות המורים</h2>
          <p className="text-muted-foreground">בקרוב...</p>
        </section>

        <section id="seating" className="py-16 border-t border-white/10">
          <h2 className="text-2xl font-bold text-foreground mb-6">מקומות ישיבה</h2>
          <p className="text-muted-foreground">בקרוב...</p>
        </section>

        <section id="links" className="py-16 border-t border-white/10">
          <h2 className="text-2xl font-bold text-foreground mb-6">קישורים חשובים</h2>
          <QuickLinks />
        </section>

      </main>
    </>
  );
}
