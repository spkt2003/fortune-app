import type { FaceLandmarkerResult, Matrix, NormalizedLandmark } from "@mediapipe/tasks-vision";

export function mapLandmarkResult(result: FaceLandmarkerResult): NormalizedLandmark[] | null {
  const landmarks = result.faceLandmarks[0];
  return landmarks && landmarks.length > 0 ? landmarks : null;
}

export function mapTransformMatrix(result: FaceLandmarkerResult): Matrix | null {
  return result.facialTransformationMatrixes[0] ?? null;
}
