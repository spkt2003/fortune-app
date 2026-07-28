import type { FortuneResult } from "./payload";

const FORTUNE_KEYS = ["career", "love", "health", "finance"] as const;

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenceMatch ? fenceMatch[1] : trimmed;
}

export function parseFortuneResponse(rawText: string): FortuneResult | null {
  const stripped = stripCodeFence(rawText);

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    return null;
  }

  if (typeof parsed !== "object" || parsed === null) return null;
  const record = parsed as Record<string, unknown>;

  const hasAllKeys = FORTUNE_KEYS.every((key) => typeof record[key] === "string");
  if (!hasAllKeys) return null;

  return {
    career: record.career as string,
    love: record.love as string,
    health: record.health as string,
    finance: record.finance as string,
  };
}
