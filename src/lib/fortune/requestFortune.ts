import type { FortunePayload, FortuneResult } from "./payload";

export type FortuneRequestResult =
  | { ok: true; result: FortuneResult }
  | { ok: false; message: string };

const GENERIC_ERROR_MESSAGE = "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";

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

export async function requestFortune(payload: FortunePayload): Promise<FortuneRequestResult> {
  let response: Response;
  try {
    response = await fetch("/api/fortune", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, message: GENERIC_ERROR_MESSAGE };
  }

  if (!response.ok) {
    return { ok: false, message: GENERIC_ERROR_MESSAGE };
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
