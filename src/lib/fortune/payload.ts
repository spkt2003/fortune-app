import type { FaceFeatures } from "@/lib/mediapipe/computeFaceFeatures";

export type Gender = "male" | "female" | "unspecified";

export interface FortunePayload {
  faceFeatures: FaceFeatures;
  gender: Gender;
  age: number;
}
