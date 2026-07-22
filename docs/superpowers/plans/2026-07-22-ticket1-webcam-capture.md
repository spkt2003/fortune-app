# Ticket 1: Webcam Capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the homepage placeholder with a webcam capture flow — open camera, live preview, capture, confirm or retake — ending at a placeholder "confirmed" screen that hands off to Ticket 2 (MediaPipe).

**Architecture:** A `useCamera` client hook owns all `getUserMedia`/`MediaStream`/canvas-capture logic and exposes a small state machine. A `CameraCapture` client component switches on that state to render one of four presentational pieces (`CameraView`, `CaptureControls`, `CameraError`, `ConfirmedPreview`). Camera-error classification is a pure function (`mapCameraError`) with its own Vitest unit tests; everything else is verified manually in a real browser per the spec's testing section.

**Tech Stack:** Next.js 16 App Router (TypeScript, Tailwind v4, already scaffolded), React 19, Vitest (new — first test infra in this repo).

Full design rationale: `docs/superpowers/specs/2026-07-22-ticket1-webcam-capture-design.md`

## Global Constraints

- Device target is a booth laptop with a built-in/USB webcam only — no `facingMode` handling.
- Camera constraints: `{ video: { width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false }`.
- The `<video>` preview is mirrored via CSS only (`transform: scaleX(-1)`). The captured frame drawn to `<canvas>` must come from the raw video element with **no** horizontal flip applied in the canvas context — `drawImage` already reads the unmirrored source pixels regardless of the video element's CSS transform, so no extra "unmirror" logic is needed, just never call `ctx.scale(-1, 1)`. This preserves correct left/right sides for physiognomy reads (see spec + project memory `physiognomy_left_right_asymmetry`).
- Camera does **not** auto-start on page load — only opens when the user clicks "เปิดกล้อง" (`open()` is called from that click handler).
- Retake (`retake()`) never re-requests `getUserMedia` — the existing `MediaStream` stays alive and is only stopped on component unmount. Only the error-screen "ลองใหม่" button and the initial "เปิดกล้อง" button call `open()`.
- Ticket 1 ends at the `confirmed` state: captured image + the exact placeholder text `"กำลังเตรียมส่งต่อ Ticket 2 (MediaPipe) — ยังไม่มีในเวอร์ชันนี้"` + a "ถ่ายใหม่" button. No MediaPipe, no API calls, no image upload — the captured image never leaves `useCamera`'s state in this ticket.
- Error copy/actions must match this table exactly:

  | `error.name` | `type` | Message | `action` |
  |---|---|---|---|
  | `NotAllowedError` / `PermissionDeniedError` | `permission-denied` | "กดอนุญาตให้เข้าถึงกล้องที่แถบด้านบนของเบราว์เซอร์ แล้วกดลองใหม่อีกครั้ง" | `retry` |
  | `NotFoundError` / `DevicesNotFoundError` | `not-found` | "ไม่พบกล้องในอุปกรณ์นี้ กรุณาตรวจสอบการเชื่อมต่อกล้อง" | `retry` |
  | unsupported (no `navigator.mediaDevices.getUserMedia`) | `unsupported` | "เบราว์เซอร์นี้ไม่รองรับการใช้งานกล้อง กรุณาใช้เบราว์เซอร์ที่รองรับ เช่น Chrome หรือ Edge เวอร์ชันล่าสุด" | `close` |
  | anything else | `unknown` | "เกิดข้อผิดพลาดกับกล้อง กรุณาลองใหม่อีกครั้ง" | `retry` |

- Only `mapCameraError` gets an automated Vitest unit test. `useCamera` and all components are verified manually in the browser (documented per-task and in the final full-flow checklist) — do not attempt to mock `getUserMedia`/`MediaStream`/canvas for these.
- The only new dependency is `vitest` (dev-only) — already named as this project's unit-test tool in `CLAUDE.md` §2, so this is not a new library decision, just implementing what's already agreed.
- Follow existing repo conventions: Tailwind utility classes matching `src/app/page.tsx`'s current style (`bg-zinc-50 dark:bg-black`, `text-black dark:text-zinc-50`), path alias `@/*` → `./src/*`, strict TypeScript.
- Do not touch `.env*`, do not add gender/age input (Ticket 4) or MediaPipe (Ticket 2) — out of scope for this ticket.

---

### Task 1: Vitest setup + `mapCameraError`

**Files:**
- Modify: `package.json` (add `vitest` devDependency + `"test"` script)
- Create: `vitest.config.ts`
- Create: `src/lib/camera/mapCameraError.ts`
- Create: `src/lib/camera/mapCameraError.test.ts`

**Interfaces:**
- Produces (used by `useCamera` in Task 2 and `CameraError` in Task 3):
  ```ts
  export type CameraErrorType = "permission-denied" | "not-found" | "unsupported" | "unknown";
  export type CameraErrorAction = "retry" | "close";
  export interface CameraErrorInfo {
    type: CameraErrorType;
    message: string;
    action: CameraErrorAction;
  }
  export class UnsupportedCameraError extends Error {}
  export function mapCameraError(err: unknown): CameraErrorInfo;
  ```

- [ ] **Step 1: Install Vitest**

Run: `npm install -D vitest`
Expected: `vitest` added under `devDependencies` in `package.json`, `package-lock.json` updated.

- [ ] **Step 2: Add the `test` script**

Edit `package.json` `scripts` block to add:
```json
"test": "vitest run"
```

- [ ] **Step 3: Create the Vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
  },
});
```

- [ ] **Step 4: Write the failing test file**

Create `src/lib/camera/mapCameraError.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { mapCameraError, UnsupportedCameraError } from "./mapCameraError";

function errorWithName(name: string): Error {
  const err = new Error(name);
  err.name = name;
  return err;
}

describe("mapCameraError", () => {
  it("maps NotAllowedError to permission-denied with retry action", () => {
    const result = mapCameraError(errorWithName("NotAllowedError"));
    expect(result).toEqual({
      type: "permission-denied",
      message: "กดอนุญาตให้เข้าถึงกล้องที่แถบด้านบนของเบราว์เซอร์ แล้วกดลองใหม่อีกครั้ง",
      action: "retry",
    });
  });

  it("maps PermissionDeniedError to permission-denied with retry action", () => {
    const result = mapCameraError(errorWithName("PermissionDeniedError"));
    expect(result.type).toBe("permission-denied");
    expect(result.action).toBe("retry");
  });

  it("maps NotFoundError to not-found with retry action", () => {
    const result = mapCameraError(errorWithName("NotFoundError"));
    expect(result).toEqual({
      type: "not-found",
      message: "ไม่พบกล้องในอุปกรณ์นี้ กรุณาตรวจสอบการเชื่อมต่อกล้อง",
      action: "retry",
    });
  });

  it("maps DevicesNotFoundError to not-found with retry action", () => {
    const result = mapCameraError(errorWithName("DevicesNotFoundError"));
    expect(result.type).toBe("not-found");
    expect(result.action).toBe("retry");
  });

  it("maps UnsupportedCameraError to unsupported with close action", () => {
    const result = mapCameraError(new UnsupportedCameraError());
    expect(result).toEqual({
      type: "unsupported",
      message:
        "เบราว์เซอร์นี้ไม่รองรับการใช้งานกล้อง กรุณาใช้เบราว์เซอร์ที่รองรับ เช่น Chrome หรือ Edge เวอร์ชันล่าสุด",
      action: "close",
    });
  });

  it("falls back to unknown/retry for unrecognized errors", () => {
    const result = mapCameraError(errorWithName("NotReadableError"));
    expect(result).toEqual({
      type: "unknown",
      message: "เกิดข้อผิดพลาดกับกล้อง กรุณาลองใหม่อีกครั้ง",
      action: "retry",
    });
  });

  it("falls back to unknown/retry for non-Error input", () => {
    const result = mapCameraError("not an error object");
    expect(result.type).toBe("unknown");
    expect(result.action).toBe("retry");
  });
});
```

- [ ] **Step 5: Run the test to verify it fails**

Run: `npx vitest run src/lib/camera/mapCameraError.test.ts`
Expected: FAIL — `Cannot find module './mapCameraError'` (source file doesn't exist yet).

- [ ] **Step 6: Implement `mapCameraError`**

Create `src/lib/camera/mapCameraError.ts`:
```ts
export type CameraErrorType = "permission-denied" | "not-found" | "unsupported" | "unknown";
export type CameraErrorAction = "retry" | "close";

export interface CameraErrorInfo {
  type: CameraErrorType;
  message: string;
  action: CameraErrorAction;
}

export class UnsupportedCameraError extends Error {
  constructor() {
    super("Camera API not supported in this browser");
    this.name = "UnsupportedCameraError";
  }
}

const PERMISSION_DENIED_NAMES = new Set(["NotAllowedError", "PermissionDeniedError"]);
const NOT_FOUND_NAMES = new Set(["NotFoundError", "DevicesNotFoundError"]);

function getErrorName(err: unknown): string | undefined {
  // Duck-typed on purpose: the real getUserMedia rejection is a DOMException,
  // which doesn't reliably inherit from Error across every engine/spec version.
  // Any object exposing a string `.name` (Error, DOMException, or our own
  // UnsupportedCameraError) is readable this way.
  if (err && typeof err === "object" && "name" in err) {
    const name = (err as { name: unknown }).name;
    return typeof name === "string" ? name : undefined;
  }
  return undefined;
}

export function mapCameraError(err: unknown): CameraErrorInfo {
  const name = getErrorName(err);

  if (name && PERMISSION_DENIED_NAMES.has(name)) {
    return {
      type: "permission-denied",
      message: "กดอนุญาตให้เข้าถึงกล้องที่แถบด้านบนของเบราว์เซอร์ แล้วกดลองใหม่อีกครั้ง",
      action: "retry",
    };
  }

  if (name && NOT_FOUND_NAMES.has(name)) {
    return {
      type: "not-found",
      message: "ไม่พบกล้องในอุปกรณ์นี้ กรุณาตรวจสอบการเชื่อมต่อกล้อง",
      action: "retry",
    };
  }

  if (name === "UnsupportedCameraError") {
    return {
      type: "unsupported",
      message:
        "เบราว์เซอร์นี้ไม่รองรับการใช้งานกล้อง กรุณาใช้เบราว์เซอร์ที่รองรับ เช่น Chrome หรือ Edge เวอร์ชันล่าสุด",
      action: "close",
    };
  }

  return {
    type: "unknown",
    message: "เกิดข้อผิดพลาดกับกล้อง กรุณาลองใหม่อีกครั้ง",
    action: "retry",
  };
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npx vitest run src/lib/camera/mapCameraError.test.ts`
Expected: PASS — all 7 tests green.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/camera/mapCameraError.ts src/lib/camera/mapCameraError.test.ts
git commit -m "Ticket 1: Add Vitest setup and mapCameraError with unit tests"
```

---

### Task 2: `useCamera` hook

**Files:**
- Create: `src/hooks/useCamera.ts`

**Interfaces:**
- Consumes: `mapCameraError`, `UnsupportedCameraError`, `CameraErrorInfo` from `@/lib/camera/mapCameraError` (Task 1)
- Produces (used by `CameraCapture` in Task 4):
  ```ts
  export type CameraStatus = "idle" | "opening" | "streaming" | "captured" | "confirmed" | "error";

  export interface UseCameraResult {
    status: CameraStatus;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    capturedImage: string | null;
    error: CameraErrorInfo | null;
    open: () => Promise<void>;
    capture: () => void;
    confirm: () => void;
    retake: () => void;
    dismissError: () => void;
  }

  export function useCamera(): UseCameraResult;
  ```

- [ ] **Step 1: Implement the hook**

Create `src/hooks/useCamera.ts`:
```ts
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  mapCameraError,
  UnsupportedCameraError,
  type CameraErrorInfo,
} from "@/lib/camera/mapCameraError";

export type CameraStatus = "idle" | "opening" | "streaming" | "captured" | "confirmed" | "error";

export interface UseCameraResult {
  status: CameraStatus;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  capturedImage: string | null;
  error: CameraErrorInfo | null;
  open: () => Promise<void>;
  capture: () => void;
  confirm: () => void;
  retake: () => void;
  dismissError: () => void;
}

const VIDEO_CONSTRAINTS: MediaStreamConstraints = {
  video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
  audio: false,
};

export function useCamera(): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<CameraStatus>("idle");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<CameraErrorInfo | null>(null);

  const open = useCallback(async () => {
    setStatus("opening");
    setError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new UnsupportedCameraError();
      }
      const stream = await navigator.mediaDevices.getUserMedia(VIDEO_CONSTRAINTS);
      streamRef.current = stream;
      setStatus("streaming");
    } catch (err) {
      setError(mapCameraError(err));
      setStatus("error");
    }
  }, []);

  // Re-attach the persisted stream whenever a <video> element mounts while
  // streaming (initial open, and after retake re-mounts CameraView) — never
  // re-requests getUserMedia.
  useEffect(() => {
    if (status === "streaming" && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [status]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Draw the raw (unmirrored) frame — CSS mirroring on <video> is display-only
    // and does not affect drawImage's source pixels. Never call ctx.scale(-1, 1)
    // here: the captured image must match the user's real left/right.
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCapturedImage(canvas.toDataURL("image/png"));
    setStatus("captured");
  }, []);

  const confirm = useCallback(() => {
    setStatus("confirmed");
  }, []);

  const retake = useCallback(() => {
    setCapturedImage(null);
    setStatus("streaming");
  }, []);

  const dismissError = useCallback(() => {
    setError(null);
    setStatus("idle");
  }, []);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return { status, videoRef, capturedImage, error, open, capture, confirm, retake, dismissError };
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors. (No automated test for this hook per the spec's testing scope — `getUserMedia`/`MediaStream`/canvas are browser APIs verified manually once wired into the UI in Task 4.)

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useCamera.ts
git commit -m "Ticket 1: Add useCamera hook for camera lifecycle and capture"
```

---

### Task 3: Presentational components

**Files:**
- Create: `src/components/camera/CameraView.tsx`
- Create: `src/components/camera/CaptureControls.tsx`
- Create: `src/components/camera/CameraError.tsx`
- Create: `src/components/camera/ConfirmedPreview.tsx`

**Interfaces:**
- Consumes: nothing from earlier tasks directly (pure props-driven components); `CameraErrorAction` type from `@/lib/camera/mapCameraError` (Task 1) for `CameraError`'s prop type.
- Produces (used by `CameraCapture` in Task 4):
  ```ts
  // CameraView.tsx
  interface CameraViewProps {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    showOverlay: boolean;
  }
  export default function CameraView(props: CameraViewProps): JSX.Element;

  // CaptureControls.tsx
  type CaptureControlsProps =
    | { status: "idle"; onOpen: () => void }
    | { status: "opening" }
    | { status: "streaming"; onCapture: () => void }
    | { status: "captured"; onConfirm: () => void; onRetake: () => void };
  export default function CaptureControls(props: CaptureControlsProps): JSX.Element;

  // CameraError.tsx
  interface CameraErrorProps {
    message: string;
    action: CameraErrorAction; // "retry" | "close"
    onRetry: () => void;
    onClose: () => void;
  }
  export default function CameraError(props: CameraErrorProps): JSX.Element;

  // ConfirmedPreview.tsx
  interface ConfirmedPreviewProps {
    imageSrc: string;
    onRetake: () => void;
  }
  export default function ConfirmedPreview(props: ConfirmedPreviewProps): JSX.Element;
  ```

- [ ] **Step 1: Create `CameraView`**

Create `src/components/camera/CameraView.tsx`:
```tsx
interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  showOverlay: boolean;
}

export default function CameraView({ videoRef, showOverlay }: CameraViewProps) {
  return (
    <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg bg-black">
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
            stroke="white"
            strokeOpacity="0.5"
            strokeWidth="1.5"
          />
        </svg>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `CaptureControls`**

Create `src/components/camera/CaptureControls.tsx`:
```tsx
type CaptureControlsProps =
  | { status: "idle"; onOpen: () => void }
  | { status: "opening" }
  | { status: "streaming"; onCapture: () => void }
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
        <button type="button" onClick={props.onCapture} className={primaryButtonClass}>
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
```

- [ ] **Step 3: Create `CameraError`**

Create `src/components/camera/CameraError.tsx`:
```tsx
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
```

- [ ] **Step 4: Create `ConfirmedPreview`**

Create `src/components/camera/ConfirmedPreview.tsx`:
```tsx
interface ConfirmedPreviewProps {
  imageSrc: string;
  onRetake: () => void;
}

export default function ConfirmedPreview({ imageSrc, onRetake }: ConfirmedPreviewProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageSrc} alt="ภาพที่ยืนยันแล้ว" className="w-full max-w-md rounded-lg" />
      <p className="text-center text-sm text-zinc-500">
        กำลังเตรียมส่งต่อ Ticket 2 (MediaPipe) — ยังไม่มีในเวอร์ชันนี้
      </p>
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
```

`next/image` is intentionally not used here: `imageSrc` is an in-memory `data:` URL from canvas capture, not a static/remote asset, so a plain `<img>` is correct and the ESLint rule is suppressed for that one line.

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/components/camera/CameraView.tsx src/components/camera/CaptureControls.tsx src/components/camera/CameraError.tsx src/components/camera/ConfirmedPreview.tsx
git commit -m "Ticket 1: Add camera presentational components"
```

---

### Task 4: Wire `CameraCapture` into the homepage + full manual verification

**Files:**
- Create: `src/components/camera/CameraCapture.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `useCamera` (Task 2), `CameraView`/`CaptureControls`/`CameraError`/`ConfirmedPreview` (Task 3)

- [ ] **Step 1: Create the container component**

Create `src/components/camera/CameraCapture.tsx`:
```tsx
"use client";

import { useCamera } from "@/hooks/useCamera";
import CameraView from "./CameraView";
import CaptureControls from "./CaptureControls";
import CameraError from "./CameraError";
import ConfirmedPreview from "./ConfirmedPreview";

export default function CameraCapture() {
  const camera = useCamera();

  if (camera.status === "confirmed" && camera.capturedImage) {
    return <ConfirmedPreview imageSrc={camera.capturedImage} onRetake={camera.retake} />;
  }

  if (camera.status === "error" && camera.error) {
    return (
      <CameraError
        message={camera.error.message}
        action={camera.error.action}
        onRetry={camera.open}
        onClose={camera.dismissError}
      />
    );
  }

  if (camera.status === "captured" && camera.capturedImage) {
    return (
      <div className="flex flex-col items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={camera.capturedImage}
          alt="ภาพที่ถ่ายไว้"
          className="w-full max-w-md rounded-lg"
        />
        <CaptureControls status="captured" onConfirm={camera.confirm} onRetake={camera.retake} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <CameraView videoRef={camera.videoRef} showOverlay={camera.status === "streaming"} />
      {camera.status === "opening" ? (
        <CaptureControls status="opening" />
      ) : camera.status === "streaming" ? (
        <CaptureControls status="streaming" onCapture={camera.capture} />
      ) : (
        <CaptureControls status="idle" onOpen={camera.open} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire it into the homepage**

Replace the contents of `src/app/page.tsx`:
```tsx
import CameraCapture from "@/components/camera/CameraCapture";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 p-6 dark:bg-black">
      <CameraCapture />
    </div>
  );
}
```

- [ ] **Step 3: Type-check and build**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run build`
Expected: build succeeds, `/` prerenders (or is marked dynamic/client as appropriate) with no errors.

- [ ] **Step 4: Run the full automated test suite**

Run: `npm run test`
Expected: PASS — all `mapCameraError` tests still green.

- [ ] **Step 5: Manual verification in a real browser**

Run: `npm run dev`, open `http://localhost:3000`, and walk through every path below. Use Chrome DevTools → Application/Permissions (or `chrome://settings/content/camera`) to force each error case.

- [ ] Idle state shows only the "เปิดกล้อง" button, camera permission is **not** requested until it's clicked.
- [ ] Click "เปิดกล้อง" → browser permission prompt appears → allow → live video preview appears, mirrored (raising your right hand appears on your right side of the screen), with a faint oval overlay.
- [ ] Click "แคป" → live video is replaced by the still captured photo with "ถ่ายใหม่"/"ยืนยัน" buttons; the still photo is **not** mirrored (raising your right hand appears on your left side of the screen, i.e. true-to-life).
- [ ] Click "ถ่ายใหม่" from the captured screen → live preview returns **without** a second permission prompt (same stream reused).
- [ ] Click "แคป" again, then "ยืนยัน" → confirmed screen shows the photo, the exact text "กำลังเตรียมส่งต่อ Ticket 2 (MediaPipe) — ยังไม่มีในเวอร์ชันนี้", and a "ถ่ายใหม่" button.
- [ ] Click "ถ่ายใหม่" from the confirmed screen → live preview returns without a new permission prompt.
- [ ] Deny the camera permission (or revoke it and reload) → error screen shows the permission-denied message with a "ลองใหม่" button; clicking it re-triggers the permission prompt.
- [ ] Simulate no camera device (e.g., disable/unplug the webcam, or in DevTools set no video input device) → error screen shows the not-found message with a "ลองใหม่" button.
- [ ] Simulate an unsupported browser (e.g., temporarily stub `navigator.mediaDevices = undefined` in the DevTools console before clicking "เปิดกล้อง") → error screen shows the unsupported message with only a "ปิด" button (no "ลองใหม่"); clicking "ปิด" returns to the idle screen.
- [ ] Navigate away from the page while the camera is streaming (e.g., open a new tab, or reload) → the browser's camera-in-use indicator turns off (stream tracks stopped on unmount).
- [ ] Resize the window / try on a narrower viewport → layout doesn't break (buttons and video stay usable).

- [ ] **Step 6: Commit**

```bash
git add src/components/camera/CameraCapture.tsx src/app/page.tsx
git commit -m "Ticket 1: Wire CameraCapture into homepage"
```

---

## Post-plan: update ticket checklist

After Task 4's manual verification all passes, tick Ticket 1 in `CLAUDE.md`'s checklist (§13) the same way Ticket 0 was marked — this file is gitignored, so no separate commit is needed for it.
