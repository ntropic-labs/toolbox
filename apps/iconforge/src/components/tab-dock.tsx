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
  onToggleExpand,
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
  readonly onToggleExpand: (layerId: string) => void;
  readonly onToggleLayerVisible: (layer: SceneLayer) => void;
  readonly onUploadSvg: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly selectedLabel?: string | undefined;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <section
      className="grid max-h-[calc(100vh_-_92px)] min-h-0 min-w-0 content-start gap-3 overflow-auto max-[760px]:order-3 max-[760px]:max-h-none"
      aria-label="Editor controls"
    >
      <section
        className="grid gap-3 rounded-[10px] border border-border bg-card px-[14px] py-[13px]"
        aria-label="Document"
      >
        <div className="flex items-center justify-between gap-[10px]">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Document
          </span>
          <span className="inline-flex items-center gap-[5px] whitespace-nowrap rounded-full border border-border bg-secondary px-2 py-[3px] text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            <span
              className="h-[5px] w-[5px] rounded-full bg-current"
              style={{ background: 'var(--gold)' }}
              aria-hidden="true"
            />
            Local · Autosaved
          </span>
        </div>
        {documentControls}
      </section>

      <section
        className="grid gap-3 rounded-[10px] border border-border bg-card px-[14px] py-[13px]"
        aria-label="Layers"
      >
        <div className="flex items-center justify-between gap-[10px]">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Layers
          </span>
          <div className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="inline-flex min-h-[30px] cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-secondary px-2 py-[5px] text-[13px] text-foreground outline-none hover:border-border-strong focus-visible:outline-offset-2 focus-visible:[outline:2px_solid_var(--ring)] aria-expanded:border-border-strong max-[760px]:min-h-[44px]"
                  type="button"
                >
                  Add layer
                  <span className="text-[11px] leading-none text-muted-foreground" aria-hidden="true">
                    ▾
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="grid min-w-[168px] gap-0.5 rounded-[10px] border-border-strong p-[5px] shadow-[0_8px_18px_rgb(0_0_0_/_28%)]"
                aria-label="Add a layer"
              >
                {addablePrimitives.map((primitive) => (
                  <DropdownMenuItem
                    key={primitive.kind}
                    className="block w-full rounded-md px-[9px] py-[7px] text-left text-[13px] text-foreground"
                    onSelect={() => onAddNode(primitive.kind as SceneNodeKind)}
                  >
                    {primitive.label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem
                  className="block w-full rounded-md px-[9px] py-[7px] text-left text-[13px] text-foreground"
                  onSelect={() => fileInputRef.current?.click()}
                >
                  Upload SVG
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <input
              ref={fileInputRef}
              className="pointer-events-none absolute h-px w-px opacity-0"
              accept=".svg,image/svg+xml"
              type="file"
              tabIndex={-1}
              aria-hidden="true"
              onChange={onUploadSvg}
            />
          </div>
        </div>

        {layers.length === 0 ? (
          <div className="grid justify-items-start gap-1 rounded-lg border border-dashed border-border px-[10px] py-3">
            <span className="text-[12.5px] text-muted-foreground">No layers yet</span>
            <p className="m-0 text-[11px] leading-[1.45] text-muted-foreground [&_b]:font-semibold [&_b]:text-foreground">
              Start from Add layer: rectangle, circle, text, or an uploaded SVG.
            </p>
          </div>
        ) : (
          <div
            className="grid max-h-[220px] gap-[3px] overflow-auto"
            role="listbox"
            aria-label="Layers"
          >
            {layers.map((layer) => (
              <div
                key={layer.id}
                className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 rounded-[7px] border border-transparent bg-transparent py-1 pl-1.5 pr-1 hover:border-border hover:bg-secondary data-[active]:border-primary data-[active]:bg-[color-mix(in_srgb,var(--primary)_13%,transparent)] max-[760px]:grid-cols-[auto_1fr]"
                data-active={layer.selected || undefined}
                data-hidden={layer.hidden || undefined}
                data-depth={layer.depth}
                style={
                  layer.depth > 0
                    ? { paddingLeft: `calc(0.375rem + ${layer.depth * 14}px)` }
                    : undefined
                }
              >
                <LayerDisclosure
                  expandable={layer.expandable}
                  expanded={layer.expanded}
                  onToggle={() => onToggleExpand(layer.id)}
                />
                <button
                  type="button"
                  className="flex min-w-0 cursor-pointer items-center gap-2 border-0 bg-transparent px-0.5 py-[5px] text-left text-foreground outline-none focus-visible:outline-offset-2 focus-visible:[outline:2px_solid_var(--ring)] max-[760px]:min-h-[44px]"
                  onClick={() => onSelectLayer(layer.id)}
                  role="option"
                  aria-selected={layer.selected}
                >
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px] font-semibold [[data-hidden]_&]:text-subtle [[data-hidden]_&]:line-through">
                    {layer.label}
                  </span>
                  {layer.hasCss ? (
                    <span
                      className="inline-flex items-center gap-[5px] whitespace-nowrap rounded-full bg-[color-mix(in_srgb,var(--primary)_15%,transparent)] px-[6px] py-[2px] text-[8.5px] font-semibold uppercase tracking-[0.1em] text-primary"
                      title="Colors come from embedded CSS — edit them in the Code tab"
                    >
                      CSS
                    </span>
                  ) : null}
                  {layer.adaptiveRole === 'background' ? (
                    <span className="inline-flex items-center gap-[5px] whitespace-nowrap rounded-full border border-border bg-secondary px-[6px] py-[2px] text-[8.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      BG
                    </span>
                  ) : null}
                </button>
                <div
                  className="flex flex-wrap justify-end gap-1 max-[760px]:col-span-2 max-[760px]:justify-start max-[760px]:gap-1.5"
                  aria-label={`${layer.label} layer actions`}
                >
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

      <section
        className="grid gap-3 rounded-[10px] border border-border bg-card px-[14px] py-[13px]"
        aria-label="Adjust selected layer"
      >
        <div className="flex items-center justify-between gap-[10px]">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Adjust
          </span>
          {selectedLabel ? (
            <span className="inline-flex items-center gap-[5px] whitespace-nowrap rounded-full bg-[color-mix(in_srgb,var(--primary)_15%,transparent)] px-2 py-[3px] text-[9.5px] font-semibold uppercase tracking-[0.12em] text-primary">
              <span className="h-[5px] w-[5px] rounded-full bg-current" aria-hidden="true" />
              {selectedLabel}
            </span>
          ) : (
            <span className="inline-flex items-center gap-[5px] whitespace-nowrap rounded-full border border-border bg-secondary px-2 py-[3px] text-[9.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              No layer
            </span>
          )}
        </div>
        {adjustControls}
      </section>
    </section>
  );
}

function LayerDisclosure({
  expandable,
  expanded,
  onToggle
}: {
  readonly expandable: boolean;
  readonly expanded: boolean;
  readonly onToggle: () => void;
}) {
  if (!expandable) {
    return <span className="h-[26px] w-[18px] shrink-0" aria-hidden="true" />;
  }
  const label = expanded ? 'Collapse group' : 'Expand group';
  return (
    <button
      type="button"
      className="grid h-[26px] w-[18px] shrink-0 place-items-center rounded-md border border-transparent bg-transparent p-0 text-muted-foreground outline-none hover:text-foreground focus-visible:outline-offset-2 focus-visible:[outline:2px_solid_var(--ring)]"
      aria-label={label}
      aria-expanded={expanded}
      title={label}
      onClick={onToggle}
    >
      <svg
        className="h-[11px] w-[11px] fill-none stroke-current transition-transform [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:2.4] data-[expanded]:rotate-90"
        viewBox="0 0 24 24"
        data-expanded={expanded || undefined}
        aria-hidden="true"
      >
        <path d="m9 6 6 6-6 6" />
      </svg>
    </button>
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
    <svg
      className="h-[15px] w-[15px] fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.9]"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
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
      className="grid h-[26px] w-[26px] place-items-center rounded-md border border-transparent bg-transparent p-0 text-[13px] leading-none text-muted-foreground outline-none hover:border-border hover:bg-card hover:text-foreground focus-visible:outline-offset-2 focus-visible:[outline:2px_solid_var(--ring)] disabled:cursor-not-allowed disabled:opacity-[0.42] data-[danger]:hover:border-[color-mix(in_srgb,var(--destructive)_50%,var(--border))] data-[danger]:hover:text-destructive max-[760px]:h-[44px] max-[760px]:w-[44px]"
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
