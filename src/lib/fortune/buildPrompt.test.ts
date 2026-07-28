import { describe, expect, it } from "vitest";
import { buildPrompt } from "./buildPrompt";
import type { FaceFeatures } from "@/lib/mediapipe/computeFaceFeatures";

const sampleFaceFeatures: FaceFeatures = {
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

describe("buildPrompt", () => {
  it("produces the exact prompt template with substitutions", () => {
    const prompt = buildPrompt(sampleFaceFeatures, "female", 30);

    expect(prompt).toBe(`คุณเป็นผู้เชี่ยวชาญด้านโหงวเฮ้ง (การทำนายจากลักษณะใบหน้า) เพื่อความบันเทิงเท่านั้น
ตอบกลับเป็น JSON เท่านั้น ห้ามมีข้อความอื่นนอกเหนือจาก JSON และห้ามหุ้มด้วย code fence ใดๆ

ข้อมูล:
- ลักษณะใบหน้า: ${JSON.stringify(sampleFaceFeatures)}
- เพศ: female
- อายุ: 30

รูปแบบ:
{ "career": "...", "love": "...", "health": "...", "finance": "..." }`);
  });

  it("substitutes a different gender and age", () => {
    const prompt = buildPrompt(sampleFaceFeatures, "unspecified", 45);
    expect(prompt).toContain("- เพศ: unspecified");
    expect(prompt).toContain("- อายุ: 45");
  });
});
