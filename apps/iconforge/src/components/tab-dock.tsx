import { useRef, type ChangeEvent, type MouseEvent, type ReactNode } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@toolbox/ui';
import { addablePrimitives } from '../node-primitives';
import type { SceneLayer, SceneNodeKind } from '../scene-editor';

export function TabDock({
  adjustControls,
  documentControls,
  layers,
  onAddNode,
  onDeleteLayer,
  onDuplicateLayer,
  onMoveLayer,
  onSelectLayer,
  onToggleLayerVisible,
  onUploadSvg,
  selectedLabel
}: {
  readonly adjustControls: ReactNode;
  readonly documentControls: ReactNode;
  readonly layers: readonly SceneLayer[];
  readonly onAddNode: (kind: SceneNodeKind) => void;
  readonly onDeleteLayer: (layerId: string) => void;
  readonly onDuplicateLayer: (layerId: string) => void;
  readonly onMoveLayer: (layerId: string, direction: -1 | 1) => void;
  readonly onSelectLayer: (layerId: string) => void;
  readonly onToggleLayerVisible: (layer: SceneLayer) => void;
  readonly onUploadSvg: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly selectedLabel?: string | undefined;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="if-dock" aria-label="Editor controls">
      <section className="if-card" aria-label="Document">
        <div className="if-card-head">
          <span className="if-seclabel">Document</span>
          <span className="if-pill if-pill-muted">
            <span className="if-pill-dot" style={{ background: 'var(--if-gold)' }} aria-hidden="true" />
            Local · Autosaved
          </span>
        </div>
        {documentControls}
      </section>

      <section className="if-card" aria-label="Layers">
        <div className="if-card-head">
          <span className="if-seclabel">Layers</span>
          <div className="if-add-menu">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="if-create-toggle" type="button">
                  Add layer
                  <span className="if-add-caret" aria-hidden="true">▾</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="if-add-menu-list" aria-label="Add a layer">
                {addablePrimitives.map((primitive) => (
                  <DropdownMenuItem
                    key={primitive.kind}
                    className="if-add-menu-action"
                    onSelect={() => onAddNode(primitive.kind as SceneNodeKind)}
                  >
                    {primitive.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem
                  className="if-add-menu-action"
                  onSelect={() => fileInputRef.current?.click()}
                >
                  Upload SVG
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <input
              ref={fileInputRef}
              className="if-file-input"
              accept=".svg,image/svg+xml"
              type="file"
              tabIndex={-1}
              aria-hidden="true"
              onChange={onUploadSvg}
            />
          </div>
        </div>

        {layers.length === 0 ? (
          <div className="if-layers-empty">
            <span className="if-layers-empty-title">No layers yet</span>
            <p className="if-note">Start from Add layer: rectangle, circle, text, or an uploaded SVG.</p>
          </div>
        ) : (
          <div className="if-layer-list" role="listbox" aria-label="Layers">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className="if-layer-row"
                data-active={layer.selected || undefined}
                data-hidden={layer.hidden || undefined}
              >
                <button
                  type="button"
                  className="if-layer-row-select"
                  onClick={() => onSelectLayer(layer.id)}
                  role="option"
                  aria-selected={layer.selected}
                >
                  <span className="if-layer-row-name">{layer.label}</span>
                  {layer.hasCss ? (
                    <span
                      className="if-pill if-pill-ember if-pill-tiny"
                      title="Colors come from embedded CSS — edit them in the Code tab"
                    >
                      CSS
                    </span>
                  ) : null}
                  {layer.adaptiveRole === 'background' ? (
                    <span className="if-pill if-pill-muted if-pill-tiny">BG</span>
                  ) : null}
                </button>
                <div className="if-layer-row-actions" aria-label={`${layer.label} layer actions`}>
                  <LayerAction
                    label={layer.hidden ? 'Show layer' : 'Hide layer'}
                    onClick={() => onToggleLayerVisible(layer)}
                  >
                    <LayerIcon name={layer.hidden ? 'eyeOff' : 'eye'} />
                  </LayerAction>
                  <LayerAction label="Move layer up" onClick={() => onMoveLayer(layer.id, 1)}>
                    <LayerIcon name="arrowUp" />
                  </LayerAction>
                  <LayerAction label="Move layer down" onClick={() => onMoveLayer(layer.id, -1)}>
                    <LayerIcon name="arrowDown" />
                  </LayerAction>
                  <LayerAction label="Duplicate layer" onClick={() => onDuplicateLayer(layer.id)}>
                    <LayerIcon name="copy" />
                  </LayerAction>
                  <LayerAction label="Delete layer" danger onClick={() => onDeleteLayer(layer.id)}>
                    <LayerIcon name="trash" />
                  </LayerAction>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="if-card" aria-label="Adjust selected layer">
        <div className="if-card-head">
          <span className="if-seclabel">Adjust</span>
          {selectedLabel ? (
            <span className="if-pill if-pill-ember">
              <span className="if-pill-dot" aria-hidden="true" />
              {selectedLabel}
            </span>
          ) : (
            <span className="if-pill if-pill-muted">No layer</span>
          )}
        </div>
        {adjustControls}
      </section>
    </section>
  );
}

type LayerIconName = 'eye' | 'eyeOff' | 'arrowUp' | 'arrowDown' | 'copy' | 'trash';

function LayerIcon({ name }: { readonly name: LayerIconName }) {
  const paths: Record<LayerIconName, ReactNode> = {
    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    eyeOff: (
      <>
        <path d="m2 2 20 20" />
        <path d="M6.7 6.7C3.7 8.6 2 12 2 12s3.5 6 10 6c1.7 0 3.2-.4 4.5-1" />
        <path d="M10.6 5.1c.5-.1.9-.1 1.4-.1 6.5 0 10 6 10 6s-.9 1.5-2.5 3.1" />
        <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      </>
    ),
    arrowUp: (
      <>
        <path d="M12 19V5" />
        <path d="m6 11 6-6 6 6" />
      </>
    ),
    arrowDown: (
      <>
        <path d="M12 5v14" />
        <path d="m18 13-6 6-6-6" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="11" height="11" rx="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <path d="M10 11v6" />
        <path d="M14 11v6" />
      </>
    )
  };

  return (
    <svg className="if-layer-action-icon" viewBox="0 0 24 24" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function LayerAction({
  children,
  danger = false,
  label,
  onClick
}: {
  readonly children: ReactNode;
  readonly danger?: boolean;
  readonly label: string;
  readonly onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      className="if-layer-action"
      data-danger={danger || undefined}
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
