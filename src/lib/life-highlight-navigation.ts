export function nextHighlight(index: number, direction: number, count: number) {
  return count > 0 ? ((index + direction) % count + count) % count : 0;
}

export function highlightSwipe(dx: number, dy: number) {
  return Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.25
    ? (dx < 0 ? 1 : -1) : 0;
}
