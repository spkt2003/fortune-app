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
  retake: () => Promise<void>;
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

  // Shared by open() and retake() (when retake needs to re-acquire a stream
  // that was already stopped after confirm()). Returns whether it succeeded;
  // on failure it has already set the error/status state itself.
  const requestStream = useCallback(async (): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new UnsupportedCameraError();
      }
      const stream = await navigator.mediaDevices.getUserMedia(VIDEO_CONSTRAINTS);
      streamRef.current = stream;
      return true;
    } catch (err) {
      setError(mapCameraError(err));
      setStatus("error");
      return false;
    }
  }, []);

  const open = useCallback(async () => {
    setStatus("opening");
    setError(null);
    if (await requestStream()) setStatus("streaming");
  }, [requestStream]);

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
    // videoWidth/videoHeight stay 0 until the video element has decoded its
    // first frame; capturing before that produces a blank image that later
    // gets misreported as "no face found" instead of the real cause.
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;
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

  // Once a photo is confirmed, only the still image is shown from here on
  // (results, printing) — stop the live stream so the webcam's hardware LED
  // turns off instead of staying lit for the rest of the session.
  const confirm = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setStatus("confirmed");
  }, []);

  const retake = useCallback(async () => {
    setCapturedImage(null);
    const streamIsLive = streamRef.current?.getTracks().some((track) => track.readyState === "live");
    if (streamIsLive) {
      setStatus("streaming");
      return;
    }
    // Stream was stopped by confirm() (retake from the confirmed/results
    // screen) — re-request it rather than showing a frozen/black feed.
    setStatus("opening");
    setError(null);
    if (await requestStream()) setStatus("streaming");
  }, [requestStream]);

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
