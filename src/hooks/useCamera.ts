"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  mapCameraError,
  UnsupportedCameraError,
  type CameraErrorInfo,
} from "@/lib/camera/mapCameraError";

export type CameraStatus = "idle" | "opening" | "streaming" | "captured" | "confirmed" | "error";

export interface UseCameraResult {
  status: CameraStatus;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  capturedImage: string | null;
  error: CameraErrorInfo | null;
  open: () => Promise<void>;
  capture: () => void;
  confirm: () => void;
  retake: () => void;
  dismissError: () => void;
}

const VIDEO_CONSTRAINTS: MediaStreamConstraints = {
  video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
  audio: false,
};

export function useCamera(): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<CameraErrorInfo | null>(null);

  const open = useCallback(async () => {
    setStatus("opening");
    setError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new UnsupportedCameraError();
      }
      const stream = await navigator.mediaDevices.getUserMedia(VIDEO_CONSTRAINTS);
      streamRef.current = stream;
      setStatus("streaming");
    } catch (err) {
      setError(mapCameraError(err));
      setStatus("error");
    }
  }, []);

  // Re-attach the persisted stream whenever a <video> element mounts while
  // streaming (initial open, and after retake re-mounts CameraView) — never
  // re-requests getUserMedia.
  useEffect(() => {
    if (status === "streaming" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [status]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Draw the raw (unmirrored) frame — CSS mirroring on <video> is display-only
    // and does not affect drawImage's source pixels. Never call ctx.scale(-1, 1)
    // here: the captured image must match the user's real left/right.
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCapturedImage(canvas.toDataURL("image/png"));
    setStatus("captured");
  }, []);

  const confirm = useCallback(() => {
    setStatus("confirmed");
  }, []);

  const retake = useCallback(() => {
    setCapturedImage(null);
    setStatus("streaming");
  }, []);

  const dismissError = useCallback(() => {
    setError(null);
    setStatus("idle");
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return { status, videoRef, capturedImage, error, open, capture, confirm, retake, dismissError };
}
