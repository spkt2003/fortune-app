# Ticket 4: Face Feature Calculation — Design

## Scope

Add a pure function that computes numeric geometric ratios from the 468 MediaPipe face landmarks (already available since Ticket 3's `useFaceLandmarks`/`mapLandmarkResult`). This ticket delivers **only** the calculation function plus unit tests — it is not wired into `CameraCapture` or any UI, and it does not touch the Gemini prompt/API route. Ticket 5 (gender/age form) and Ticket 6 (API route + prompt assembly) will consume this function's output later.

## Key decision: raw ratios only, no classification

Earlier drafts considered having this ticket classify each measurement into a Thai label (e.g. `eyeDistance: "ตาห่างกว้าง"`) using hand-picked thresholds. That was dropped: any threshold we invent here has no real dataset behind it, and the app's own prompt (CLAUDE.md §6) already casts Gemini as "ผู้เชี่ยวชาญด้านโหงวเฮ้ง" — the interpretation step belongs to Gemini, not our code. This also matches CLAUDE.md §1's rule against implying false precision.

So `computeFaceFeatures` returns **only numeric ratios**, each under a self-describing field name. No thresholds, no buckets, no Thai strings. Ticket 6 will drop this object straight into the `{faceFeatures}` slot of the prompt template and let Gemini read and interpret the numbers itself.

## Output shape

```ts
// src/lib/mediapipe/computeFaceFeatures.ts
export interface FaceFeatures {
  faceLengthToWidthRatio: number;
  eyeDistanceToFaceWidthRatio: number;
  leftEyeWidthToFaceWidthRatio: number;
  rightEyeWidthToFaceWidthRatio: number;
  eyebrowGapToEyeDistanceRatio: number;
  noseWidthToFaceWidthRatio: number;
  noseLengthToFaceHeightRatio: number;
  mouthWidthToFaceWidthRatio: number;
  upperLipToLowerLipThicknessRatio: number;
  jawWidthToCheekboneWidthRatio: number;
  foreheadHeightToFaceHeightRatio: number;
  leftFaceHalfWidthRatio: number;
  rightFaceHalfWidthRatio: number;
  leftEyeSlantRatio: number;
  rightEyeSlantRatio: number;
}

export function computeFaceFeatures(landmarks: NormalizedLandmark[]): FaceFeatures;
```

15 fields total. Function throws if `landmarks.length === 0` (callers are expected to have already checked via `mapLandmarkResult`, same contract as today).

| Field | Meaning (โหงวเฮ้ง angle) |
|---|---|
| `faceLengthToWidthRatio` | รูปหน้ายาว/กลม |
| `eyeDistanceToFaceWidthRatio` | ระยะห่างตา |
| `leftEyeWidthToFaceWidthRatio` / `rightEyeWidthToFaceWidthRatio` | ขนาดตาซ้าย/ขวา |
| `eyebrowGapToEyeDistanceRatio` | ระยะห่างคิ้ว |
| `noseWidthToFaceWidthRatio` | ความกว้างจมูก |
| `noseLengthToFaceHeightRatio` | ความยาวจมูก (วัยกลางคน/การเงิน/ความมั่นใจ) |
| `mouthWidthToFaceWidthRatio` | ความกว้างปาก (การเข้าสังคม/รับทรัพย์) |
| `upperLipToLowerLipThicknessRatio` | สัดส่วนปากบน/ล่าง (วาทศิลป์/ความสัมพันธ์) |
| `jawWidthToCheekboneWidthRatio` | รูปคาง/กราม |
| `foreheadHeightToFaceHeightRatio` | ความสูงหน้าผาก |
| `leftFaceHalfWidthRatio` / `rightFaceHalfWidthRatio` | สัดส่วนใบหน้าซ้าย/ขวาเทียบเส้นกึ่งกลาง (พื้นดวงกำเนิด vs สร้างขึ้นภายหลัง) |
| `leftEyeSlantRatio` / `rightEyeSlantRatio` | หางตาชี้ขึ้น(เฉี่ยว)/ตก ซ้าย-ขวา |

## Measurement approach

Two kinds of source data for landmark points:

1. **Region bounding boxes from `FaceLandmarker`'s own exported connection constants** (`FACE_LANDMARKS_FACE_OVAL`, `FACE_LANDMARKS_LEFT_EYE`, `FACE_LANDMARKS_RIGHT_EYE`, `FACE_LANDMARKS_LEFT_EYEBROW`, `FACE_LANDMARKS_RIGHT_EYEBROW`, `FACE_LANDMARKS_LIPS`) — these are static `Connection[]` arrays already shipped in `@mediapipe/tasks-vision`. We extract the unique point indices from each region's connections and take min/max x/y to get widths and heights. This avoids hand-transcribing index numbers for regions the library already defines, reducing transcription-error risk.
2. **Specific single-point indices** for the handful of measurements that need one exact point rather than a region (nose bridge/tip/base, nostril width, upper/lower lip midpoints, inner/outer eye corners for slant). MediaPipe doesn't export a `FACE_LANDMARKS_NOSE` constant, so these indices must be taken from the official canonical 468-point face mesh index map and pinned as named constants in the module, each with a comment stating what the point is. Implementation must cross-check these against an authoritative reference before relying on them (see Testing).

## Left/right determination (critical — see project memory `physiognomy_left_right_asymmetry`)

The capture pipeline stores the **raw, unmirrored** camera frame (confirmed in Ticket 1/3), so the image is a normal (non-mirrored) photo: the subject's own left side appears on the **right** side of the image (larger x in normalized landmark coordinates), same as in an ordinary photo of another person facing the camera.

Rather than trust `@mediapipe/tasks-vision`'s `LEFT_EYE`/`RIGHT_EYE` constant naming (which may label sides from the image's perspective, not the subject's — not verified), `computeFaceFeatures` determines sidedness itself, geometrically:

1. Compute the face midline x as the mean x of the two eye region centroids (or nose bridge point).
2. For any paired region/point, compare its mean x against the midline.
3. The cluster with **larger x** (right side of image) is labeled the subject's **left**; the cluster with **smaller x** is the subject's **right**.

This makes correctness independent of whichever raw index set MediaPipe's constants happen to be named, and keeps the mapping in one place, documented with a comment referencing this rationale.

## Testing

`computeFaceFeatures.test.ts` (Vitest), using synthetic `NormalizedLandmark[]` fixtures (not a real captured face — deterministic, hand-constructed coordinates):

- A symmetric synthetic face → left/right paired fields come out equal (or within floating point tolerance).
- An asymmetric synthetic face (e.g. one eye region shifted/scaled) → the corresponding left/right fields differ in the expected direction, and the geometric left/right assignment matches which side of the midline the shifted feature was placed on (locks in the sidedness logic independent of any real camera capture).
- All 15 fields are present and finite (no `NaN`/`Infinity`) for a well-formed fixture.
- Basic ratio sanity: e.g. widening the synthetic face's oval increases `faceLengthToWidthRatio`'s denominator as expected.

No golden/real-photo fixture is required for this ticket — pure geometry on synthetic points is sufficient to validate the math and the left/right logic. A manual sanity check (run against one real capture during Ticket 5/6 integration, eyeball whether left/right fields look plausible) is deferred to whichever ticket first wires this into the live camera flow, since this ticket has no UI hook to run it from.

## Out of scope (deferred)

- Wiring `computeFaceFeatures` into `useFaceLandmarks` / `CameraCapture` — no consumer exists yet (Ticket 5 gender/age form, Ticket 6 API route, both not started). Wiring happens when a real consumer needs the data, per the "lib function + tests only" scope agreed for this ticket.
- Any classification, labeling, or thresholding of the ratios into Thai descriptive text — left entirely to Gemini via the Ticket 6 prompt.
- Sending these values anywhere over the network (that's Ticket 6's job, still subject to CLAUDE.md §3's "face features only, never raw images" rule — already satisfied since this function only ever consumes landmark numbers, never pixel data).
