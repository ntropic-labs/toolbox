import { describe, expect, it } from 'vitest';
import { getNumberWheelStepDirection } from './field-utils';

describe('field inputs', () => {
  it('maps wheel movement to number input step directions', () => {
    expect(getNumberWheelStepDirection(-1)).toBe(1);
    expect(getNumberWheelStepDirection(-40)).toBe(1);
    expect(getNumberWheelStepDirection(1)).toBe(-1);
    expect(getNumberWheelStepDirection(40)).toBe(-1);
    expect(getNumberWheelStepDirection(0)).toBe(0);
  });
});
