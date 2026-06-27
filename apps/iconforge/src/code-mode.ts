import { parseSvg, type SvgDiagnostic, type SvgScene } from '@toolbox/svg-core';

export interface CodeSession {
  readonly active: boolean;
}

export interface CodeCommitDecision {
  readonly diagnostics: readonly SvgDiagnostic[];
  readonly scene?: SvgScene;
  readonly historyMode?: 'push' | 'replace';
  readonly nextSession: CodeSession;
}

export function decideCodeCommit(draft: string, session: CodeSession): CodeCommitDecision {
  const { scene, diagnostics } = parseSvg(draft);
  if (!scene) {
    return { diagnostics, nextSession: session };
  }
  return {
    scene,
    diagnostics,
    historyMode: session.active ? 'replace' : 'push',
    nextSession: { active: true }
  };
}
