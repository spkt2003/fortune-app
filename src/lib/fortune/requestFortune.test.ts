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

  it("forwards the server's error message when the response status is not ok (e.g. 429)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: "ผู้ใช้งานเยอะในขณะนี้ กรุณาลองใหม่อีกครั้ง" }),
      }),
    );

    expect(await requestFortune(payload)).toEqual({
      ok: false,
      message: "ผู้ใช้งานเยอะในขณะนี้ กรุณาลองใหม่อีกครั้ง",
    });
  });

  it("falls back to the generic message when a non-ok response body has no error string", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      }),
    );

    expect(await requestFortune(payload)).toEqual({ ok: false, message: GENERIC_ERROR });
  });

  it("falls back to the generic message when a non-ok response body isn't JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("bad json")),
      }),
    );

    expect(await requestFortune(payload)).toEqual({ ok: false, message: GENERIC_ERROR });
  });

  it("aborts and returns ok:false if the request takes longer than the timeout", async () => {
    vi.useFakeTimers();
    try {
      const fetchMock = vi.fn((_url: string, init: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init.signal?.addEventListener("abort", () => {
            const abortError = new Error("The operation was aborted");
            abortError.name = "AbortError";
            reject(abortError);
          });
        });
      });
      vi.stubGlobal("fetch", fetchMock);

      const resultPromise = requestFortune(payload);
      await vi.runAllTimersAsync();

      expect(await resultPromise).toEqual({ ok: false, message: GENERIC_ERROR });
      expect(fetchMock.mock.calls[0][1]).toEqual(
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    } finally {
      vi.useRealTimers();
    }
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
