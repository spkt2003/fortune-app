import { FaceLandmarker } from "@mediapipe/tasks-vision";
import type { Matrix, NormalizedLandmark } from "@mediapipe/tasks-vision";
import { regionIndices, width, type Point2D } from "./faceGeometry";

export type FacePositionStatus = "no-face" | "tilted" | "too-far" | "ok";

// Initial defaults — tune against a real webcam during manual test (Task 3).
const MAX_TILT_DEGREES = 15;
const MIN_FACE_WIDTH_FRACTION = 0.25;

// Hoisted out of the function body: this runs on every tick of the ~250ms
// real-time loop (Task 2), so the region-index lookup (a spread + Set dedup
// over the connector list) is computed once per module load, not per call.
const OVAL_IDX = regionIndices(FaceLandmarker.FACE_LANDMARKS_FACE_OVAL);

function pointsFor(landmarks: NormalizedLandmark[], indices: number[]): Point2D[] {
  return indices.map((i) => landmarks[i]);
}

// The facial transformation matrix is a flattened 4x4 in COLUMN-MAJOR order
// (MediaPipe docs), so R[row][col] = data[col * 4 + row]. We only need the
// rotation submatrix (rows/cols 0-2) to estimate how far off-axis the face
// is; we don't care which physical axis (pitch/yaw/roll) is which, since
// every axis maps to the same single overlay message.
function tiltDegrees(transformMatrix: Matrix): number {
  const d = transformMatrix.data;
  const r00 = d[0];
  const r10 = d[1];
  const r20 = d[2];
  const r21 = d[6];
  const r22 = d[10];

  const pitchRad = Math.atan2(-r20, Math.sqrt(r00 * r00 + r10 * r10));
  const yawRad = Math.atan2(r10, r00);
  const rollRad = Math.atan2(r21, r22);

  const toDeg = (rad: number) => Math.abs((rad * 180) / Math.PI);
  return Math.max(toDeg(pitchRad), toDeg(yawRad), toDeg(rollRad));
}

export function evaluateFacePosition(
  landmarks: NormalizedLandmark[] | null,
  transformMatrix: Matrix | null,
): FacePositionStatus {
  if (!landmarks || landmarks.length === 0) return "no-face";

  if (transformMatrix && tiltDegrees(transformMatrix) > MAX_TILT_DEGREES) {
    return "tilted";
  }

  const ovalPoints = pointsFor(landmarks, OVAL_IDX);
  const faceWidthFraction = width(ovalPoints); // landmarks are normalized [0,1], so this IS the frame-width fraction
  if (faceWidthFraction < MIN_FACE_WIDTH_FRACTION) return "too-far";

  return "ok";
}
