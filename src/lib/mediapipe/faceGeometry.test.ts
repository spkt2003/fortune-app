import { describe, expect, it } from "vitest";
import {
  centroidX,
  centroidY,
  closestToX,
  farthestFromX,
  height,
  regionIndices,
  splitByAnatomicalSide,
  width,
} from "./faceGeometry";

describe("width", () => {
  it("returns the x-axis span of a set of points", () => {
    expect(width([{ x: 0.2, y: 0 }, { x: 0.7, y: 0 }, { x: 0.5, y: 0 }])).toBeCloseTo(0.5);
  });
});

describe("height", () => {
  it("returns the y-axis span of a set of points", () => {
    expect(height([{ x: 0, y: 0.1 }, { x: 0, y: 0.9 }, { x: 0, y: 0.4 }])).toBeCloseTo(0.8);
  });
});

describe("centroidX / centroidY", () => {
  it("returns the mean x and y of a set of points", () => {
    const points = [{ x: 0.2, y: 0.4 }, { x: 0.4, y: 0.6 }, { x: 0.6, y: 0.8 }];
    expect(centroidX(points)).toBeCloseTo(0.4);
    expect(centroidY(points)).toBeCloseTo(0.6);
  });
});

describe("closestToX / farthestFromX", () => {
  const points = [{ x: 0.1, y: 0 }, { x: 0.5, y: 0 }, { x: 0.9, y: 0 }];

  it("closestToX returns the point nearest the target x", () => {
    expect(closestToX(points, 0.45)).toEqual({ x: 0.5, y: 0 });
  });

  it("farthestFromX returns the point furthest from the target x", () => {
    expect(farthestFromX(points, 0.1)).toEqual({ x: 0.9, y: 0 });
  });
});

describe("regionIndices", () => {
  it("returns the unique set of point indices referenced by a connection list", () => {
    const connections = [
      { start: 1, end: 2 },
      { start: 2, end: 3 },
      { start: 3, end: 1 },
    ];
    expect(regionIndices(connections).sort()).toEqual([1, 2, 3]);
  });
});

describe("splitByAnatomicalSide", () => {
  it("labels the cluster with larger mean x as the subject's left (unmirrored capture)", () => {
    const rightSideOfImage = [{ x: 0.6, y: 0 }, { x: 0.62, y: 0 }];
    const leftSideOfImage = [{ x: 0.4, y: 0 }, { x: 0.38, y: 0 }];
    const result = splitByAnatomicalSide(rightSideOfImage, leftSideOfImage);
    expect(result.left).toBe(rightSideOfImage);
    expect(result.right).toBe(leftSideOfImage);
  });

  it("works regardless of argument order", () => {
    const rightSideOfImage = [{ x: 0.6, y: 0 }];
    const leftSideOfImage = [{ x: 0.4, y: 0 }];
    const result = splitByAnatomicalSide(leftSideOfImage, rightSideOfImage);
    expect(result.left).toBe(rightSideOfImage);
    expect(result.right).toBe(leftSideOfImage);
  });
});
