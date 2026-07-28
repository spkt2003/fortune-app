import type { FaceFeatures } from "@/lib/mediapipe/computeFaceFeatures";

export type Gender = "male" | "female" | "unspecified";

export interface FortunePayload {
  faceFeatures: FaceFeatures;
  gender: Gender;
  age: number;
}

export interface FortuneResult {
  career: string;
  love: string;
  health: string;
  finance: string;
}

const FALLBACK_MESSAGE = "ระบบทำนายไม่สามารถประมวลผลได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง";

export const FALLBACK_FORTUNE: FortuneResult = {
  career: FALLBACK_MESSAGE,
  love: FALLBACK_MESSAGE,
  health: FALLBACK_MESSAGE,
  finance: FALLBACK_MESSAGE,
};
