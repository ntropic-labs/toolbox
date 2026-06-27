import { describe, expect, it } from 'vitest';
import { decideCodeCommit, type CodeSession } from './code-mode';

const inactive: CodeSession = { active: false };
const active: CodeSession = { active: true };
const validSvg = '<svg viewBox="0 0 24 24"><rect width="8" height="8" /></svg>';

describe('decideCodeCommit', () => {
  it('pushes a history entry for the first valid edit of a session', () => {
    const decision = decideCodeCommit(validSvg, inactive);

    expect(decision.scene).toBeDefined();
    expect(decision.historyMode).toBe('push');
    expect(decision.nextSession.active).toBe(true);
    expect(decision.diagnostics).toHaveLength(0);
  });

  it('replaces the current entry for later edits in the same session', () => {
    const decision = decideCodeCommit(validSvg, active);

    expect(decision.historyMode).toBe('replace');
    expect(decision.nextSession.active).toBe(true);
  });

  it('commits nothing and surfaces diagnostics for invalid SVG', () => {
    const decision = decideCodeCommit('<svg><rect>', active);

    expect(decision.scene).toBeUndefined();
    expect(decision.historyMode).toBeUndefined();
    expect(decision.diagnostics.length).toBeGreaterThan(0);
    expect(decision.nextSession).toBe(active);
  });

  it('round-trips a valid scene to children of the same tags', () => {
    const decision = decideCodeCommit(validSvg, inactive);

    expect(decision.scene?.root.children.map((child) => child.tag)).toEqual(['rect']);
  });
});
