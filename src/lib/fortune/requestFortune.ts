import type { FortunePayload, FortuneResult } from "./payload";

export type FortuneRequestResult =
  | { ok: true; result: FortuneResult }
  | { ok: false; message: string };

const GENERIC_ERROR_MESSAGE = "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
const REQUEST_TIMEOUT_MS = 20000;

function isFortuneResult(value: unknown): value is FortuneResult {
  if (typeof value !== "object" || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.career === "string" &&
    typeof record.love === "string" &&
    typeof record.health === "string" &&
    typeof record.finance === "string"
  );
}

function isErrorBody(value: unknown): value is { error: string } {
  if (typeof value !== "object" || value === null) return false;
  return typeof (value as Record<string, unknown>).error === "string";
}

export async function requestFortune(
  payload: FortunePayload,
  options?: { signal?: AbortSignal },
): Promise<FortuneRequestResult> {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => timeoutController.abort(), REQUEST_TIMEOUT_MS);
  const signal = options?.signal
    ? AbortSignal.any([timeoutController.signal, options.signal])
    : timeoutController.signal;

  let response: Response;
  try {
    response = await fetch("/api/fortune", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });
  } catch {
    return { ok: false, message: GENERIC_ERROR_MESSAGE };
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let errorBody: unknown;
    try {
      errorBody = await response.json();
    } catch {
      return { ok: false, message: GENERIC_ERROR_MESSAGE };
    }
    return {
      ok: false,
      message: isErrorBody(errorBody) ? errorBody.error : GENERIC_ERROR_MESSAGE,
    };
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    return { ok: false, message: GENERIC_ERROR_MESSAGE };
  }

  if (!isFortuneResult(data)) {
    return { ok: false, message: GENERIC_ERROR_MESSAGE };
  }

  return { ok: true, result: data };
}
