"use client";

import { useState } from "react";
import CameraCapture from "@/components/camera/CameraCapture";
import IntroConsent from "@/components/consent/IntroConsent";

export default function Home() {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 p-6 dark:bg-black">
      {accepted ? <CameraCapture /> : <IntroConsent onAccept={() => setAccepted(true)} />}
    </div>
  );
}
