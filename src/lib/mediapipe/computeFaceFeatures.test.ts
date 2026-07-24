import { describe, expect, it } from "vitest";
import { FaceLandmarker } from "@mediapipe/tasks-vision";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import { regionIndices } from "./faceGeometry";
import { computeFaceFeatures, type FaceFeatures } from "./computeFaceFeatures";

const LANDMARK_COUNT = 468;

const OVAL_IDX = regionIndices(FaceLandmarker.FACE_LANDMARKS_FACE_OVAL);
const EYE_CLUSTER_A_IDX = regionIndices(FaceLandmarker.FACE_LANDMARKS_LEFT_EYE);
const EYE_CLUSTER_B_IDX = regionIndices(FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE);
const BROW_CLUSTER_A_IDX = regionIndices(FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW);
const BROW_CLUSTER_B_IDX = regionIndices(FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW);
const LIPS_IDX = regionIndices(FaceLandmarker.FACE_LANDMARKS_LIPS);

const NOSE_BRIDGE = 168;
const NOSE_TIP = 4;
const NOSE_BASE = 2;
const NOSE_ALA_A = 129;
const NOSE_ALA_B = 358;
const UPPER_LIP_OUTER_TOP = 0;
const UPPER_LIP_INNER = 13;
const LOWER_LIP_INNER = 14;
const LOWER_LIP_OUTER_BOTTOM = 17;

function point(x: number, y: number): NormalizedLandmark {
  return { x, y, z: 0, visibility: 1 };
}

function ellipseOverrides(
  indices: number[],
  center: { x: number; y: number },
  radius: { x: number; y: number },
): Array<[number, NormalizedLandmark]> {
  return indices.map((idx, i) => {
    const angle = (i / indices.length) * 2 * Math.PI;
    return [
      idx,
      point(center.x + radius.x * Math.cos(angle), center.y + radius.y * Math.sin(angle)),
    ];
  });
}

interface FaceFixtureOptions {
  // "leftEye"/"rightEye" here mean the subject's own left/right, per the
  // unmirrored-capture rule: the subject's left sits at the LARGER x (0.62 default).
  leftEyeCenter?: { x: number; y: number };
  leftEyeRadius?: { x: number; y: number };
  rightEyeCenter?: { x: number; y: number };
  rightEyeRadius?: { x: number; y: number };
}

function buildFaceLandmarks(options: FaceFixtureOptions = {}): NormalizedLandmark[] {
  const landmarks: NormalizedLandmark[] = Array.from({ length: LANDMARK_COUNT }, () =>
    point(0.5, 0.5),
  );

  const overrides = new Map<number, NormalizedLandmark>([
    ...ellipseOverrides(OVAL_IDX, { x: 0.5, y: 0.5 }, { x: 0.25, y: 0.35 }),
    ...ellipseOverrides(
      EYE_CLUSTER_A_IDX,
      options.leftEyeCenter ?? { x: 0.62, y: 0.45 },
      options.leftEyeRadius ?? { x: 0.05, y: 0.02 },
    ),
    ...ellipseOverrides(
      EYE_CLUSTER_B_IDX,
      options.rightEyeCenter ?? { x: 0.38, y: 0.45 },
      options.rightEyeRadius ?? { x: 0.05, y: 0.02 },
    ),
    ...ellipseOverrides(BROW_CLUSTER_A_IDX, { x: 0.62, y: 0.4 }, { x: 0.06, y: 0.01 }),
    ...ellipseOverrides(BROW_CLUSTER_B_IDX, { x: 0.38, y: 0.4 }, { x: 0.06, y: 0.01 }),
    ...ellipseOverrides(LIPS_IDX, { x: 0.5, y: 0.65 }, { x: 0.08, y: 0.02 }),
    [NOSE_BRIDGE, point(0.5, 0.45)],
    [NOSE_TIP, point(0.5, 0.55)],
    [NOSE_BASE, point(0.5, 0.58)],
    [NOSE_ALA_A, point(0.46, 0.57)],
    [NOSE_ALA_B, point(0.54, 0.57)],
    [UPPER_LIP_OUTER_TOP, point(0.5, 0.6)],
    [UPPER_LIP_INNER, point(0.5, 0.63)],
    [LOWER_LIP_INNER, point(0.5, 0.66)],
    [LOWER_LIP_OUTER_BOTTOM, point(0.5, 0.69)],
  ]);

  for (const [idx, p] of overrides) {
    landmarks[idx] = p;
  }
  return landmarks;
}

const FIELD_NAMES: Array<keyof FaceFeatures> = [
  "faceLengthToWidthRatio",
  "eyeDistanceToFaceWidthRatio",
  "leftEyeWidthToFaceWidthRatio",
  "rightEyeWidthToFaceWidthRatio",
  "eyebrowGapToEyeDistanceRatio",
  "noseWidthToFaceWidthRatio",
  "noseLengthToFaceHeightRatio",
  "mouthWidthToFaceWidthRatio",
  "upperLipToLowerLipThicknessRatio",
  "jawWidthToCheekboneWidthRatio",
  "foreheadHeightToFaceHeightRatio",
  "leftFaceHalfWidthRatio",
  "rightFaceHalfWidthRatio",
  "leftEyeSlantRatio",
  "rightEyeSlantRatio",
];

describe("computeFaceFeatures", () => {
  it("throws when given an empty landmarks array", () => {
    expect(() => computeFaceFeatures([])).toThrow();
  });

  it("returns all 15 fields as finite numbers for a well-formed face", () => {
    const result = computeFaceFeatures(buildFaceLandmarks());
    expect(Object.keys(result).sort()).toEqual([...FIELD_NAMES].sort());
    for (const field of FIELD_NAMES) {
      expect(Number.isFinite(result[field]), `${field} should be finite`).toBe(true);
    }
  });

  it("gives equal left/right eye width for a symmetric face", () => {
    const result = computeFaceFeatures(buildFaceLandmarks());
    expect(result.leftEyeWidthToFaceWidthRatio).toBeCloseTo(result.rightEyeWidthToFaceWidthRatio, 5);
  });

  it("gives left/right eye slant close to zero for a symmetric face", () => {
    const result = computeFaceFeatures(buildFaceLandmarks());
    expect(result.leftEyeSlantRatio).toBeCloseTo(0, 5);
    expect(result.rightEyeSlantRatio).toBeCloseTo(0, 5);
  });

  it("splits face half-width so left + right sum to 1", () => {
    const result = computeFaceFeatures(buildFaceLandmarks());
    expect(result.leftFaceHalfWidthRatio + result.rightFaceHalfWidthRatio).toBeCloseTo(1, 5);
    expect(result.leftFaceHalfWidthRatio).toBeCloseTo(0.5, 1);
  });

  it("assigns a larger left eye (image-right side) to leftEyeWidthToFaceWidthRatio", () => {
    const result = computeFaceFeatures(
      buildFaceLandmarks({ leftEyeRadius: { x: 0.08, y: 0.03 } }),
    );
    expect(result.leftEyeWidthToFaceWidthRatio).toBeGreaterThan(result.rightEyeWidthToFaceWidthRatio);
  });

  it("assigns a larger right eye (image-left side) to rightEyeWidthToFaceWidthRatio", () => {
    const result = computeFaceFeatures(
      buildFaceLandmarks({ rightEyeRadius: { x: 0.08, y: 0.03 } }),
    );
    expect(result.rightEyeWidthToFaceWidthRatio).toBeGreaterThan(result.leftEyeWidthToFaceWidthRatio);
  });

  it("gives a positive leftEyeSlantRatio when the left eye's outer corner is raised", () => {
    // Override two of the left eye cluster's own points directly, pushed past the
    // ellipse's natural x-range so they become the new width/slant extremes:
    // one far from the midline with a raised (smaller) y ("outer corner, upturned"),
    // one close to the midline at the unchanged center y ("inner corner").
    const landmarks = buildFaceLandmarks();
    const outerIdx = EYE_CLUSTER_A_IDX[0];
    const innerIdx = EYE_CLUSTER_A_IDX[1];
    landmarks[outerIdx] = point(0.695, 0.4); // outer corner, raised (y < center.y of 0.45)
    landmarks[innerIdx] = point(0.545, 0.45); // inner corner, unchanged y

    const result = computeFaceFeatures(landmarks);
    expect(result.leftEyeSlantRatio).toBeGreaterThan(0);
    expect(result.rightEyeSlantRatio).toBeCloseTo(0, 5);
  });
});
