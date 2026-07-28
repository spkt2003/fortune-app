import type { ReactNode } from "react";

interface ConfirmedPreviewProps {
  imageSrc: string;
  onRetake: () => void;
  children?: ReactNode;
}

export default function ConfirmedPreview({ imageSrc, onRetake, children }: ConfirmedPreviewProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageSrc}
        alt="ภาพที่ยืนยันแล้ว"
        className="w-full max-w-md rounded-lg print:hidden"
      />
      <p className="text-center text-sm text-gold/80 print:hidden">ตรวจพบใบหน้าเรียบร้อยแล้ว</p>
      {children}
      <button
        type="button"
        onClick={onRetake}
        className="rounded-full border border-gold/60 px-6 py-3 text-gold print:hidden"
      >
        ถ่ายใหม่
      </button>
    </div>
  );
}
