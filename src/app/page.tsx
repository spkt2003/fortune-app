"use client";

import { useState } from "react";
import CameraCapture from "@/components/camera/CameraCapture";
import IntroConsent from "@/components/consent/IntroConsent";

export default function Home() {
  const [accepted, setAccepted] = useState(false);

  return (
    <main className="flex flex-1 items-center justify-center p-6 print:bg-white">
      {accepted ? (
        <>
          <h1 className="sr-only">ระบบทำนายโหงวเฮ้ง — ถ่ายภาพใบหน้าเพื่อรับคำทำนาย</h1>
          <CameraCapture />
        </>
      ) : (
        <IntroConsent onAccept={() => setAccepted(true)} />
      )}
    </main>
  );
}
