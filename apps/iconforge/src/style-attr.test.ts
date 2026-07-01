import { describe, expect, it } from 'vitest';
import { readStyleProperty, writeStyleProperty } from './style-attr';

describe('style-attr', () => {
  it('reads a property value from a style string', () => {
    expect(readStyleProperty('text-transform:uppercase;color:red', 'text-transform')).toBe(
      'uppercase'
    );
    expect(readStyleProperty('color:red', 'text-transform')).toBeNull();
    expect(readStyleProperty(undefined, 'text-transform')).toBeNull();
  });

  it('sets a property, preserving other declarations', () => {
    expect(writeStyleProperty('color:red', 'text-transform', 'uppercase')).toBe(
      'color:red;text-transform:uppercase'
    );
  });

  it('replaces an existing property in place', () => {
    expect(
      writeStyleProperty('text-transform:lowercase;color:red', 'text-transform', 'uppercase')
    ).toBe('text-transform:uppercase;color:red');
  });

  it('removes a property when the value is null and collapses to empty', () => {
    expect(writeStyleProperty('text-transform:uppercase', 'text-transform', null)).toBe('');
    expect(writeStyleProperty('text-transform:uppercase;color:red', 'text-transform', null)).toBe(
      'color:red'
    );
  });
});
