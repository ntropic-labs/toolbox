export function getNumberWheelStepDirection(deltaY: number): -1 | 0 | 1 {
  if (deltaY < 0) return 1;
  if (deltaY > 0) return -1;
  return 0;
}
