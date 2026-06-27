import { useCallback, useEffect, useRef, useState } from 'react';
import { parseSvg, serializeSvg, type SvgDiagnostic, type SvgScene } from '@toolbox/svg-core';
import { formatSvgScene, optimizeSvgScene } from '@toolbox/svg-ops';
import { decideCodeCommit, type CodeSession } from '../code-mode';
import type { PreviewMode } from '../components/preview-mode-toggle';

interface UseCodeSyncParams {
  readonly scene: SvgScene;
  readonly commit: (scene: SvgScene) => void;
  readonly replacePresent: (scene: SvgScene) => void;
  readonly getPresent: () => SvgScene;
}

export function useCodeSync({ scene, commit, replacePresent, getPresent }: UseCodeSyncParams) {
  const [mode, setMode] = useState<PreviewMode>('preview');
  const [codeDraft, setCodeDraft] = useState('');
  const [codeDiagnostics, setCodeDiagnostics] = useState<readonly SvgDiagnostic[]>([]);
  const [optimizing, setOptimizing] = useState(false);
  const codeSessionRef = useRef<CodeSession>({ active: false });
  const codeOriginSceneRef = useRef<SvgScene | null>(null);

  const applyCodeDraft = useCallback(
    (draft: string) => {
      const decision = decideCodeCommit(draft, codeSessionRef.current);
      setCodeDiagnostics(decision.diagnostics);
      if (!decision.scene || !decision.historyMode) return;
      const nextScene = decision.scene;
      if (serializeSvg(nextScene) === serializeSvg(getPresent())) return;
      codeSessionRef.current = decision.nextSession;
      codeOriginSceneRef.current = nextScene;
      if (decision.historyMode === 'push') {
        commit(nextScene);
      } else {
        replacePresent(nextScene);
      }
    },
    [commit, replacePresent, getPresent]
  );

  useEffect(() => {
    if (mode !== 'code') return undefined;
    const handle = window.setTimeout(() => applyCodeDraft(codeDraft), 400);
    return () => window.clearTimeout(handle);
  }, [codeDraft, mode, applyCodeDraft]);

  useEffect(() => {
    if (mode !== 'code') return;
    if (scene === codeOriginSceneRef.current) return;
    setCodeDraft(serializeSvg(scene, { pretty: true }));
    setCodeDiagnostics([]);
    codeSessionRef.current = { active: false };
    codeOriginSceneRef.current = scene;
  }, [scene, mode]);

  const changeMode = useCallback(
    (next: PreviewMode) => {
      if (next === mode) return;
      if (next === 'code') {
        setCodeDraft(serializeSvg(scene, { pretty: true }));
        setCodeDiagnostics([]);
        codeSessionRef.current = { active: false };
        codeOriginSceneRef.current = scene;
      } else if (mode === 'code') {
        applyCodeDraft(codeDraft);
      }
      setMode(next);
    },
    [mode, scene, codeDraft, applyCodeDraft]
  );

  const prettifyCode = useCallback(() => {
    const parsed = parseSvg(codeDraft);
    setCodeDraft(formatSvgScene(parsed.scene ?? scene));
  }, [codeDraft, scene]);

  const optimizeCode = useCallback(
    async (removeHidden = false) => {
      setOptimizing(true);
      try {
        const parsed = parseSvg(codeDraft);
        const optimized = await optimizeSvgScene(parsed.scene ?? scene, { removeHidden });
        setCodeDraft(optimized);
      } catch {
        setCodeDiagnostics([{ message: 'Could not optimize this SVG.' }]);
      } finally {
        setOptimizing(false);
      }
    },
    [codeDraft, scene]
  );

  return {
    mode,
    changeMode,
    codeDraft,
    setCodeDraft,
    codeDiagnostics,
    optimizing,
    prettifyCode,
    optimizeCode
  };
}
