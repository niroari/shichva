import type { Metadata } from "next";
import { Alef } from "next/font/google";
import "./globals.css";

const alef = Alef({
  weight: ["400", "700"],
  subsets: ["hebrew"],
  variable: "--font-alef",
});

export const metadata: Metadata = {
  title: "שכבת ז׳ — בן גוריון הרצליה",
  description: "אתר שכבת ז׳ בבית ספר בן גוריון הרצליה",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${alef.variable} h-full`}>
      <body className="min-h-full font-alef antialiased">{children}</body>
    </html>
  );
}
