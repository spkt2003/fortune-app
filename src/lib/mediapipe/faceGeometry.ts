export interface Point2D {
  x: number;
  y: number;
}

export interface Connection {
  start: number;
  end: number;
}

export function width(points: Point2D[]): number {
  const xs = points.map((p) => p.x);
  return Math.max(...xs) - Math.min(...xs);
}

export function height(points: Point2D[]): number {
  const ys = points.map((p) => p.y);
  return Math.max(...ys) - Math.min(...ys);
}

export function centroidX(points: Point2D[]): number {
  return points.reduce((sum, p) => sum + p.x, 0) / points.length;
}

export function centroidY(points: Point2D[]): number {
  return points.reduce((sum, p) => sum + p.y, 0) / points.length;
}

export function closestToX(points: Point2D[], targetX: number): Point2D {
  return points.reduce((best, p) =>
    Math.abs(p.x - targetX) < Math.abs(best.x - targetX) ? p : best,
  );
}

export function farthestFromX(points: Point2D[], targetX: number): Point2D {
  return points.reduce((best, p) =>
    Math.abs(p.x - targetX) > Math.abs(best.x - targetX) ? p : best,
  );
}

export function regionIndices(connections: Connection[]): number[] {
  return [...new Set(connections.flatMap((c) => [c.start, c.end]))];
}

// Splits two point clusters into the subject's own left/right side. The capture
// pipeline always stores the raw, unmirrored camera frame (see project memory
// `physiognomy_left_right_asymmetry`), so the image is a normal, non-mirrored
// photo: the subject's own left side appears at LARGER x (same as an ordinary
// photo of someone facing you — their right hand is on your left). The cluster
// with the larger mean x is therefore the subject's left.
export function splitByAnatomicalSide<T extends Point2D>(
  clusterA: T[],
  clusterB: T[],
): { left: T[]; right: T[] } {
  return centroidX(clusterA) > centroidX(clusterB)
    ? { left: clusterA, right: clusterB }
    : { left: clusterB, right: clusterA };
}
