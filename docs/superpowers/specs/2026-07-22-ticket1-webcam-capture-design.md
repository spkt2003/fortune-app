# Ticket 1: Webcam Capture — Design

## Scope

Replace the current homepage placeholder (`src/app/page.tsx`) with a webcam capture flow: open camera → preview → capture → confirm/retake. This ticket ends once the user confirms a captured photo; it does not integrate MediaPipe (Ticket 2) or the fortune API — the confirmed state shows a placeholder message only.

Device target: booth laptop with built-in/USB webcam only. No mobile `facingMode` handling needed.

## Architecture

```
src/
  app/
    page.tsx                 -- renders <CameraCapture />, replaces old placeholder
  components/
    camera/
      CameraCapture.tsx      -- container: wires useCamera to child components, switches on status
      CameraView.tsx         -- <video> (mirrored via CSS) + static oval guide overlay
      CaptureControls.tsx    -- action buttons per state (เปิดกล้อง / แคป / ยืนยัน / ถ่ายใหม่)
      ConfirmedPreview.tsx   -- shows captured (unmirrored) image + placeholder text + "ถ่ายใหม่"
      CameraError.tsx        -- renders error message + retry or close button per mapCameraError result
  hooks/
    useCamera.ts             -- getUserMedia lifecycle, MediaStream ref, capture-to-canvas, error state
  lib/
    camera/
      mapCameraError.ts      -- pure function: unknown -> { type, message, action }
      mapCameraError.test.ts -- Vitest unit tests
```

`useCamera` is the only module that talks to browser camera APIs. It exposes:

```ts
type CameraStatus = "idle" | "opening" | "streaming" | "captured" | "confirmed" | "error";

interface UseCameraResult {
  status: CameraStatus;
  videoRef: RefObject<HTMLVideoElement>;
  capturedImage: string | null; // data URL, unmirrored
  error: { type: CameraErrorType; message: string; action: "retry" | "close" } | null;
  open: () => Promise<void>;
  capture: () => void;
  confirm: () => void;
  retake: () => void;
  dismissError: () => void;
}
```

## State Machine

```
idle --(click "เปิดกล้อง")--> opening
opening --(getUserMedia success)--> streaming
opening --(getUserMedia failure)--> error
streaming --(click "แคป")--> captured
captured --(click "ถ่ายใหม่")--> streaming   [stream untouched, no re-request]
captured --(click "ยืนยัน")--> confirmed
confirmed --(click "ถ่ายใหม่")--> streaming  [stream untouched, no re-request]
error --(retry: click "ลองใหม่")--> opening
error --(close: click "ปิด")--> idle
```

- The `MediaStream` obtained on `open()` is kept alive across `captured`/`confirmed`/back-to-`streaming` transitions. It is only stopped on component unmount (leaving the page) — not on retake.
- `confirmed` is the terminal state for this ticket. It renders the captured photo plus placeholder text: "กำลังเตรียมส่งต่อ Ticket 2 (MediaPipe) — ยังไม่มีในเวอร์ชันนี้" and a "ถ่ายใหม่" button.

## Mirroring (left/right correctness)

The `<video>` preview element is mirrored via CSS (`transform: scaleX(-1)`) so it feels like a mirror — this is a **display-only** transform for user comfort while framing the shot.

The captured frame that becomes `capturedImage` (and everything downstream in Ticket 2/3) is drawn from the **raw, unmirrored** video frame. Chinese physiognomy (โหงวเฮ้ง) assigns different meaning to the left vs. right side of the face (left = innate/birth destiny/หยาง, right = acquired later/หยิน), so if the mirrored frame were captured instead, asymmetry-based reads (eye size, mole position, etc.) would silently flip to the wrong side. See project memory `physiognomy_left_right_asymmetry` for the full rationale. `useCamera.capture()` must draw from the source `<video>`/stream without any horizontal flip applied to the canvas context.

## Guide Overlay

A static, faint oval/egg-shaped outline is rendered on top of the mirrored preview (pure CSS/SVG, absolutely positioned, non-interactive) to help users frame their face. It performs no detection — it's purely visual guidance. Real face detection arrives in Ticket 2.

## Camera Constraints

`getUserMedia({ video: { width: { ideal: 1920 }, height: { ideal: 1080 } } })`. No `facingMode` constraint (desktop/webcam only per scope). 1080p chosen over 720p to preserve fine detail (moles, subtle eye-size asymmetry) for later feature-extraction tickets, accepting the extra compute cost on Ticket 2/3 MediaPipe processing.

## Camera Start Behavior

The camera is **not** auto-started on page load. The page shows an initial "เปิดกล้อง" button; `getUserMedia` (and the browser permission prompt) only fires when the user clicks it.

## Error Handling

`mapCameraError(err: unknown): { type: CameraErrorType; message: string; action: "retry" | "close" }`

| Trigger (`error.name` / condition) | `type` | Message (Thai) | `action` |
|---|---|---|---|
| `NotAllowedError` / `PermissionDeniedError` | `permission-denied` | "กดอนุญาตให้เข้าถึงกล้องที่แถบด้านบนของเบราว์เซอร์ แล้วกดลองใหม่อีกครั้ง" | `retry` |
| `NotFoundError` / `DevicesNotFoundError` | `not-found` | "ไม่พบกล้องในอุปกรณ์นี้ กรุณาตรวจสอบการเชื่อมต่อกล้อง" | `retry` |
| `navigator.mediaDevices` undefined / `getUserMedia` unsupported | `unsupported` | "เบราว์เซอร์นี้ไม่รองรับการใช้งานกล้อง กรุณาใช้เบราว์เซอร์ที่รองรับ เช่น Chrome หรือ Edge เวอร์ชันล่าสุด" | `close` |
| Anything else (`NotReadableError`, unknown) | `unknown` | "เกิดข้อผิดพลาดกับกล้อง กรุณาลองใหม่อีกครั้ง" | `retry` |

`CameraError.tsx` renders a single button based on `action`:
- `"retry"` → button labeled "ลองใหม่", calls `useCamera.open()` again (back to `opening`)
- `"close"` → button labeled "ปิด", calls `dismissError()` (back to `idle`, no retry attempted)

## Testing

- `mapCameraError.test.ts` (Vitest): covers all four rows above, including unknown/fallback input, asserting exact `{ type, message, action }`. This is the only pure-logic unit worth testing per this ticket; everything else is browser-API-driven and verified manually.
- Manual verification: camera open/permission-denied/no-device/unsupported-browser paths, capture → retake → capture → confirm flow, mirrored preview vs. unmirrored captured image, stream persists across retake (no duplicate permission prompt), cleanup on navigating away.

## Out of Scope (deferred to later tickets)

- MediaPipe landmark detection / face feature calculation (Ticket 2/3)
- Sending `capturedImage` anywhere (no upload in this ticket — CLAUDE.md forbids sending raw images off-device at all; this image only ever becomes input to client-side MediaPipe processing in Ticket 2)
- Gender/age input form (Ticket 4)
