import type { Metadata } from "next";
import { Pridi, Prompt } from "next/font/google";
import "./globals.css";

const pridi = Pridi({
  variable: "--font-pridi",
  subsets: ["thai", "latin"],
  weight: ["500", "600", "700"],
});

const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500"],
});

export const metadata: Metadata = {
  title: "ระบบทำนายโหงวเฮ้ง",
  description: "แอปทำนายโหงวเฮ้งจากลักษณะใบหน้า สำหรับงาน Co-op Open House",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${pridi.variable} ${prompt.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-ink font-sans text-parchment print:bg-white print:text-black">
        {children}
      </body>
    </html>
  );
}
