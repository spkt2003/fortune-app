type CaptureControlsProps =
  | { status: "idle"; onOpen: () => void }
  | { status: "opening" }
  | { status: "streaming"; onCapture: () => void; disabled: boolean }
  | { status: "captured"; onConfirm: () => void; onRetake: () => void };

const primaryButtonClass =
  "rounded-full bg-black px-6 py-3 text-white dark:bg-white dark:text-black";
const secondaryButtonClass =
  "rounded-full border border-black px-6 py-3 dark:border-white dark:text-white";

export default function CaptureControls(props: CaptureControlsProps) {
  switch (props.status) {
    case "idle":
      return (
        <button type="button" onClick={props.onOpen} className={primaryButtonClass}>
          เปิดกล้อง
        </button>
      );
    case "opening":
      return <p className="text-sm text-zinc-500">กำลังเปิดกล้อง...</p>;
    case "streaming":
      return (
        <button
          type="button"
          onClick={props.onCapture}
          disabled={props.disabled}
          className={primaryButtonClass}
        >
          แคป
        </button>
      );
    case "captured":
      return (
        <div className="flex gap-3">
          <button type="button" onClick={props.onRetake} className={secondaryButtonClass}>
            ถ่ายใหม่
          </button>
          <button type="button" onClick={props.onConfirm} className={primaryButtonClass}>
            ยืนยัน
          </button>
        </div>
      );
  }
}
