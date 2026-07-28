"use client";

import { useEffect, useRef, useState } from "react";
import { getFaceLandmarker, setLandmarkerMode } from "@/lib/mediapipe/faceLandmarker";
import { mapLandmarkResult, mapTransformMatrix } from "@/lib/mediapipe/mapLandmarkResult";
import { evaluateFacePosition } from "@/lib/mediapipe/evaluateFacePosition";

export type RealtimeFaceStatus = "no-face" | "tilted" | "too-far" | "good" | "unavailable";

const CHECK_INTERVAL_MS = 250;
const STABLE_DURATION_MS = 500;
// Safety valve: if the real-time check never reaches "good" within this
// window (unusual face geometry the model can't read, glasses/hat/backlight,
// or thresholds tuned too strict for this booth), unlock the capture button
// anyway rather than trap the visitor at the camera screen forever — the
// one-shot post-capture check (useFaceLandmarks.detect) remains the safety
// net either way.
const UNAVAILABLE_TIMEOUT_MS = 10000;

// Runs a throttled MediaPipe check on the live <video> while `active` is
// true (i.e. the camera is streaming, before capture). Deliberately never
// reports the instantaneous "ok" state to the caller: per design, the
// overlay should keep showing the last problem message (or nothing, before
// the first check) until the face has been "ok" continuously for
// STABLE_DURATION_MS, at which point it flips straight to "good" — this
// avoids the overlay text flickering between "ok" and a specific complaint
// on every borderline frame.
export function useRealtimeFacePosition(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  active: boolean,
): RealtimeFaceStatus {
  const [status, setStatus] = useState<RealtimeFaceStatus>("no-face");
  const okSinceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!active) {
      okSinceRef.current = null;
      // Resetting to the idle "no-face" state when the camera stream stops
      // is a deliberate one-off sync of internal state to the `active` prop
      // (not an update triggered by an external subscription), which is
      // exactly the pattern this lint rule otherwise guards against loops of.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("no-face");
      return;
    }

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;
    let reachedGood = false;

    const timeoutId = setTimeout(() => {
      if (cancelled || reachedGood) return;
      if (intervalId) clearInterval(intervalId);
      setStatus("unavailable");
    }, UNAVAILABLE_TIMEOUT_MS);

    setLandmarkerMode("VIDEO")
      .then(() => getFaceLandmarker())
      .then((landmarker) => {
        if (cancelled) return;
        intervalId = setInterval(() => {
          const video = videoRef.current;
          if (!video || video.readyState < 2) return;

          let result;
          try {
            result = landmarker.detectForVideo(video, performance.now());
          } catch {
            // The landmarker may briefly be mid-switch to IMAGE mode (the
            // confirm-step fallback check racing this loop's teardown) —
            // skip this tick rather than let the throw kill the interval's
            // callback silently forever with no user-visible outcome.
            return;
          }

          const landmarks = mapLandmarkResult(result);
          const transformMatrix = mapTransformMatrix(result);
          const instant = evaluateFacePosition(landmarks, transformMatrix);

          if (instant !== "ok") {
            okSinceRef.current = null;
            setStatus(instant);
            return;
          }

          const now = performance.now();
          if (okSinceRef.current === null) okSinceRef.current = now;
          if (now - okSinceRef.current >= STABLE_DURATION_MS) {
            reachedGood = true;
            setStatus("good");
          }
          // else: still within the debounce window — leave status as-is
        }, CHECK_INTERVAL_MS);
      })
      .catch(() => {
        if (!cancelled) setStatus("unavailable");
      });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [active, videoRef]);

  return status;
}
