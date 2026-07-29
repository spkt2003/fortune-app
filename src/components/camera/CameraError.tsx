import type { CameraErrorAction } from "@/lib/camera/mapCameraError";
import ShrineFrame from "@/components/ui/ShrineFrame";

interface CameraErrorProps {
  message: string;
  action: CameraErrorAction;
  onRetry: () => void;
  onClose: () => void;
}

export default function CameraError({ message, action, onRetry, onClose }: CameraErrorProps) {
  return (
    <ShrineFrame className="flex flex-col items-center gap-4 text-center">
      <p role="alert" className="text-sm text-amber-400">{message}</p>
      {action === "retry" ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-lacquer px-6 py-3 font-medium text-parchment transition hover:brightness-110"
        >
          ลองใหม่
        </button>
      ) : (
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-gold/60 px-6 py-3 text-gold transition hover:bg-gold/10"
        >
          ปิด
        </button>
      )}
    </ShrineFrame>
  );
}
