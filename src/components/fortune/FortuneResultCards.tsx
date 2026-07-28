import type { FortuneResult } from "@/lib/fortune/payload";

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
      <div className="grid grid-cols-2 gap-4">
        {CARDS.map((card) => (
          <div
            key={card.key}
            className="flex flex-col gap-2 rounded-2xl bg-white p-5 shadow-sm dark:bg-zinc-900 print:border print:border-zinc-300 print:bg-white print:shadow-none"
          >
            <h3 className="flex items-center gap-2 text-sm font-semibold tracking-wide text-zinc-500 dark:text-zinc-400 print:text-black">
              <span aria-hidden>{card.emoji}</span>
              {card.label}
            </h3>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 print:text-black">
              {result[card.key]}
            </p>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => window.print()}
        className="print:hidden rounded-full bg-black px-6 py-3 text-white dark:bg-white dark:text-black"
      >
        พิมพ์ผลลัพธ์
      </button>
    </div>
  );
}
