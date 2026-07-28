import { describe, expect, it } from "vitest";
import { mapLandmarkResult, mapTransformMatrix } from "./mapLandmarkResult";
import type { FaceLandmarkerResult, Matrix, NormalizedLandmark } from "@mediapipe/tasks-vision";

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

function fakeMatrix(): Matrix {
  return { rows: 4, columns: 4, data: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1] };
}

function mapLandmarkResultFixture(facialTransformationMatrixes: Matrix[]): FaceLandmarkerResult {
  return { faceLandmarks: [], faceBlendshapes: [], facialTransformationMatrixes };
}

describe("mapTransformMatrix", () => {
  it("returns the first face's transformation matrix", () => {
    const matrix = fakeMatrix();
    const result = mapLandmarkResultFixture([matrix]);
    expect(mapTransformMatrix(result)).toBe(matrix);
  });

  it("returns null when no transformation matrix is present", () => {
    const result = mapLandmarkResultFixture([]);
    expect(mapTransformMatrix(result)).toBeNull();
  });
});
