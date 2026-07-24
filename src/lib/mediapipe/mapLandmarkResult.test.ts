import { describe, expect, it } from "vitest";
import { mapLandmarkResult } from "./mapLandmarkResult";
import type { FaceLandmarkerResult, NormalizedLandmark } from "@mediapipe/tasks-vision";

function fakeLandmarks(count: number): NormalizedLandmark[] {
  return Array.from({ length: count }, (_, i) => ({ x: i, y: i, z: i, visibility: 1 }));
}

function fakeResult(faceLandmarks: NormalizedLandmark[][]): FaceLandmarkerResult {
  return {
    faceLandmarks,
    faceBlendshapes: [],
    facialTransformationMatrixes: [],
  };
}

describe("mapLandmarkResult", () => {
  it("returns the landmarks of the first detected face", () => {
    const landmarks = fakeLandmarks(468);
    const result = mapLandmarkResult(fakeResult([landmarks]));
    expect(result).toBe(landmarks);
  });

  it("returns null when no face is detected", () => {
    const result = mapLandmarkResult(fakeResult([]));
    expect(result).toBeNull();
  });

  it("returns null when the first face has no landmark points", () => {
    const result = mapLandmarkResult(fakeResult([[]]));
    expect(result).toBeNull();
  });
});
