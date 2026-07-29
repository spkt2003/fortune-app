type CaptureControlsProps =
  | { status: "idle"; onOpen: () => void }
  | { status: "opening" }
  | { status: "streaming"; onCapture: () => void; disabled: boolean }
  | { status: "captured"; onConfirm: () => void; onRetake: () => void; retakeDisabled: boolean };

const primaryButtonClass =
  "rounded-full bg-lacquer px-6 py-3 font-medium text-parchment transition hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100";
const secondaryButtonClass =
  "rounded-full border border-gold/60 px-6 py-3 text-gold transition hover:bg-gold/10";

export default function CaptureControls(props: CaptureControlsProps) {
  switch (props.status) {
    case "idle":
      return (
        <button type="button" onClick={props.onOpen} className={primaryButtonClass}>
          เปิดกล้อง
        </button>
      );
    case "opening":
      return <p className="text-sm text-gold">กำลังเปิดกล้อง...</p>;
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
          <button
            type="button"
            onClick={props.onRetake}
            disabled={props.retakeDisabled}
            className={`${secondaryButtonClass} disabled:opacity-40 disabled:hover:bg-transparent`}
          >
            ถ่ายใหม่
          </button>
          <button type="button" onClick={props.onConfirm} className={primaryButtonClass}>
            ยืนยัน
          </button>
        </div>
      );
  }
}
