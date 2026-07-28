"use client";

import { useRef, useState } from "react";
import { useCamera } from "@/hooks/useCamera";
import { useFaceLandmarks } from "@/hooks/useFaceLandmarks";
import { useRealtimeFacePosition } from "@/hooks/useRealtimeFacePosition";
import { computeFaceFeatures, type FaceFeatures } from "@/lib/mediapipe/computeFaceFeatures";
import type { FortunePayload, FortuneResult, Gender } from "@/lib/fortune/payload";
import { requestFortune } from "@/lib/fortune/requestFortune";
import CameraView from "./CameraView";
import CaptureControls from "./CaptureControls";
import CameraError from "./CameraError";
import ConfirmedPreview from "./ConfirmedPreview";
import GenderAgeForm from "@/components/demographics/GenderAgeForm";
import FortuneResultCards from "@/components/fortune/FortuneResultCards";
import ShrineFrame from "@/components/ui/ShrineFrame";

type ConfirmIssue = "no-face" | "detection-error" | null;

type FortuneState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; result: FortuneResult }
  | { status: "error"; message: string };

export default function CameraCapture() {
  const camera = useCamera();
  const faceLandmarks = useFaceLandmarks();
  const facePositionStatus = useRealtimeFacePosition(camera.videoRef, camera.status === "streaming");
  const [confirmIssue, setConfirmIssue] = useState<ConfirmIssue>(null);
  const [faceFeatures, setFaceFeatures] = useState<FaceFeatures | null>(null);
  const [fortuneState, setFortuneState] = useState<FortuneState>({ status: "idle" });
  const [lastPayload, setLastPayload] = useState<FortunePayload | null>(null);
  const requestIdRef = useRef(0);

  const handleConfirm = async () => {
    if (!camera.capturedImage) return;
    try {
      const landmarks = await faceLandmarks.detect(camera.capturedImage);
      if (landmarks) {
        setConfirmIssue(null);
        setFaceFeatures(computeFaceFeatures(landmarks));
        camera.confirm();
      } else {
        setConfirmIssue("no-face");
      }
    } catch {
      setConfirmIssue("detection-error");
    }
  };

  const handleRetake = () => {
    requestIdRef.current++;
    setConfirmIssue(null);
    setFaceFeatures(null);
    setFortuneState({ status: "idle" });
    setLastPayload(null);
    camera.retake();
  };

  const submitPayload = async (payload: FortunePayload) => {
    const requestId = ++requestIdRef.current;
    setLastPayload(payload);
    setFortuneState({ status: "loading" });
    const result = await requestFortune(payload);
    if (requestIdRef.current !== requestId) return;
    setFortuneState(
      result.ok ? { status: "success", result: result.result } : { status: "error", message: result.message },
    );
  };

  const handleSubmit = (demographics: { gender: Gender; age: number }) => {
    if (!faceFeatures) return;
    submitPayload({ faceFeatures, ...demographics });
  };

  const handleRetry = () => {
    if (lastPayload) submitPayload(lastPayload);
  };

  if (camera.status === "confirmed" && camera.capturedImage) {
    return (
      <ConfirmedPreview imageSrc={camera.capturedImage} onRetake={handleRetake}>
        {fortuneState.status === "idle" && <GenderAgeForm onSubmit={handleSubmit} />}
        {fortuneState.status === "loading" && (
          <p className="text-center text-sm text-gold/80">กำลังทำนายผล...</p>
        )}
        {fortuneState.status === "error" && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm text-amber-400">{fortuneState.message}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-full bg-black px-6 py-3 text-white dark:bg-white dark:text-black"
            >
              ลองใหม่
            </button>
          </div>
        )}
        {fortuneState.status === "success" && <FortuneResultCards result={fortuneState.result} />}
      </ConfirmedPreview>
    );
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
      <ShrineFrame className="flex flex-col items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={camera.capturedImage}
          alt="ภาพที่ถ่ายไว้"
          className="w-full max-w-md rounded-lg"
        />
        <CaptureControls status="captured" onConfirm={handleConfirm} onRetake={camera.retake} />
        {faceLandmarks.status === "detecting" && (
          <p className="text-sm text-gold/80">กำลังตรวจสอบใบหน้า...</p>
        )}
      </ShrineFrame>
    );
  }

  return (
    <ShrineFrame className="flex flex-col items-center gap-4">
      <CameraView
        videoRef={camera.videoRef}
        showOverlay={camera.status === "streaming"}
        facePositionStatus={facePositionStatus}
      />
      {camera.status === "opening" ? (
        <CaptureControls status="opening" />
      ) : camera.status === "streaming" ? (
        <CaptureControls
          status="streaming"
          onCapture={camera.capture}
          disabled={facePositionStatus !== "good"}
        />
      ) : (
        <CaptureControls status="idle" onOpen={camera.open} />
      )}
    </ShrineFrame>
  );
}
