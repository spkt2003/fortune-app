import type { CameraErrorAction } from "@/lib/camera/mapCameraError";

interface CameraErrorProps {
  message: string;
  action: CameraErrorAction;
  onRetry: () => void;
  onClose: () => void;
}

export default function CameraError({ message, action, onRetry, onClose }: CameraErrorProps) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
      {action === "retry" ? (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-black px-6 py-3 text-white dark:bg-white dark:text-black"
        >
          ลองใหม่
        </button>
      ) : (
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-black px-6 py-3 dark:border-white dark:text-white"
        >
          ปิด
        </button>
      )}
    </div>
  );
}
