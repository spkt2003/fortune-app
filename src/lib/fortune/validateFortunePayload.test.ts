import { describe, expect, it } from "vitest";
import { validateFortunePayload } from "./validateFortunePayload";

const validFaceFeatures = {
  faceLengthToWidthRatio: 1.4,
  eyeDistanceToFaceWidthRatio: 0.45,
  leftEyeWidthToFaceWidthRatio: 0.19,
  rightEyeWidthToFaceWidthRatio: 0.19,
  eyebrowGapToEyeDistanceRatio: 0.4,
  noseWidthToFaceWidthRatio: 0.28,
  noseLengthToFaceHeightRatio: 0.3,
  mouthWidthToFaceWidthRatio: 0.33,
  upperLipToLowerLipThicknessRatio: 0.6,
  jawWidthToCheekboneWidthRatio: 0.77,
  foreheadHeightToFaceHeightRatio: 0.2,
  leftFaceHalfWidthRatio: 0.5,
  rightFaceHalfWidthRatio: 0.5,
  leftEyeSlantRatio: 0.15,
  rightEyeSlantRatio: 0.15,
};

const validPayload = {
  faceFeatures: validFaceFeatures,
  gender: "female" as const,
  age: 30,
};

describe("validateFortunePayload", () => {
  it("accepts a fully valid payload", () => {
    expect(validateFortunePayload(validPayload)).toBe(true);
  });

  it("rejects a gender outside the allowed enum", () => {
    expect(validateFortunePayload({ ...validPayload, gender: "other" })).toBe(false);
  });

  it("rejects an age outside 1-120", () => {
    expect(validateFortunePayload({ ...validPayload, age: 200 })).toBe(false);
  });

  it("rejects a non-integer age", () => {
    expect(validateFortunePayload({ ...validPayload, age: 25.5 })).toBe(false);
  });

  it("rejects faceFeatures missing a key", () => {
    const { rightEyeSlantRatio, ...incomplete } = validFaceFeatures;
    expect(validateFortunePayload({ ...validPayload, faceFeatures: incomplete })).toBe(false);
  });

  it("rejects faceFeatures with a non-finite value", () => {
    expect(
      validateFortunePayload({
        ...validPayload,
        faceFeatures: { ...validFaceFeatures, faceLengthToWidthRatio: NaN },
      }),
    ).toBe(false);
  });

  it("rejects a non-object body", () => {
    expect(validateFortunePayload("not an object")).toBe(false);
  });

  it("rejects null", () => {
    expect(validateFortunePayload(null)).toBe(false);
  });
});
