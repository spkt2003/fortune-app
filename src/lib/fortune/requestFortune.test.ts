import { afterEach, describe, expect, it, vi } from "vitest";
import { requestFortune } from "./requestFortune";
import type { FortunePayload } from "./payload";

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

const GENERIC_ERROR = "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";

describe("requestFortune", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns ok:true with the parsed result on 200 + valid body", async () => {
    const body = { career: "a", love: "b", health: "c", finance: "d" };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(body) });
    vi.stubGlobal("fetch", fetchMock);

    expect(await requestFortune(payload)).toEqual({ ok: true, result: body });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/fortune",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
  });

  it("returns ok:false when the 200 body is missing a required key", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ career: "a", love: "b", health: "c" }),
      }),
    );

    expect(await requestFortune(payload)).toEqual({ ok: false, message: GENERIC_ERROR });
  });

  it("returns ok:false when the response status is not ok (e.g. 429)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: "rate limited" }),
      }),
    );

    expect(await requestFortune(payload)).toEqual({ ok: false, message: GENERIC_ERROR });
  });

  it("returns ok:false when fetch itself throws (network error)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    expect(await requestFortune(payload)).toEqual({ ok: false, message: GENERIC_ERROR });
  });

  it("returns ok:false when response.json() throws (body is not JSON)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.reject(new Error("bad json")) }),
    );

    expect(await requestFortune(payload)).toEqual({ ok: false, message: GENERIC_ERROR });
  });
});
