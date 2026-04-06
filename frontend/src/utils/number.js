export function parseNumericInput(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function clampToRange(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
