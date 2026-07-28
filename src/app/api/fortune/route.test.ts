import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
import type { FortunePayload } from "@/lib/fortune/payload";

const payload: FortunePayload = {
  faceFeatures: {
    faceLengthToWidthRatio: 1,
    eyeDistanceToFaceWidthRatio: 1,
    leftEyeWidthToFaceWidthRatio: 1,
    rightEyeWidthToFaceWidthRatio: 1,
    eyebrowGapToEyeDistanceRatio: 1,
    noseWidthToFaceWidthRatio: 1,
    noseLengthToFaceHeightRatio: 1,
    mouthWidthToFaceWidthRatio: 1,
    upperLipToLowerLipThicknessRatio: 1,
    jawWidthToCheekboneWidthRatio: 1,
    foreheadHeightToFaceHeightRatio: 1,
    leftFaceHalfWidthRatio: 1,
    rightFaceHalfWidthRatio: 1,
    leftEyeSlantRatio: 1,
    rightEyeSlantRatio: 1,
  },
  gender: "unspecified",
  age: 25,
};

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/fortune", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/fortune", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("returns a friendly 429 message when Gemini responds with 429", async () => {
    vi.stubEnv("GEMINI_API_KEY", "test-key");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: { code: 429, message: "raw quota exceeded" } }),
      }),
    );

    const response = await POST(makeRequest(payload));
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body).toEqual({ error: "ผู้ใช้งานเยอะในขณะนี้ กรุณาลองใหม่อีกครั้ง" });
  });
});
