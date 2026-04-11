import Link from "next/link";

const classes = [
  { id: "kita1", label: "כיתה ז׳1", num: "1" },
  { id: "kita2", label: "כיתה ז׳2", num: "2" },
  { id: "kita3", label: "כיתה ז׳3", num: "3" },
  { id: "kita4", label: "כיתה ז׳4", num: "4" },
  { id: "kita5", label: "כיתה ז׳5", num: "5" },
];

export default function Home() {
  return (
    <>
      {/* Geometric background */}
      <div aria-hidden="true" className="geo-bg">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ position: "absolute", inset: 0 }}>
          {/* Rings — top right */}
          <circle cx="95%" cy="-80" r="500" fill="none" stroke="rgba(124,58,237,0.07)" strokeWidth="1.5" />
          <circle cx="95%" cy="-80" r="370" fill="none" stroke="rgba(124,58,237,0.055)" strokeWidth="1" />
          <circle cx="95%" cy="-80" r="240" fill="none" stroke="rgba(124,58,237,0.04)" strokeWidth="1" />
          {/* Rings — bottom left */}
          <circle cx="-4%" cy="105%" r="340" fill="none" stroke="rgba(59,130,246,0.065)" strokeWidth="1.5" />
          <circle cx="-4%" cy="105%" r="210" fill="none" stroke="rgba(59,130,246,0.04)" strokeWidth="1" />
          {/* Diagonal lines */}
          <line x1="60%" y1="0%" x2="100%" y2="25%" stroke="rgba(124,58,237,0.05)" strokeWidth="1" />
          <line x1="72%" y1="0%" x2="100%" y2="16%" stroke="rgba(124,58,237,0.03)" strokeWidth="1" />
          {/* Small ring — center left */}
          <circle cx="4%" cy="50%" r="90" fill="none" stroke="rgba(99,102,241,0.055)" strokeWidth="1" />
          <circle cx="4%" cy="50%" r="55" fill="none" stroke="rgba(99,102,241,0.035)" strokeWidth="1" />
        </svg>
      </div>

      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16" style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div className="text-center mb-3 flex flex-col items-center gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/school-logo.png"
            alt="חטיבת הביניים בן גוריון הרצליה"
            width={80}
            height={80}
            style={{ filter: "brightness(0) invert(1)", objectFit: "contain", opacity: 0.9 }}
          />
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm text-muted-foreground tracking-widest uppercase" style={{ letterSpacing: "0.18em" }}>
              חטיבת הביניים בן גוריון הרצליה
            </p>
            <h1 className="text-6xl font-bold text-foreground" style={{ letterSpacing: "-0.01em" }}>שכבת ז׳</h1>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 48, height: 2, background: "linear-gradient(90deg, transparent, rgba(124,58,237,0.6), transparent)", margin: "28px 0 40px" }} />

        {/* Class cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 w-full max-w-3xl">
          {classes.map((cls) => (
            <Link
              key={cls.id}
              href={`/${cls.id}`}
              className="class-card relative flex flex-col items-center justify-center py-10 px-4 rounded-2xl text-lg font-bold text-foreground overflow-hidden"
            >
              {/* Big faded number in background */}
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  bottom: -10,
                  left: "50%",
                  transform: "translateX(-50%)",
                  fontSize: "6rem",
                  fontWeight: 900,
                  lineHeight: 1,
                  color: "rgba(255,255,255,0.04)",
                  userSelect: "none",
                  pointerEvents: "none",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {cls.num}
              </span>
              <span style={{ position: "relative", zIndex: 1 }}>{cls.label}</span>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
