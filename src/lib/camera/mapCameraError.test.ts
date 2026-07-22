import { describe, expect, it } from "vitest";
import { mapCameraError, UnsupportedCameraError } from "./mapCameraError";

function errorWithName(name: string): Error {
  const err = new Error(name);
  err.name = name;
  return err;
}

describe("mapCameraError", () => {
  it("maps NotAllowedError to permission-denied with retry action", () => {
    const result = mapCameraError(errorWithName("NotAllowedError"));
    expect(result).toEqual({
      type: "permission-denied",
      message: "กดอนุญาตให้เข้าถึงกล้องที่แถบด้านบนของเบราว์เซอร์ แล้วกดลองใหม่อีกครั้ง",
      action: "retry",
    });
  });

  it("maps PermissionDeniedError to permission-denied with retry action", () => {
    const result = mapCameraError(errorWithName("PermissionDeniedError"));
    expect(result.type).toBe("permission-denied");
    expect(result.action).toBe("retry");
  });

  it("maps NotFoundError to not-found with retry action", () => {
    const result = mapCameraError(errorWithName("NotFoundError"));
    expect(result).toEqual({
      type: "not-found",
      message: "ไม่พบกล้องในอุปกรณ์นี้ กรุณาตรวจสอบการเชื่อมต่อกล้อง",
      action: "retry",
    });
  });

  it("maps DevicesNotFoundError to not-found with retry action", () => {
    const result = mapCameraError(errorWithName("DevicesNotFoundError"));
    expect(result.type).toBe("not-found");
    expect(result.action).toBe("retry");
  });

  it("maps UnsupportedCameraError to unsupported with close action", () => {
    const result = mapCameraError(new UnsupportedCameraError());
    expect(result).toEqual({
      type: "unsupported",
      message:
        "เบราว์เซอร์นี้ไม่รองรับการใช้งานกล้อง กรุณาใช้เบราว์เซอร์ที่รองรับ เช่น Chrome หรือ Edge เวอร์ชันล่าสุด",
      action: "close",
    });
  });

  it("falls back to unknown/retry for unrecognized errors", () => {
    const result = mapCameraError(errorWithName("NotReadableError"));
    expect(result).toEqual({
      type: "unknown",
      message: "เกิดข้อผิดพลาดกับกล้อง กรุณาลองใหม่อีกครั้ง",
      action: "retry",
    });
  });

  it("falls back to unknown/retry for non-Error input", () => {
    const result = mapCameraError("not an error object");
    expect(result.type).toBe("unknown");
    expect(result.action).toBe("retry");
  });
});
