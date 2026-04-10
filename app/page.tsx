import Image from "next/image";
import Link from "next/link";

const classes = [
  { id: "kita1", label: "כיתה ז׳1" },
  { id: "kita2", label: "כיתה ז׳2" },
  { id: "kita3", label: "כיתה ז׳3" },
  { id: "kita4", label: "כיתה ז׳4" },
  { id: "kita5", label: "כיתה ז׳5" },
];

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="text-center mb-12 flex flex-col items-center gap-4">
        <Image
          src="/school-logo.png"
          alt="בית ספר בן גוריון הרצליה"
          width={72}
          height={72}
          className="object-contain"
          style={{ filter: "brightness(0) invert(1)" }}
        />
        <div>
          <p className="text-sm text-muted-foreground mb-1 tracking-widest">
            בית ספר בן גוריון הרצליה
          </p>
          <h1 className="text-5xl font-bold text-foreground">שכבת ז׳</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-2xl">
        {classes.map((cls) => (
          <Link
            key={cls.id}
            href={`/${cls.id}`}
            className="class-card flex items-center justify-center py-10 px-6 rounded-2xl text-xl font-bold text-foreground"
          >
            {cls.label}
          </Link>
        ))}
      </div>
    </main>
  );
}
