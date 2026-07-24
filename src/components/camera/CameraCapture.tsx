"use client";

import { useState } from "react";
import { useCamera } from "@/hooks/useCamera";
import { useFaceLandmarks } from "@/hooks/useFaceLandmarks";
import CameraView from "./CameraView";
import CaptureControls from "./CaptureControls";
import CameraError from "./CameraError";
import ConfirmedPreview from "./ConfirmedPreview";

type ConfirmIssue = "no-face" | "detection-error" | null;

export default function CameraCapture() {
  const camera = useCamera();
  const faceLandmarks = useFaceLandmarks();
  const [confirmIssue, setConfirmIssue] = useState<ConfirmIssue>(null);

  const handleConfirm = async () => {
    if (!camera.capturedImage) return;
    try {
      const landmarks = await faceLandmarks.detect(camera.capturedImage);
      if (landmarks) {
        setConfirmIssue(null);
        camera.confirm();
      } else {
        setConfirmIssue("no-face");
      }
    } catch {
      setConfirmIssue("detection-error");
    }
  };

  const handleRetake = () => {
    setConfirmIssue(null);
    camera.retake();
  };

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
    if (confirmIssue === "no-face") {
      return (
        <CameraError
          message="ไม่พบใบหน้าในภาพ กรุณาถ่ายใหม่ให้เห็นใบหน้าชัดเจน"
          action="retry"
          onRetry={handleRetake}
          onClose={handleRetake}
        />
      );
    }

    if (confirmIssue === "detection-error") {
      return (
        <CameraError
          message="ระบบตรวจจับใบหน้าใช้งานไม่ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง"
          action="close"
          onRetry={handleRetake}
          onClose={handleRetake}
        />
      );
    }

    return (
      <div className="flex flex-col items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={camera.capturedImage}
          alt="ภาพที่ถ่ายไว้"
          className="w-full max-w-md rounded-lg"
        />
        <CaptureControls status="captured" onConfirm={handleConfirm} onRetake={camera.retake} />
        {faceLandmarks.status === "detecting" && (
          <p className="text-sm text-zinc-500">กำลังตรวจสอบใบหน้า...</p>
        )}
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
