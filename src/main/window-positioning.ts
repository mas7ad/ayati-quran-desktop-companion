export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface WindowPosition {
  x: number;
  y: number;
}

interface WindowPositionNearAnchorOptions {
  anchor: WindowBounds;
  windowSize: WindowSize;
  workArea: WindowBounds;
  verticalGap: number;
  avoidBounds?: WindowBounds;
  avoidGap?: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

function doBoundsOverlap(a: WindowBounds, b: WindowBounds): boolean {
  return a.x < b.x + b.width
    && a.x + a.width > b.x
    && a.y < b.y + b.height
    && a.y + a.height > b.y;
}

export function getWindowPositionNearAnchor({
  anchor,
  windowSize,
  workArea,
  verticalGap,
  avoidBounds,
  avoidGap = 0,
}: WindowPositionNearAnchorOptions): WindowPosition {
  const maxX = Math.max(workArea.x, workArea.x + workArea.width - windowSize.width);
  const maxY = Math.max(workArea.y, workArea.y + workArea.height - windowSize.height);
  const x = anchor.x + (anchor.width - windowSize.width) / 2;
  const y = anchor.y - windowSize.height + verticalGap;
  const position = {
    x: Math.round(clamp(x, workArea.x, maxX)),
    y: Math.round(clamp(y, workArea.y, maxY)),
  };
  if (!avoidBounds) {
    return position;
  }

  const bounds = { ...position, ...windowSize };
  if (!doBoundsOverlap(bounds, avoidBounds)) {
    return position;
  }

  const aboveY = avoidBounds.y - windowSize.height - avoidGap;
  if (aboveY >= workArea.y) {
    return { x: position.x, y: Math.round(aboveY) };
  }

  const sideCandidates = [
    avoidBounds.x - windowSize.width - avoidGap,
    avoidBounds.x + avoidBounds.width + avoidGap,
  ].filter((candidateX) => candidateX >= workArea.x && candidateX <= maxX);
  if (sideCandidates.length > 0) {
    const sideX = sideCandidates.reduce((closest, candidateX) => (
      Math.abs(candidateX - position.x) < Math.abs(closest - position.x) ? candidateX : closest
    ));
    return { x: Math.round(sideX), y: position.y };
  }

  const belowY = avoidBounds.y + avoidBounds.height + avoidGap;
  if (belowY <= maxY) {
    return { x: position.x, y: Math.round(belowY) };
  }

  return position;
}
