import type { Metadata } from "next";
import { Alef } from "next/font/google";
import "./globals.css";

const alef = Alef({
  weight: ["400", "700"],
  subsets: ["hebrew"],
  variable: "--font-alef",
});

export const metadata: Metadata = {
  title: "שכבת ח׳ — בן גוריון הרצליה",
  description: "אתר שכבת ח׳ בבית ספר בן גוריון הרצליה",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${alef.variable} h-full dark`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme');
                  if (savedTheme === 'light' || (!savedTheme && window.matchMedia('(prefers-color-scheme: light)').matches)) {
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })()
            `,
          }}
        />
      </head>
      <body className="min-h-full font-alef antialiased">{children}</body>
    </html>
  );
}
