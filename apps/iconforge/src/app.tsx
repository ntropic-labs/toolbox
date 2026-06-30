import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { exportPngSizeChoices, framedScene, planExport } from '@toolbox/export-engine';
import { outlineSvgSceneText, sceneToComponent } from '@toolbox/svg-ops';
import { addNode, createElementNode, parseSvg, type SvgScene } from '@toolbox/svg-core';
import { renderToMarkup } from '@toolbox/svg-render';
import { AdjustTab, DocumentControls, type FontStatus } from './components/adjust-tab';
import { CanvasPreview } from './components/canvas-preview';
import { CodeView } from './components/code-view';
import { ComponentView } from './components/component-view';
import { preloadCodeEditor, preloadComponentEditor } from './components/lazy-code-editors';
import { PreviewModeToggle } from './components/preview-mode-toggle';
import { EditorShell } from './components/editor-shell';
import { ExportTab } from './components/export-tab';
import {
  getLayerDeletedNotice,
  getSvgUploadedNotice,
  getSvgUploadFailedNotice
} from './components/editor-notice-model';
import { showNotice } from './notify';
import { ConfirmDialog } from './components/confirm-dialog';
import { ProjectMenu } from './components/project-menu';
import { TabDock } from './components/tab-dock';
import {
  createProject,
  deleteProject,
  duplicateProject,
  getCurrentProject,
  getCurrentProjectName,
  getStorageEstimate,
  importProject,
  loadProjects,
  loadScene,
  maxExportInsetPct,
  projectFileBase,
  renameCurrentProject,
  serializeProjectFile,
  setCurrentProject,
  type ProjectFile
} from './storage';
import {
  addLayer,
  centerInUserSpace,
  centerLayer,
  duplicateLayer,
  fitTransform,
  getBackgroundColor,
  getSelectedNode,
  layerCenter,
  listLayers,
  normalizeCanvas,
  removeLayer,
  reorderLayer,
  setAdaptiveRole,
  setBackgroundColor,
  setLayerCenter,
  setLayerCenterPoint,
  setLayerRotation,
  setNodeText,
  toggleLayerVisible,
  updateNodeField,
  type AdaptiveRole,
  type LayerBox,
  type SceneLayer,
  type SceneNodeKind
} from './scene-editor';
import { parseTransform } from './node-primitives';
import { bakeTextToShapes } from './fonts/bake-text';
import { loadFontFromFile, loadGoogleFont } from './fonts/load-font';
import { presetFontFamilies } from './fonts/presets';
import type { LoadedFont } from '@toolbox/svg-ops';
import { getLoadedFont } from './fonts/font-registry';
import { getTextShadow, setTextShadow, type TextShadow } from './text-effects';
import { useTheme } from './hooks/use-theme';
import { useSceneHistory } from './hooks/use-scene-history';
import { useCodeSync } from './hooks/use-code-sync';
import { useCanvasRender } from './hooks/use-canvas-render';
import { useExport } from './hooks/use-export';
import { useKeyboard } from './hooks/use-keyboard';

export function App() {
  const { theme, toggleTheme } = useTheme();
  const {
    scene,
    selectedId,
    setSelectedId,
    commit,
    replacePresent,
    resetScene,
    undo,
    redo,
    getPresent,
    canUndo,
    canRedo
  } = useSceneHistory();
  const {
    mode,
    changeMode,
    codeDraft,
    setCodeDraft,
    codeDiagnostics,
    optimizing,
    prettifyCode,
    optimizeCode
  } = useCodeSync({ scene, commit, replacePresent, getPresent });
  const [projectName, setProjectName] = useState(getCurrentProjectName);
  const { exportSel, setExportSel, exportInset, changeExportInset, exporting, runExport } =
    useExport({
      scene,
      name: projectFileBase(projectName),
      notifyExport: showNotice
    });
  const canvasRef = useCanvasRender({ scene, exportInset, mode });
  const [showSafeGuide, setShowSafeGuide] = useState(true);
  const [projects, setProjects] = useState(loadProjects);
  const [currentProjectId, setCurrentProjectId] = useState(() => getCurrentProject().id);
  const [storageEstimate, setStorageEstimate] = useState(getStorageEstimate);

  const refreshProjects = useCallback(() => {
    setProjects(loadProjects());
    setCurrentProjectId(getCurrentProject().id);
    setStorageEstimate(getStorageEstimate());
  }, []);

  const switchTo = useCallback(() => {
    resetScene(loadScene());
    setProjectName(getCurrentProjectName());
    refreshProjects();
  }, [resetScene, refreshProjects]);

  const renameProject = useCallback((name: string) => {
    setProjectName(name);
    renameCurrentProject(name);
  }, []);

  const openProject = useCallback(
    (id: string) => {
      setCurrentProject(id);
      switchTo();
    },
    [switchTo]
  );

  const newProject = useCallback(() => {
    createProject();
    switchTo();
  }, [switchTo]);

  const duplicateProjectById = useCallback(
    (id: string) => {
      duplicateProject(id);
      switchTo();
    },
    [switchTo]
  );

  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  const requestDeleteProject = useCallback(
    (id: string) => {
      const target = projects.find((project) => project.id === id);
      if (target) setPendingDelete({ id, name: target.name });
    },
    [projects]
  );

  const confirmDeleteProject = useCallback(() => {
    if (!pendingDelete) return;
    const { id } = pendingDelete;
    setPendingDelete(null);
    const wasCurrent = id === getCurrentProject().id;
    deleteProject(id);
    if (wasCurrent) {
      switchTo();
    } else {
      refreshProjects();
    }
  }, [pendingDelete, switchTo, refreshProjects]);

  const importProjectFromFile = useCallback(
    (file: ProjectFile) => {
      importProject(file);
      switchTo();
    },
    [switchTo]
  );

  const downloadProject = useCallback(() => {
    const json = serializeProjectFile(projectName, scene);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const fileBase = projectFileBase(projectName);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${fileBase}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [projectName, scene]);

  useKeyboard({ scene, selectedId, commit, undo, redo });

  const selectedNode = getSelectedNode(scene, selectedId);

  const [fontsReadyTick, setFontsReadyTick] = useState(0);
  useEffect(() => {
    const fonts = document.fonts;
    if (!fonts) return;
    let cancelled = false;
    const bump = () => {
      if (!cancelled) setFontsReadyTick((tick) => tick + 1);
    };
    fonts.addEventListener?.('loadingdone', bump);
    void fonts.ready?.then(bump);
    return () => {
      cancelled = true;
      fonts.removeEventListener?.('loadingdone', bump);
    };
  }, []);

  const measurement = useMemo(
    () => (selectedNode ? measureLayer(scene, selectedId) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedNode, scene, selectedId, fontsReadyTick]
  );
  const selectedBox = measurement?.bbox ?? null;
  const selectedCenter = measurement?.center ?? null;

  const selectedRotation = selectedNode
    ? parseTransform(selectedNode.attributes.transform).rotate
    : 0;

  const selectionBox = useMemo(() => {
    if (mode !== 'preview' || exportInset !== 0 || !selectedNode || !selectedBox) return null;
    const [vx, vy, vw, vh] = scene.root.viewBox;
    if (vw <= 0 || vh <= 0) return null;
    const { tx, ty, scale } = parseTransform(selectedNode.attributes.transform);
    const x = scale * selectedBox.x + tx;
    const y = scale * selectedBox.y + ty;
    return {
      left: ((x - vx) / vw) * 100,
      top: ((y - vy) / vh) * 100,
      width: ((scale * selectedBox.width) / vw) * 100,
      height: ((scale * selectedBox.height) / vh) * 100
    };
  }, [mode, exportInset, selectedNode, selectedBox, scene]);

  const componentSource = useMemo(() => {
    if (mode !== 'react' && mode !== 'native') return '';
    const baked = bakeTextToShapes(scene).scene;
    const framed = framedScene(baked, exportInset / 100);
    return sceneToComponent(framed, { native: mode === 'native' });
  }, [mode, scene, exportInset]);

  const copyComponent = useCallback(() => {
    void navigator.clipboard?.writeText(componentSource);
  }, [componentSource]);

  const [fontInput, setFontInput] = useState('');
  const [fontStatus, setFontStatus] = useState<FontStatus>({ state: 'idle' });
  const [loadedFamilies, setLoadedFamilies] = useState<readonly string[]>([]);

  const finishFontLoad = useCallback(
    (font: LoadedFont) => {
      if (!selectedId) return;
      commit(updateNodeField(getPresent(), selectedId, 'font-family', font.familyName));
      setLoadedFamilies((prev) =>
        prev.includes(font.familyName) ? prev : [...prev, font.familyName]
      );
      setFontStatus({ state: 'loaded', message: font.familyName });
    },
    [selectedId, getPresent, commit]
  );

  const loadFont = useCallback(async () => {
    if (!selectedId || fontInput.trim().length === 0) return;
    setFontStatus({ state: 'loading' });
    try {
      finishFontLoad(await loadGoogleFont(fontInput));
    } catch {
      setFontStatus({
        state: 'error',
        message: 'Could not load that font. Check the name or URL.'
      });
    }
  }, [selectedId, fontInput, finishFontLoad]);

  const uploadFont = useCallback(
    async (file: File) => {
      if (!selectedId) return;
      setFontStatus({ state: 'loading' });
      try {
        finishFontLoad(await loadFontFromFile(file));
      } catch {
        setFontStatus({
          state: 'error',
          message: 'Could not read that font file. Use a .ttf, .otf, .woff, or .woff2.'
        });
      }
    },
    [selectedId, finishFontLoad]
  );

  const selectFont = useCallback(
    async (family: string) => {
      if (!selectedId || family.length === 0) return;
      const existing = getLoadedFont(family);
      if (existing) {
        finishFontLoad(existing);
        return;
      }
      setFontStatus({ state: 'loading' });
      try {
        finishFontLoad(await loadGoogleFont(family));
      } catch {
        setFontStatus({ state: 'error', message: `Could not load ${family} from Google.` });
      }
    },
    [selectedId, finishFontLoad]
  );

  const convertToShapes = useCallback(() => {
    if (!selectedNode || selectedNode.tag.toLowerCase() !== 'text') return;
    const family = selectedNode.attributes['font-family'];
    const font = family ? getLoadedFont(family) : null;
    if (!font) {
      setFontStatus({ state: 'error', message: 'Load a font before converting.' });
      return;
    }
    const result = outlineSvgSceneText(scene, { nodeId: selectedNode.id, font });
    commit(result.scene);
  }, [selectedNode, scene, commit]);

  const shadow = selectedNode ? getTextShadow(scene, selectedNode.id) : null;

  const setShadow = useCallback(
    (next: TextShadow | null) => {
      if (selectedId) commit(setTextShadow(scene, selectedId, next));
    },
    [selectedId, scene, commit]
  );

  const selectedFontFamily =
    selectedNode?.tag.toLowerCase() === 'text'
      ? (selectedNode.attributes['font-family'] ?? '')
      : '';
  const fontFamilies = useMemo(() => {
    const all = [...presetFontFamilies, ...loadedFamilies];
    if (selectedFontFamily) all.push(selectedFontFamily);
    return [...new Set(all)];
  }, [loadedFamilies, selectedFontFamily]);

  useEffect(() => {
    const preload = () => {
      preloadCodeEditor();
      preloadComponentEditor();
    };
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(preload);
      return () => window.cancelIdleCallback(id);
    }
    const timer = window.setTimeout(preload, 300);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const node = getSelectedNode(scene, selectedId);
    const family = node?.tag.toLowerCase() === 'text' ? node.attributes['font-family'] : undefined;
    /* eslint-disable react-hooks/set-state-in-effect */
    setFontInput(family ?? '');
    setFontStatus(
      family && getLoadedFont(family) ? { state: 'loaded', message: family } : { state: 'idle' }
    );
    /* eslint-enable react-hooks/set-state-in-effect */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const deleteLayerById = useCallback(
    (id: string) => {
      const layer = listLayers(scene, selectedId).find((candidate) => candidate.id === id);
      commit(removeLayer(scene, id));
      if (layer) {
        showNotice(getLayerDeletedNotice(layer.label));
      }
    },
    [commit, scene, selectedId]
  );

  function addShape(kind: SceneNodeKind) {
    const result = addLayer(scene, kind);
    commit(result.scene);
    setSelectedId(result.selectedId);
  }

  function updateField(name: string, value: string) {
    if (!selectedId) return;
    const edited = updateNodeField(scene, selectedId, name, value);
    if (sizeFieldNames.has(name) && selectedNode && selectedBox) {
      const before = layerCenter(selectedNode, selectedBox);
      const grown = measureLayer(edited, selectedId)?.bbox;
      if (grown) {
        commit(setLayerCenterPoint(edited, selectedId, grown, before.x, before.y));
        return;
      }
    }
    commit(edited);
  }

  function updateText(text: string) {
    if (!selectedId) return;
    commit(setNodeText(scene, selectedId, text));
  }

  function toggleVisible(layer: SceneLayer) {
    commit(toggleLayerVisible(scene, layer.id));
  }

  function reorder(id: string, direction: -1 | 1) {
    commit(reorderLayer(scene, id, direction));
  }

  function duplicate(id: string) {
    const result = duplicateLayer(scene, id);
    commit(result.scene);
    setSelectedId(result.selectedId);
  }

  function centerSelected() {
    if (!selectedId) return;
    const bbox = measureLayer(scene, selectedId)?.bbox;
    if (bbox) commit(centerLayer(scene, selectedId, bbox));
  }

  function fitCanvas() {
    commit(normalizeCanvas(scene));
  }

  function setCenter(axis: 'x' | 'y', value: number) {
    if (!selectedId || !selectedBox) return;
    commit(setLayerCenter(scene, selectedId, selectedBox, axis, value));
  }

  function setRotation(degrees: number) {
    if (!selectedId || !selectedBox) return;
    commit(setLayerRotation(scene, selectedId, selectedBox, degrees));
  }

  function changeBackground(color: string) {
    commit(setBackgroundColor(scene, color));
  }

  function setSelectedAdaptiveRole(role: AdaptiveRole) {
    if (!selectedId) return;
    commit(setAdaptiveRole(scene, selectedId, role));
  }

  async function uploadSvg(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    try {
      const parsed = parseSvg(await file.text());
      if (!parsed.scene) throw new Error('Invalid SVG.');
      const name = file.name.replace(/\.svg$/i, '') || 'Uploaded SVG';
      const fit = fitTransform(scene.root.viewBox, parsed.scene.root.viewBox);
      const group = {
        ...createElementNode('g', { id: name, ...(fit ? { transform: fit } : {}) }),
        children: parsed.scene.root.children
      };
      const next = addNode(scene, null, scene.root.children.length, group);
      commit(next);
      setSelectedId(group.id);
      showNotice(getSvgUploadedNotice(name));
    } catch {
      showNotice(getSvgUploadFailedNotice());
    }
  }

  const [vbX, vbY, vbW, vbH] = scene.root.viewBox;
  const canvasNormalized =
    vbX === 0 &&
    vbY === 0 &&
    vbW === vbH &&
    vbW > 0 &&
    scene.root.width === undefined &&
    scene.root.height === undefined;

  const layers = listLayers(scene, selectedId);
  const selectedLabel = selectedNode
    ? (layers.find((layer) => layer.id === selectedId)?.label ?? selectedNode.tag)
    : undefined;
  const exportFileCount = planExport(exportSel, scene).length;

  return (
    <EditorShell onToggleTheme={toggleTheme} theme={theme}>
      <div className="mx-auto grid min-h-0 w-[min(100%,1180px)] grid-cols-[minmax(0,1fr)_minmax(340px,420px)] items-stretch gap-5 max-[760px]:grid-cols-[1fr]">
        <div className="grid min-h-0 min-w-0 content-start justify-items-center gap-[10px] [--stage-w:min(100%,calc(100vh_-_196px))] max-[760px]:contents">
          <div className="grid w-[var(--stage-w)] grid-cols-[minmax(0,1fr)_auto] items-center gap-[10px] max-[760px]:order-1 max-[760px]:grid-cols-[1fr] max-[760px]:justify-items-stretch max-[760px]:gap-1">
            <PreviewModeToggle mode={mode} onChange={changeMode} />
            <div
              className="grid justify-items-end gap-1 max-[760px]:justify-items-start"
              aria-label="History controls"
            >
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="grid h-[30px] w-[30px] cursor-pointer place-items-center rounded-lg border border-border bg-secondary text-muted-foreground outline-none transition-colors enabled:hover:border-border-strong enabled:hover:text-foreground focus-visible:[outline:2px_solid_var(--ring)] focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-[0.42] [&_svg]:h-[15px] [&_svg]:w-[15px] [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round] [&_svg]:[stroke-width:2]"
                  aria-label="Undo last change with Ctrl or Command Z"
                  title="Undo (Ctrl/Cmd Z)"
                  onClick={undo}
                  disabled={!canUndo}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 14 4 9l5-5" />
                    <path d="M4 9h11a5 5 0 0 1 0 10h-3" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="grid h-[30px] w-[30px] cursor-pointer place-items-center rounded-lg border border-border bg-secondary text-muted-foreground outline-none transition-colors enabled:hover:border-border-strong enabled:hover:text-foreground focus-visible:[outline:2px_solid_var(--ring)] focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-[0.42] [&_svg]:h-[15px] [&_svg]:w-[15px] [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round] [&_svg]:[stroke-width:2]"
                  aria-label="Redo last change with Ctrl or Command Y"
                  title="Redo (Ctrl/Cmd Y)"
                  onClick={redo}
                  disabled={!canRedo}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="m15 14 5-5-5-5" />
                    <path d="M20 9H9a5 5 0 0 0 0 10h3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          {mode === 'preview' ? (
            <CanvasPreview
              canvasRef={canvasRef}
              background={getBackgroundColor(scene)}
              showSafeGuide={showSafeGuide && exportInset === 0}
              selectionBox={selectionBox}
            />
          ) : mode === 'code' ? (
            <CodeView
              value={codeDraft}
              diagnostics={codeDiagnostics}
              onChange={setCodeDraft}
              onPrettify={prettifyCode}
              onOptimize={(removeHidden) => void optimizeCode(removeHidden)}
              optimizing={optimizing}
              theme={theme}
            />
          ) : (
            <ComponentView
              code={componentSource}
              label={mode === 'native' ? 'React Native component' : 'React component'}
              onCopy={copyComponent}
              theme={theme}
            />
          )}
          <ExportTab
            selection={exportSel}
            pngSizeChoices={exportPngSizeChoices}
            fileCount={exportFileCount}
            exportInset={exportInset}
            maxInset={maxExportInsetPct}
            exporting={exporting}
            onChange={setExportSel}
            onExportInsetChange={changeExportInset}
            onDownload={() => void runExport()}
          />
        </div>
        <TabDock
          documentControls={
            <DocumentControls
              backgroundColor={getBackgroundColor(scene)}
              showSafeGuide={showSafeGuide}
              onChangeBackground={changeBackground}
              onToggleSafeGuide={setShowSafeGuide}
              projectName={projectName}
              onRenameProject={renameProject}
              onDownloadProject={downloadProject}
              onFitCanvas={fitCanvas}
              canvasNormalized={canvasNormalized}
              openControl={
                <ProjectMenu
                  projects={projects}
                  currentId={currentProjectId}
                  estimate={storageEstimate}
                  onBeforeOpen={refreshProjects}
                  onOpen={openProject}
                  onNew={newProject}
                  onDuplicate={duplicateProjectById}
                  onDelete={requestDeleteProject}
                  onImport={importProjectFromFile}
                />
              }
            />
          }
          adjustControls={
            <AdjustTab
              node={selectedNode}
              stylingMayOverride={layers.find((layer) => layer.selected)?.hasCss ?? false}
              center={selectedCenter}
              onSetCenter={setCenter}
              rotation={selectedRotation}
              onSetRotation={setRotation}
              onUpdateField={updateField}
              onUpdateText={updateText}
              onCenter={centerSelected}
              onSetAdaptiveRole={setSelectedAdaptiveRole}
              fontInput={fontInput}
              fontStatus={fontStatus}
              onChangeFontInput={setFontInput}
              onLoadFont={() => void loadFont()}
              onUploadFont={(file) => void uploadFont(file)}
              fontFamilies={fontFamilies}
              selectedFontFamily={selectedFontFamily}
              onSelectFont={(family) => void selectFont(family)}
              onConvertToShapes={convertToShapes}
              shadow={shadow}
              onSetShadow={setShadow}
            />
          }
          layers={layers}
          onAddNode={addShape}
          onDeleteLayer={deleteLayerById}
          onDuplicateLayer={duplicate}
          onMoveLayer={reorder}
          onSelectLayer={setSelectedId}
          onToggleLayerVisible={toggleVisible}
          onUploadSvg={(event) => void uploadSvg(event)}
          selectedLabel={selectedLabel}
        />
      </div>
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this project?"
        body={
          <>
            Deleting <b>{pendingDelete?.name}</b> removes it from this browser. This can&rsquo;t be
            undone.
          </>
        }
        confirmLabel="Delete project"
        danger
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDeleteProject}
      />
    </EditorShell>
  );
}

const sizeFieldNames = new Set(['scale', 'width', 'height', 'rx', 'ry', 'r', 'font-size']);

interface LayerMeasurement {
  readonly bbox: LayerBox;
  readonly center: { readonly x: number; readonly y: number };
}

function measureLayer(scene: SvgScene, id: string): LayerMeasurement | null {
  if (typeof document === 'undefined') return null;
  const holder = document.createElement('div');
  holder.style.cssText =
    'position:absolute;left:-99999px;top:0;width:1024px;height:1024px;opacity:0;pointer-events:none';
  holder.innerHTML = renderToMarkup(scene);
  document.body.appendChild(holder);
  try {
    const element = holder.querySelector<SVGGraphicsElement>(`[data-fid="${id}"]`);
    if (!element || typeof element.getBBox !== 'function') return null;
    const box = element.getBBox();
    const bbox = { x: box.x, y: box.y, width: box.width, height: box.height };
    return { bbox, center: renderedCenter(element, bbox) ?? fallbackCenter(scene, id, bbox) };
  } catch {
    return null;
  } finally {
    holder.remove();
  }
}

function renderedCenter(
  element: SVGGraphicsElement,
  bbox: LayerBox
): { x: number; y: number } | null {
  const elementCtm = element.getScreenCTM?.();
  const svgCtm = element.ownerSVGElement?.getScreenCTM?.();
  if (!elementCtm || !svgCtm) return null;
  return centerInUserSpace(svgCtm, elementCtm, bbox);
}

function fallbackCenter(scene: SvgScene, id: string, bbox: LayerBox): { x: number; y: number } {
  const node = getSelectedNode(scene, id);
  return node
    ? layerCenter(node, bbox)
    : { x: bbox.x + bbox.width / 2, y: bbox.y + bbox.height / 2 };
}
