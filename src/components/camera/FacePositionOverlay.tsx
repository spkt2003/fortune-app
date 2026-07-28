import type { RealtimeFaceStatus } from "@/hooks/useRealtimeFacePosition";

interface FacePositionOverlayProps {
  status: RealtimeFaceStatus;
}

const MESSAGES: Record<RealtimeFaceStatus, string> = {
  "no-face": "กรุณาขยับใบหน้าให้อยู่ในกรอบ",
  tilted: "กรุณาหันหน้าตรงและมองกล้อง",
  "too-far": "ขยับเข้ามาใกล้กล้องอีกนิด",
  good: "อยู่นิ่งๆ... กำลังบันทึกสัดส่วน",
  unavailable: "ถ่ายได้เลย ระบบจะตรวจสอบอีกครั้ง",
};

export default function FacePositionOverlay({ status }: FacePositionOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
      <span
        className={`rounded-full px-4 py-1.5 text-sm font-medium text-parchment ${
          status === "good" ? "bg-jade/90" : "bg-black/70"
        }`}
      >
        {MESSAGES[status]}
      </span>
    </div>
  );
}
