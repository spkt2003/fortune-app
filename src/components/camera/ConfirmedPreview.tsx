interface ConfirmedPreviewProps {
  imageSrc: string;
  onRetake: () => void;
}

export default function ConfirmedPreview({ imageSrc, onRetake }: ConfirmedPreviewProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageSrc} alt="ภาพที่ยืนยันแล้ว" className="w-full max-w-md rounded-lg" />
      <p className="text-center text-sm text-zinc-500">ตรวจพบใบหน้าเรียบร้อยแล้ว</p>
      <button
        type="button"
        onClick={onRetake}
        className="rounded-full border border-black px-6 py-3 dark:border-white dark:text-white"
      >
        ถ่ายใหม่
      </button>
    </div>
  );
}
