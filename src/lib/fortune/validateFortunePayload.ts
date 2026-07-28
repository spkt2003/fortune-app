import { isValidAge } from "../demographics/validateAge";
import type { FortunePayload, Gender } from "./payload";

const GENDERS: Gender[] = ["male", "female", "unspecified"];

const FACE_FEATURE_KEYS = [
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
] as const;

function isValidFaceFeatures(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return FACE_FEATURE_KEYS.every(
    (key) => typeof record[key] === "number" && Number.isFinite(record[key]),
  );
}

export function validateFortunePayload(body: unknown): body is FortunePayload {
  if (typeof body !== "object" || body === null) return false;
  const record = body as Record<string, unknown>;

  return (
    typeof record.gender === "string" &&
    (GENDERS as string[]).includes(record.gender) &&
    typeof record.age === "number" &&
    isValidAge(record.age) &&
    isValidFaceFeatures(record.faceFeatures)
  );
}
