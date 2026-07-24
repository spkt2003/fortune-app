import { FaceLandmarker } from "@mediapipe/tasks-vision";
import type { NormalizedLandmark } from "@mediapipe/tasks-vision";
import {
  centroidX,
  centroidY,
  closestToX,
  farthestFromX,
  height,
  regionIndices,
  splitByAnatomicalSide,
  width,
  type Point2D,
} from "./faceGeometry";

export interface FaceFeatures {
  faceLengthToWidthRatio: number;
  eyeDistanceToFaceWidthRatio: number;
  leftEyeWidthToFaceWidthRatio: number;
  rightEyeWidthToFaceWidthRatio: number;
  eyebrowGapToEyeDistanceRatio: number;
  noseWidthToFaceWidthRatio: number;
  noseLengthToFaceHeightRatio: number;
  mouthWidthToFaceWidthRatio: number;
  upperLipToLowerLipThicknessRatio: number;
  jawWidthToCheekboneWidthRatio: number;
  foreheadHeightToFaceHeightRatio: number;
  leftFaceHalfWidthRatio: number;
  rightFaceHalfWidthRatio: number;
  leftEyeSlantRatio: number;
  rightEyeSlantRatio: number;
}

// Verified 2026-07-24 against a real FaceLandmarker detection — see the
// "Landmark index verification note" in docs/superpowers/plans/2026-07-24-ticket4-face-features.md.
// These are the only points without a MediaPipe-exported named region, so they're
// pinned explicitly rather than derived generically like the eye/brow/lips/oval regions.
const NOSE_BRIDGE = 168; // top of nose bridge / glabella; also doubles as the face midline x reference
const NOSE_BASE = 2; // subnasale, where the nose meets the philtrum
const NOSE_ALA_A = 129;
const NOSE_ALA_B = 358;
const UPPER_LIP_OUTER_TOP = 0;
const UPPER_LIP_INNER = 13;
const LOWER_LIP_INNER = 14;
const LOWER_LIP_OUTER_BOTTOM = 17;

const JAW_BAND_MIN_FRACTION = 0.72;
const JAW_BAND_MAX_FRACTION = 0.9;

function pointsFor(landmarks: NormalizedLandmark[], indices: number[]): Point2D[] {
  return indices.map((i) => landmarks[i]);
}

function eyeSlant(eyePoints: Point2D[], midlineX: number): number {
  const inner = closestToX(eyePoints, midlineX);
  const outer = farthestFromX(eyePoints, midlineX);
  return (inner.y - outer.y) / width(eyePoints);
}

export function computeFaceFeatures(landmarks: NormalizedLandmark[]): FaceFeatures {
  if (landmarks.length === 0) {
    throw new Error("computeFaceFeatures requires at least one landmark");
  }

  const ovalPoints = pointsFor(landmarks, regionIndices(FaceLandmarker.FACE_LANDMARKS_FACE_OVAL));
  const eyeClusterA = pointsFor(landmarks, regionIndices(FaceLandmarker.FACE_LANDMARKS_LEFT_EYE));
  const eyeClusterB = pointsFor(landmarks, regionIndices(FaceLandmarker.FACE_LANDMARKS_RIGHT_EYE));
  const browClusterA = pointsFor(
    landmarks,
    regionIndices(FaceLandmarker.FACE_LANDMARKS_LEFT_EYEBROW),
  );
  const browClusterB = pointsFor(
    landmarks,
    regionIndices(FaceLandmarker.FACE_LANDMARKS_RIGHT_EYEBROW),
  );
  const lipsPoints = pointsFor(landmarks, regionIndices(FaceLandmarker.FACE_LANDMARKS_LIPS));

  const faceWidth = width(ovalPoints);
  const faceHeight = height(ovalPoints);
  const ovalTopY = Math.min(...ovalPoints.map((p) => p.y));

  const midlineX = landmarks[NOSE_BRIDGE].x;

  const { left: leftEyePoints, right: rightEyePoints } = splitByAnatomicalSide(
    eyeClusterA,
    eyeClusterB,
  );
  const { left: leftBrowPoints, right: rightBrowPoints } = splitByAnatomicalSide(
    browClusterA,
    browClusterB,
  );

  const eyeDistance = Math.abs(centroidX(leftEyePoints) - centroidX(rightEyePoints));

  const leftBrowInner = closestToX(leftBrowPoints, midlineX);
  const rightBrowInner = closestToX(rightBrowPoints, midlineX);
  const eyebrowGap = Math.abs(leftBrowInner.x - rightBrowInner.x);

  const noseWidth = Math.abs(landmarks[NOSE_ALA_A].x - landmarks[NOSE_ALA_B].x);
  const noseLength = Math.abs(landmarks[NOSE_BASE].y - landmarks[NOSE_BRIDGE].y);

  const mouthWidth = width(lipsPoints);
  const upperLipThickness = Math.abs(
    landmarks[UPPER_LIP_INNER].y - landmarks[UPPER_LIP_OUTER_TOP].y,
  );
  const lowerLipThickness = Math.abs(
    landmarks[LOWER_LIP_OUTER_BOTTOM].y - landmarks[LOWER_LIP_INNER].y,
  );

  const jawBandPoints = ovalPoints.filter((p) => {
    const fraction = (p.y - ovalTopY) / faceHeight;
    return fraction >= JAW_BAND_MIN_FRACTION && fraction <= JAW_BAND_MAX_FRACTION;
  });
  const jawWidth = width(jawBandPoints);

  const leftOvalExtent =
    Math.max(...ovalPoints.filter((p) => p.x > midlineX).map((p) => p.x)) - midlineX;
  const rightOvalExtent =
    midlineX - Math.min(...ovalPoints.filter((p) => p.x < midlineX).map((p) => p.x));
  const halfWidthTotal = leftOvalExtent + rightOvalExtent;

  const browLineY = centroidY([...leftBrowPoints, ...rightBrowPoints]);

  return {
    faceLengthToWidthRatio: faceHeight / faceWidth,
    eyeDistanceToFaceWidthRatio: eyeDistance / faceWidth,
    leftEyeWidthToFaceWidthRatio: width(leftEyePoints) / faceWidth,
    rightEyeWidthToFaceWidthRatio: width(rightEyePoints) / faceWidth,
    eyebrowGapToEyeDistanceRatio: eyebrowGap / eyeDistance,
    noseWidthToFaceWidthRatio: noseWidth / faceWidth,
    noseLengthToFaceHeightRatio: noseLength / faceHeight,
    mouthWidthToFaceWidthRatio: mouthWidth / faceWidth,
    upperLipToLowerLipThicknessRatio: upperLipThickness / lowerLipThickness,
    jawWidthToCheekboneWidthRatio: jawWidth / faceWidth,
    foreheadHeightToFaceHeightRatio: Math.abs(browLineY - ovalTopY) / faceHeight,
    leftFaceHalfWidthRatio: leftOvalExtent / halfWidthTotal,
    rightFaceHalfWidthRatio: rightOvalExtent / halfWidthTotal,
    leftEyeSlantRatio: eyeSlant(leftEyePoints, midlineX),
    rightEyeSlantRatio: eyeSlant(rightEyePoints, midlineX),
  };
}
