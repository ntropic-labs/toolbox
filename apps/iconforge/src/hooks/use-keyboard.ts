import { useEffect } from 'react';
import type { SvgScene } from '@toolbox/svg-core';
import { removeLayer } from '../scene-editor';

interface UseKeyboardParams {
  readonly scene: SvgScene;
  readonly selectedId: string;
  readonly commit: (scene: SvgScene) => void;
  readonly undo: () => void;
  readonly redo: () => void;
}

export function useKeyboard({ scene, selectedId, commit, undo, redo }: UseKeyboardParams) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.tagName === 'SELECT';
      const inCodeEditor = Boolean(target?.closest?.('.if-code-view'));
      if (!inCodeEditor && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        undo();
      }
      if (!inCodeEditor && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
      }
      if (!isTyping && event.key === 'Delete' && selectedId) {
        event.preventDefault();
        commit(removeLayer(scene, selectedId));
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [commit, redo, scene, selectedId, undo]);
}
