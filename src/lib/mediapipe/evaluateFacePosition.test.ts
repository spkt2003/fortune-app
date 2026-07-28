import { describe, expect, it } from "vitest";
import { FaceLandmarker } from "@mediapipe/tasks-vision";
import type { Matrix, NormalizedLandmark } from "@mediapipe/tasks-vision";
import { regionIndices } from "./faceGeometry";
import { evaluateFacePosition } from "./evaluateFacePosition";

const LANDMARK_COUNT = 468;
const OVAL_IDX = regionIndices(FaceLandmarker.FACE_LANDMARKS_FACE_OVAL);

function point(x: number, y: number): NormalizedLandmark {
  return { x, y, z: 0, visibility: 1 };
}

function buildLandmarks(ovalRadiusX: number): NormalizedLandmark[] {
  const landmarks: NormalizedLandmark[] = Array.from({ length: LANDMARK_COUNT }, () =>
    point(0.5, 0.5),
  );
  OVAL_IDX.forEach((idx, i) => {
    const angle = (i / OVAL_IDX.length) * 2 * Math.PI;
    landmarks[idx] = point(0.5 + ovalRadiusX * Math.cos(angle), 0.5 + 0.35 * Math.sin(angle));
  });
  return landmarks;
}

function identityMatrix(): Matrix {
  return { rows: 4, columns: 4, data: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] };
}

function yawMatrix(degrees: number): Matrix {
  const rad = (degrees * Math.PI) / 180;
  const data = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  data[0] = Math.cos(rad);
  data[1] = Math.sin(rad);
  return { rows: 4, columns: 4, data };
}

describe("evaluateFacePosition", () => {
  it("returns no-face when landmarks are null", () => {
    expect(evaluateFacePosition(null, identityMatrix())).toBe("no-face");
  });

  it("returns no-face when landmarks array is empty", () => {
    expect(evaluateFacePosition([], identityMatrix())).toBe("no-face");
  });

  it("returns tilted when the transform matrix shows a large yaw rotation", () => {
    const landmarks = buildLandmarks(0.25); // wide enough to pass the distance check on its own
    expect(evaluateFacePosition(landmarks, yawMatrix(30))).toBe("tilted");
  });

  it("returns too-far when the face oval is narrower than the minimum fraction", () => {
    const landmarks = buildLandmarks(0.08); // width 0.16 < 0.25 threshold
    expect(evaluateFacePosition(landmarks, identityMatrix())).toBe("too-far");
  });

  it("returns ok when facing the camera squarely and close enough", () => {
    const landmarks = buildLandmarks(0.25); // width 0.5 >= 0.25 threshold
    expect(evaluateFacePosition(landmarks, identityMatrix())).toBe("ok");
  });

  it("returns ok based on distance alone when no transform matrix is available", () => {
    const landmarks = buildLandmarks(0.25);
    expect(evaluateFacePosition(landmarks, null)).toBe("ok");
  });
});
