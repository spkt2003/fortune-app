import { NextRequest, NextResponse } from "next/server";
import { validateFortunePayload } from "@/lib/fortune/validateFortunePayload";
import { buildPrompt } from "@/lib/fortune/buildPrompt";
import { parseFortuneResponse } from "@/lib/fortune/parseFortuneResponse";
import { FALLBACK_FORTUNE } from "@/lib/fortune/payload";

const GEMINI_MODEL = "gemini-2.5-flash";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  if (!validateFortunePayload(body)) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ระบบยังไม่พร้อมใช้งาน กรุณาติดต่อเจ้าหน้าที่" },
      { status: 500 },
    );
  }

  const prompt = buildPrompt(body.faceFeatures, body.gender, body.age);

  let geminiResponse: Response;
  try {
    geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      },
    );
  } catch {
    return NextResponse.json(
      { error: "เชื่อมต่อระบบทำนายไม่ได้ กรุณาลองใหม่อีกครั้ง" },
      { status: 500 },
    );
  }

  if (geminiResponse.status === 429) {
    return NextResponse.json(
      { error: "ผู้ใช้งานเยอะในขณะนี้ กรุณาลองใหม่อีกครั้ง" },
      { status: 429 },
    );
  }

  if (!geminiResponse.ok) {
    return NextResponse.json(
      { error: "ระบบทำนายขัดข้อง กรุณาลองใหม่อีกครั้ง" },
      { status: 500 },
    );
  }

  const geminiData = await geminiResponse.json();
  const rawText: unknown = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (typeof rawText !== "string") {
    return NextResponse.json(FALLBACK_FORTUNE, { status: 200 });
  }

  const fortune = parseFortuneResponse(rawText);
  return NextResponse.json(fortune ?? FALLBACK_FORTUNE, { status: 200 });
}
