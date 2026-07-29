import type { RealtimeFaceStatus } from "@/hooks/useRealtimeFacePosition";
import FacePositionOverlay from "./FacePositionOverlay";

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  showOverlay: boolean;
  facePositionStatus?: RealtimeFaceStatus;
}

export default function CameraView({ videoRef, showOverlay, facePositionStatus }: CameraViewProps) {
  return (
    <div className="relative aspect-video w-full max-w-2xl overflow-hidden rounded-lg bg-black">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="h-full w-full object-cover [transform:scaleX(-1)]"
      />
      {showOverlay && (
        <svg
          viewBox="0 0 100 100"
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <ellipse
            cx="50"
            cy="50"
            rx="28"
            ry="38"
            fill="none"
            stroke="var(--lacquer)"
            strokeOpacity="0.6"
            strokeWidth="1.5"
          />
        </svg>
      )}
      {showOverlay && facePositionStatus && <FacePositionOverlay status={facePositionStatus} />}
    </div>
  );
}
