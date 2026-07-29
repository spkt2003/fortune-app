export type CameraErrorType = "permission-denied" | "not-found" | "in-use" | "unsupported" | "unknown";
export type CameraErrorAction = "retry" | "close";

export interface CameraErrorInfo {
  type: CameraErrorType;
  message: string;
  action: CameraErrorAction;
}

export class UnsupportedCameraError extends Error {
  constructor() {
    super("Camera API not supported in this browser");
    this.name = "UnsupportedCameraError";
  }
}

const PERMISSION_DENIED_NAMES = new Set(["NotAllowedError", "PermissionDeniedError"]);
const NOT_FOUND_NAMES = new Set(["NotFoundError", "DevicesNotFoundError"]);
const IN_USE_NAMES = new Set(["NotReadableError", "TrackStartError"]);

function getErrorName(err: unknown): string | undefined {
  // Duck-typed on purpose: the real getUserMedia rejection is a DOMException,
  // which doesn't reliably inherit from Error across every engine/spec version.
  // Any object exposing a string `.name` (Error, DOMException, or our own
  // UnsupportedCameraError) is readable this way.
  if (err && typeof err === "object" && "name" in err) {
    const name = (err as { name: unknown }).name;
    return typeof name === "string" ? name : undefined;
  }
  return undefined;
}

export function mapCameraError(err: unknown): CameraErrorInfo {
  const name = getErrorName(err);

  if (name && PERMISSION_DENIED_NAMES.has(name)) {
    return {
      type: "permission-denied",
      message: "กดอนุญาตให้เข้าถึงกล้องที่แถบด้านบนของเบราว์เซอร์ แล้วกดลองใหม่อีกครั้ง",
      action: "retry",
    };
  }

  if (name && NOT_FOUND_NAMES.has(name)) {
    return {
      type: "not-found",
      message: "ไม่พบกล้องในอุปกรณ์นี้ กรุณาตรวจสอบการเชื่อมต่อกล้อง",
      action: "retry",
    };
  }

  if (name && IN_USE_NAMES.has(name)) {
    return {
      type: "in-use",
      message: "กล้องกำลังถูกใช้งานโดยโปรแกรมอื่นอยู่ กรุณาปิดโปรแกรม/แท็บอื่นที่ใช้กล้อง แล้วลองใหม่อีกครั้ง",
      action: "retry",
    };
  }

  if (name === "UnsupportedCameraError") {
    return {
      type: "unsupported",
      message:
        "เบราว์เซอร์นี้ไม่รองรับการใช้งานกล้อง กรุณาใช้เบราว์เซอร์ที่รองรับ เช่น Chrome หรือ Edge เวอร์ชันล่าสุด",
      action: "close",
    };
  }

  return {
    type: "unknown",
    message: "เกิดข้อผิดพลาดกับกล้อง กรุณาลองใหม่อีกครั้ง",
    action: "retry",
  };
}
