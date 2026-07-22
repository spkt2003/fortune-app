"use client";

import { useCamera } from "@/hooks/useCamera";
import CameraView from "./CameraView";
import CaptureControls from "./CaptureControls";
import CameraError from "./CameraError";
import ConfirmedPreview from "./ConfirmedPreview";

export default function CameraCapture() {
  const camera = useCamera();

  if (camera.status === "confirmed" && camera.capturedImage) {
    return <ConfirmedPreview imageSrc={camera.capturedImage} onRetake={camera.retake} />;
  }

  if (camera.status === "error" && camera.error) {
    return (
      <CameraError
        message={camera.error.message}
        action={camera.error.action}
        onRetry={camera.open}
        onClose={camera.dismissError}
      />
    );
  }

  if (camera.status === "captured" && camera.capturedImage) {
    return (
      <div className="flex flex-col items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={camera.capturedImage}
          alt="ภาพที่ถ่ายไว้"
          className="w-full max-w-md rounded-lg"
        />
        <CaptureControls status="captured" onConfirm={camera.confirm} onRetake={camera.retake} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <CameraView videoRef={camera.videoRef} showOverlay={camera.status === "streaming"} />
      {camera.status === "opening" ? (
        <CaptureControls status="opening" />
      ) : camera.status === "streaming" ? (
        <CaptureControls status="streaming" onCapture={camera.capture} />
      ) : (
        <CaptureControls status="idle" onOpen={camera.open} />
      )}
    </div>
  );
}
