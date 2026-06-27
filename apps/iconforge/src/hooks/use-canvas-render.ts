import { useEffect, useRef } from 'react';
import { insetViewBox } from '@toolbox/export-engine';
import { renderSceneToImage } from '@toolbox/svg-render';
import type { SvgScene } from '@toolbox/svg-core';
import type { PreviewMode } from '../components/preview-mode-toggle';
import { previewFontFaceCss } from '../fonts/font-embed';

const canvasSize = 1024;

interface UseCanvasRenderParams {
  readonly scene: SvgScene;
  readonly exportInset: number;
  readonly mode: PreviewMode;
}

export function useCanvasRender({ scene, exportInset, mode }: UseCanvasRenderParams) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (mode !== 'preview') return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    
    if (canvas.width !== canvasSize) canvas.width = canvasSize;
    if (canvas.height !== canvasSize) canvas.height = canvasSize;
    const previewScene =
      exportInset > 0
        ? { root: { ...scene.root, viewBox: insetViewBox(scene.root.viewBox, exportInset / 100) } }
        : scene;
    const fontFaceCss = previewFontFaceCss(previewScene);

    let cancelled = false;
    void renderSceneToImage(previewScene, {
      size: canvasSize,
      ...(fontFaceCss.length === 0 ? {} : { fontFaceCss })
    })
      .then((image) => {
        if (cancelled) return;
        context.clearRect(0, 0, canvasSize, canvasSize);
        context.drawImage(image, 0, 0, canvasSize, canvasSize);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [scene, exportInset, mode]);

  return canvasRef;
}
