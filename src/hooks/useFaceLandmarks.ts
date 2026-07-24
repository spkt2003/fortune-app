"use client";

import { useCallback, useEffect, useState } from "react";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { getFaceLandmarker } from "@/lib/mediapipe/faceLandmarker";
import { mapLandmarkResult } from "@/lib/mediapipe/mapLandmarkResult";

export type FaceLandmarksStatus = "idle" | "detecting";

export interface UseFaceLandmarksResult {
  status: FaceLandmarksStatus;
  detect: (imageDataUrl: string) => Promise<NormalizedLandmark[] | null>;
}

export function useFaceLandmarks(): UseFaceLandmarksResult {
  const [status, setStatus] = useState<FaceLandmarksStatus>("idle");

  // Warm the singleton FaceLandmarker (WASM + model load) as soon as the
  // camera screen mounts, so it's likely ready by the time the user confirms.
  useEffect(() => {
    getFaceLandmarker().catch(() => {});
  }, []);

  const detect = useCallback(async (imageDataUrl: string) => {
    setStatus("detecting");
    try {
      const landmarker = await getFaceLandmarker();
      const image = await loadImage(imageDataUrl);
      const result = landmarker.detect(image);
      return mapLandmarkResult(result);
    } finally {
      setStatus("idle");
    }
  }, []);

  return { status, detect };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("โหลดรูปภาพไม่สำเร็จ"));
    img.src = src;
  });
}
