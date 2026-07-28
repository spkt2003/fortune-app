import type { FaceFeatures } from "@/lib/mediapipe/computeFaceFeatures";
import type { Gender } from "./payload";

export function buildPrompt(faceFeatures: FaceFeatures, gender: Gender, age: number): string {
  return `คุณเป็นผู้เชี่ยวชาญด้านโหงวเฮ้ง (การทำนายจากลักษณะใบหน้า) เพื่อความบันเทิงเท่านั้น
ตอบกลับเป็น JSON เท่านั้น ห้ามมีข้อความอื่นนอกเหนือจาก JSON และห้ามหุ้มด้วย code fence ใดๆ

ข้อมูล:
- ลักษณะใบหน้า: ${JSON.stringify(faceFeatures)}
- เพศ: ${gender}
- อายุ: ${age}

รูปแบบ:
{ "career": "...", "love": "...", "health": "...", "finance": "..." }`;
}
