import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let landmarkerPromise: Promise<FaceLandmarker> | null = null;

// Single-photo detection per booth visitor doesn't need GPU throughput, and
// CPU delegate sidesteps WebGL context quirks on the event laptop's onboard graphics.
export function getFaceLandmarker(): Promise<FaceLandmarker> {
  if (!landmarkerPromise) {
    landmarkerPromise = FilesetResolver.forVisionTasks("/mediapipe/wasm").then((fileset) =>
      FaceLandmarker.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath: "/mediapipe/face_landmarker.task",
          delegate: "CPU",
        },
        runningMode: "IMAGE",
        numFaces: 1,
        outputFacialTransformationMatrixes: true,
      }),
    );
  }
  return landmarkerPromise;
}

// Ticket 9: the same FaceLandmarker instance is reused for both the
// continuous real-time check on the live video (VIDEO mode) and the
// one-shot confirm-step check on the captured still frame (IMAGE mode) —
// switching modes is cheap and only happens twice per capture, so a second
// instance (another WASM + model load) isn't worth the extra memory on the
// booth laptop's onboard graphics.
export async function setLandmarkerMode(runningMode: "IMAGE" | "VIDEO"): Promise<void> {
  const landmarker = await getFaceLandmarker();
  await landmarker.setOptions({ runningMode });
}
