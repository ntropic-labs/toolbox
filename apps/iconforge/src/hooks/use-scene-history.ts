import { useCallback, useEffect, useRef, useState } from 'react';
import {
  commitHistory,
  redoHistory,
  undoHistory,
  type SvgHistory,
  type SvgScene
} from '@toolbox/svg-core';
import { loadScene, saveScene } from '../storage';

export function useSceneHistory() {
  const [history, setHistory] = useState<SvgHistory<SvgScene>>(() => ({
    past: [],
    present: loadScene(),
    future: []
  }));
  const [selectedId, setSelectedId] = useState(
    () => history.present.root.children.at(-1)?.id ?? ''
  );
  const presentRef = useRef<SvgScene>(history.present);

  const scene = history.present;

  useEffect(() => {
    presentRef.current = scene;
  }, [scene]);

  useEffect(() => {
    saveScene(scene);
  }, [scene]);

  const commit = useCallback((nextScene: SvgScene) => {
    setHistory((current) => {
      if (nextScene === current.present) return current;
      return commitHistory(current, nextScene);
    });
  }, []);

  const replacePresent = useCallback((nextScene: SvgScene) => {
    setHistory((current) => ({ ...current, present: nextScene }));
  }, []);

  const resetScene = useCallback((nextScene: SvgScene) => {
    setHistory({ past: [], present: nextScene, future: [] });
    setSelectedId(nextScene.root.children.at(-1)?.id ?? '');
  }, []);

  const undo = useCallback(() => setHistory((current) => undoHistory(current)), []);
  const redo = useCallback(() => setHistory((current) => redoHistory(current)), []);
  const getPresent = useCallback(() => presentRef.current, []);

  return {
    scene,
    selectedId,
    setSelectedId,
    commit,
    replacePresent,
    resetScene,
    undo,
    redo,
    getPresent,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0
  };
}
