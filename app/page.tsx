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
      <div className="text-center mb-12">
        <p className="text-sm text-muted-foreground mb-3 tracking-widest uppercase">
          בית ספר בן גוריון הרצליה
        </p>
        <h1 className="text-5xl font-bold text-foreground">שכבת ז׳</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-2xl">
        {classes.map((cls) => (
          <Link
            key={cls.id}
            href={`/${cls.id}`}
            className="flex items-center justify-center py-10 px-6 rounded-2xl text-xl font-bold text-foreground bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-200"
          >
            {cls.label}
          </Link>
        ))}
      </div>
    </main>
  );
}
