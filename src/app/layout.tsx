import type { Metadata } from "next";
import { Taviraj, Sarabun } from "next/font/google";
import "./globals.css";

const taviraj = Taviraj({
  variable: "--font-taviraj",
  subsets: ["thai", "latin"],
  weight: ["600", "700"],
});

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Fortune App",
  description: "Co-op open house fortune-telling app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${taviraj.variable} ${sarabun.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ink font-sans text-parchment print:bg-white print:text-black">
        {children}
      </body>
    </html>
  );
}
