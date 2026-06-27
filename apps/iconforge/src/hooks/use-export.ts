import { useCallback, useEffect, useState } from 'react';
import {
  defaultExportSelection,
  exportSelection,
  planExport,
  type ExportSelection
} from '@toolbox/export-engine';
import type { SvgScene } from '@toolbox/svg-core';
import { bakeTextToShapes } from '../fonts/bake-text';
import { clampInset, exportInsetStorageKey, loadExportInset } from '../storage';
import {
  getExportFailedNotice,
  getExportReadyNotice,
  getExportTextWarningNotice,
  type EditorNotice
} from '../components/editor-notice-model';

interface UseExportParams {
  readonly scene: SvgScene;
  readonly name: string;
  readonly notifyExport: (notice: EditorNotice) => void;
}

export function useExport({ scene, name, notifyExport }: UseExportParams) {
  const [exportSel, setExportSel] = useState<ExportSelection>(defaultExportSelection);
  const [exportInset, setExportInset] = useState<number>(() => loadExportInset());
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    localStorage.setItem(exportInsetStorageKey, String(exportInset));
  }, [exportInset]);

  const changeExportInset = useCallback((value: number) => {
    setExportInset(clampInset(value));
  }, []);

  const runExport = useCallback(async () => {
    setExporting(true);
    try {
      const { scene: baked, warnings } = bakeTextToShapes(scene);
      const { blob, filename } = await exportSelection(baked, exportSel, {
        inset: exportInset / 100,
        name
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
      notifyExport(
        warnings.length > 0
          ? getExportTextWarningNotice(warnings.length)
          : getExportReadyNotice(planExport(exportSel, baked).length, filename)
      );
    } catch {
      notifyExport(getExportFailedNotice());
    } finally {
      setExporting(false);
    }
  }, [scene, name, exportSel, exportInset, notifyExport]);

  return { exportSel, setExportSel, exportInset, changeExportInset, exporting, runExport };
}
