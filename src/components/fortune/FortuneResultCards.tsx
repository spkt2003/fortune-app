import type { FortuneResult } from "@/lib/fortune/payload";
import SealMark from "@/components/ui/SealMark";

interface FortuneResultCardsProps {
  result: FortuneResult;
}

const CARDS: { key: keyof FortuneResult; label: string; emoji: string }[] = [
  { key: "career", label: "การงาน", emoji: "💼" },
  { key: "love", label: "ความรัก", emoji: "💕" },
  { key: "health", label: "สุขภาพ", emoji: "🩺" },
  { key: "finance", label: "การเงิน", emoji: "💰" },
];

export default function FortuneResultCards({ result }: FortuneResultCardsProps) {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-4">
      <div className="flex items-center gap-3 print:hidden">
        <SealMark />
        <h2 className="font-display text-xl font-bold text-gold">ผลคำทำนายโหงวเฮ้งของคุณ</h2>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {CARDS.map((card) => (
          <div
            key={card.key}
            className="flex flex-col gap-2 rounded-2xl border border-gold/30 bg-panel p-5 shadow-[0_0_20px_-6px_rgba(217,119,87,0.3)] print:border print:border-zinc-300 print:bg-white print:shadow-none"
          >
            <h3 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-gold/80 print:text-black">
              <span aria-hidden>{card.emoji}</span>
              {card.label}
            </h3>
            <p className="text-sm leading-relaxed text-parchment print:text-black">{result[card.key]}</p>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => window.print()}
        className="print:hidden rounded-full bg-lacquer px-6 py-3 font-medium text-parchment transition hover:brightness-110"
      >
        พิมพ์ผลลัพธ์
      </button>
    </div>
  );
}
