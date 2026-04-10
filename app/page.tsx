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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/school-logo.png"
          alt="חטיבת הביניים בן גוריון הרצליה"
          width={86}
          height={86}
          style={{ filter: "brightness(0) invert(1)", objectFit: "contain" }}
        />
        <div>
          <p className="text-sm text-muted-foreground mb-1 tracking-widest">
            חטיבת הביניים בן גוריון הרצליה
          </p>
          <h1 className="text-5xl font-bold text-foreground">שכבת ז׳</h1>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 w-full max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
          {classes.slice(0, 3).map((cls) => (
            <Link
              key={cls.id}
              href={`/${cls.id}`}
              className="class-card flex items-center justify-center py-10 px-6 rounded-2xl text-xl font-bold text-foreground"
            >
              {cls.label}
            </Link>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full md:w-2/3">
          {classes.slice(3).map((cls) => (
            <Link
              key={cls.id}
              href={`/${cls.id}`}
              className="class-card flex items-center justify-center py-10 px-6 rounded-2xl text-xl font-bold text-foreground"
            >
              {cls.label}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
