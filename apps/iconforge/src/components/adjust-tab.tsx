import type { ReactNode } from 'react';
import { HexColorInput, HexColorPicker } from 'react-colorful';
import type { SvgNode } from '@toolbox/svg-core';
import type { FontAxis } from '@toolbox/svg-ops';
import { Alert, Button, cn, Popover, PopoverContent, PopoverTrigger } from '@toolbox/ui';
import { getAdaptiveRole, getNodeFields, type AdaptiveRole } from '../scene-editor';
import type { TextShadow } from '../text-effects';
import {
  Field,
  FieldInput,
  FieldSelect,
  InfoDot,
  inputClass,
  NumberField,
  SegmentedControl,
  Toggle
} from './fields';
import { TextTypeControls } from './text-type-controls';

export function DocumentControls({
  backgroundColor,
  showSafeGuide,
  onChangeBackground,
  onToggleSafeGuide,
  projectName,
  onRenameProject,
  onDownloadProject,
  onFitCanvas,
  canvasNormalized = false,
  openControl
}: {
  readonly backgroundColor: string;
  readonly showSafeGuide: boolean;
  readonly onChangeBackground: (color: string) => void;
  readonly onToggleSafeGuide: (show: boolean) => void;
  readonly projectName: string;
  readonly onRenameProject: (name: string) => void;
  readonly onDownloadProject: () => void;
  readonly onFitCanvas?: () => void;
  readonly canvasNormalized?: boolean;
  readonly openControl: ReactNode;
}) {
  const backgroundMode = backgroundColor === 'transparent' ? 'transparent' : 'color';
  const currentColor = backgroundColor === 'transparent' ? '#ffffff' : backgroundColor;

  return (
    <div className="grid gap-[10px]">
      <Field label="Project name">
        <FieldInput
          value={projectName}
          placeholder="Untitled icon"
          onChange={(event) => onRenameProject(event.target.value)}
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        {openControl}
        <Button variant="secondary" type="button" className="w-full" onClick={onDownloadProject}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M4 21h16" />
          </svg>
          Download
        </Button>
      </div>
      <p className="m-0 text-[11px] leading-[1.45] text-muted-foreground [&_b]:font-semibold [&_b]:text-foreground">
        Projects are kept in this browser. <b>Download</b> saves a copy as a <b>.json</b> file.
      </p>
      {onFitCanvas ? (
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            type="button"
            className="flex-1"
            onClick={onFitCanvas}
            disabled={canvasNormalized}
            title="Resize the canvas to a clean 1024×1024 square and fit the artwork into it, centered."
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 9V4h5" />
              <path d="M20 9V4h-5" />
              <path d="M4 15v5h5" />
              <path d="M20 15v5h-5" />
            </svg>
            Fit to canvas
          </Button>
          <InfoDot label="Normalizes an unusual or non-square canvas (for example a pasted logo) to a centered 1024×1024 square. Undoable." />
        </div>
      ) : null}
      <div className="relative grid min-w-0 gap-[5px] text-[12px] text-muted-foreground">
        <span className="text-[9.5px] font-medium uppercase leading-none tracking-[0.12em] text-muted-foreground">
          Background
        </span>
        <SegmentedControl
          value={backgroundMode}
          options={[
            { value: 'transparent', label: 'Transparent' },
            { value: 'color', label: 'Color' }
          ]}
          onChange={(next) =>
            onChangeBackground(next === 'transparent' ? 'transparent' : currentColor)
          }
          ariaLabel="Background"
        />
      </div>
      {backgroundMode === 'color' ? (
        <ColorField label="Background color" value={currentColor} onChange={onChangeBackground} />
      ) : null}
      <div className="flex items-center justify-between gap-2">
        <Toggle checked={showSafeGuide} onChange={onToggleSafeGuide} label="Safe-area guide" />
        <InfoDot label="Keep key content inside the circle; it stays visible under every Android adaptive mask." />
      </div>
    </div>
  );
}

export type FontStatus =
  | { readonly state: 'idle' }
  | { readonly state: 'loading' }
  | { readonly state: 'loaded'; readonly message: string }
  | { readonly state: 'error'; readonly message: string };

export function AdjustTab({
  node,
  stylingMayOverride,
  center,
  onSetCenter,
  rotation,
  onSetRotation,
  onUpdateField,
  onUpdateText,
  onCenter,
  onSetAdaptiveRole,
  fontInput,
  fontStatus,
  onChangeFontInput,
  onLoadFont,
  onUploadFont,
  fontFamilies,
  selectedFontFamily,
  onSelectFont,
  onConvertToShapes,
  shadow,
  onSetShadow,
  fontAxes,
  onSetTextTransform
}: {
  readonly node: SvgNode | null;
  readonly stylingMayOverride?: boolean;
  readonly center?: { readonly x: number; readonly y: number } | null;
  readonly onSetCenter?: (axis: 'x' | 'y', value: number) => void;
  readonly rotation?: number;
  readonly onSetRotation?: (degrees: number) => void;
  readonly onUpdateField: (name: string, value: string) => void;
  readonly onUpdateText: (text: string) => void;
  readonly onCenter: () => void;
  readonly onSetAdaptiveRole: (role: AdaptiveRole) => void;
  readonly fontInput?: string;
  readonly fontStatus?: FontStatus;
  readonly onChangeFontInput?: (value: string) => void;
  readonly onLoadFont?: () => void;
  readonly onUploadFont?: (file: File) => void;
  readonly fontFamilies?: readonly string[];
  readonly selectedFontFamily?: string;
  readonly onSelectFont?: (family: string) => void;
  readonly onConvertToShapes?: () => void;
  readonly shadow?: TextShadow | null;
  readonly onSetShadow?: (shadow: TextShadow | null) => void;
  readonly fontAxes?: readonly FontAxis[];
  readonly onSetTextTransform?: (value: string) => void;
}) {
  if (!node) {
    return (
      <p className="m-0 text-[13px] leading-[1.45] text-muted-foreground">
        Add or select a layer to adjust it.
      </p>
    );
  }

  const isTextNode = node.tag.toLowerCase() === 'text';
  const showFontControls = isTextNode && onLoadFont !== undefined && fontStatus !== undefined;
  const showShadow = isTextNode && onSetShadow !== undefined;

  const fields = getNodeFields(node);
  const appearanceNames = new Set([
    'fill',
    'opacity',
    'fill-opacity',
    'stroke',
    'stroke-width',
    'stroke-opacity',
    'text-anchor',
    'color'
  ]);
  const nameField = fields.find((field) => field.name === 'id');
  const contentField = fields.find((field) => field.kind === 'content');
  const appearanceFields = fields.filter((field) => appearanceNames.has(field.name));
  const positionNames = new Set(['x', 'y', 'cx', 'cy', 'translateX', 'translateY']);
  const sizeOrder = ['r', 'rx', 'ry', 'width', 'height', 'font-size', 'scale'];
  const rank = (name: string) => {
    const index = sizeOrder.indexOf(name);
    return index === -1 ? sizeOrder.length : index;
  };
  const sizeFields = fields
    .filter(
      (field) =>
        field !== nameField &&
        field !== contentField &&
        !appearanceNames.has(field.name) &&
        !positionNames.has(field.name)
    )
    .sort((a, b) => rank(a.name) - rank(b.name));

  const emitCenter = (axis: 'x' | 'y', raw: string) => {
    const value = Number(raw);
    if (Number.isFinite(value)) onSetCenter?.(axis, value);
  };

  const emitRotation = (raw: string) => {
    const value = Number(raw);
    if (Number.isFinite(value)) onSetRotation?.(value);
  };

  const showTransform = center != null && onSetCenter != null;

  const renderField = (field: (typeof fields)[number]) => {
    if (field.kind === 'number') {
      const isOpacity = /opacity$/.test(field.name);
      const step = isOpacity ? 0.05 : field.name === 'scale' ? 0.1 : 1;
      return (
        <NumberField
          key={field.name}
          label={field.label}
          value={field.value}
          step={step}
          {...(isOpacity ? { min: 0, max: 1 } : {})}
          onChange={(event) => onUpdateField(field.name, event.target.value)}
        />
      );
    }
    if (field.kind === 'color') {
      return (
        <ColorField
          key={field.name}
          label={field.label}
          value={field.value || '#000000'}
          onChange={(hex) => onUpdateField(field.name, hex)}
        />
      );
    }
    if (field.kind === 'select') {
      return (
        <Field key={field.name} label={field.label}>
          <FieldSelect
            value={field.value}
            onChange={(event) => onUpdateField(field.name, event.target.value)}
          >
            {(field.options ?? []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FieldSelect>
        </Field>
      );
    }
    if (field.kind === 'text') {
      return (
        <Field key={field.name} label={field.label} wide>
          <FieldInput
            value={field.value}
            onChange={(event) => onUpdateField(field.name, event.target.value)}
          />
        </Field>
      );
    }
    return (
      <Field key={field.name} label={field.label} wide>
        <FieldInput value={field.value} onChange={(event) => onUpdateText(event.target.value)} />
      </Field>
    );
  };

  return (
    <div className="grid gap-3">
      {nameField ? renderField(nameField) : null}
      {contentField ? renderField(contentField) : null}

      {stylingMayOverride ? (
        <Alert variant="warning" title="Styled by embedded CSS">
          This layer is colored by a <code>{'<style>'}</code> block, so the Fill control below has
          no visible effect. Edit the CSS in the <strong>Code</strong> tab.
        </Alert>
      ) : null}

      {showFontControls ? (
        <div className="grid gap-2">
          <div className="text-[9.5px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Typeface</div>
          <Field label="Font" wide>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2">
              <FieldInput
                value={fontInput ?? ''}
                placeholder="Google font name or URL"
                onChange={(event) => onChangeFontInput?.(event.target.value)}
              />
              <Button
                variant="secondary"
                type="button"
                onClick={onLoadFont}
                disabled={fontStatus.state === 'loading' || (fontInput ?? '').trim().length === 0}
              >
                {fontStatus.state === 'loading' ? 'Loading…' : 'Load'}
              </Button>
            </div>
          </Field>
          {onSelectFont ? (
            <Field label="Or pick" wide>
              <FieldSelect
                value={
                  selectedFontFamily && (fontFamilies ?? []).includes(selectedFontFamily)
                    ? selectedFontFamily
                    : ''
                }
                onChange={(event) => {
                  if (event.target.value) onSelectFont(event.target.value);
                }}
              >
                <option value="">Choose a font…</option>
                {(fontFamilies ?? []).map((family) => (
                  <option key={family} value={family}>
                    {family}
                  </option>
                ))}
              </FieldSelect>
            </Field>
          ) : null}
          {onUploadFont ? (
            <label className="grid gap-1 text-[11px] text-muted-foreground">
              <span>or upload a font file</span>
              <input
                type="file"
                accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (file) onUploadFont(file);
                }}
              />
            </label>
          ) : null}
          {fontStatus.state === 'error' ? (
            <p className="m-0 text-[11px] leading-[1.45] text-muted-foreground [&_b]:font-semibold [&_b]:text-foreground" role="alert">
              {fontStatus.message}
            </p>
          ) : fontStatus.state === 'loaded' ? (
            <p className="m-0 text-[11px] leading-[1.45] text-muted-foreground [&_b]:font-semibold [&_b]:text-foreground">Loaded {fontStatus.message}.</p>
          ) : null}
        </div>
      ) : null}

      {showTransform || sizeFields.length > 0 ? (
        <div className="grid gap-2">
          <div className="text-[9.5px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Position &amp; size</div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(92px,1fr))] gap-[9px] [&>[data-wide]]:col-span-2">
            {center && onSetCenter ? (
              <>
                <NumberField
                  label="X"
                  value={roundCoord(center.x)}
                  step={1}
                  onChange={(event) => emitCenter('x', event.target.value)}
                />
                <NumberField
                  label="Y"
                  value={roundCoord(center.y)}
                  step={1}
                  onChange={(event) => emitCenter('y', event.target.value)}
                />
                {onSetRotation ? (
                  <NumberField
                    label="Angle"
                    value={roundCoord(rotation ?? 0)}
                    step={1}
                    onChange={(event) => emitRotation(event.target.value)}
                  />
                ) : null}
              </>
            ) : null}
            {sizeFields.map(renderField)}
            <Button
              variant="secondary"
              type="button"
              className="w-full self-end"
              onClick={onCenter}
              title="Center the layer on the canvas"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 3v18M3 12h18" />
              </svg>
              Center
            </Button>
          </div>
        </div>
      ) : null}

      {appearanceFields.length > 0 ? (
        <div className="grid gap-2">
          <div className="text-[9.5px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Appearance</div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(92px,1fr))] gap-[9px] [&>[data-wide]]:col-span-2">{appearanceFields.map(renderField)}</div>
        </div>
      ) : null}

      {isTextNode && onSetTextTransform ? (
        <TextTypeControls
          node={node}
          axes={fontAxes ?? []}
          onUpdateField={onUpdateField}
          onSetTextTransform={onSetTextTransform}
        />
      ) : null}

      <div className="grid gap-2">
        <div className="flex items-center gap-1.5 text-[9.5px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Adaptive role
          <InfoDot label="Tags the Android adaptive icon split: which layers are background vs foreground. Untagged layers are auto-detected." />
        </div>
        <SegmentedControl
          value={getAdaptiveRole(node)}
          options={[
            { value: 'foreground', label: 'Foreground' },
            { value: 'background', label: 'Background' }
          ]}
          onChange={(next) => onSetAdaptiveRole(next as AdaptiveRole)}
          ariaLabel="Adaptive role"
        />
      </div>

      {showShadow ? (
        <div className="grid gap-2">
          <div className="text-[9.5px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Shadow</div>
          <Toggle
            checked={shadow != null}
            onChange={(on) =>
              onSetShadow?.(on ? { dx: 1, dy: 1, blur: 1, color: '#000000' } : null)
            }
            label="Drop shadow"
          />
          {shadow != null ? (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(92px,1fr))] gap-[9px] [&>[data-wide]]:col-span-2">
              <NumberField
                label="Shadow X"
                value={shadow.dx}
                onChange={(event) => onSetShadow?.({ ...shadow, dx: Number(event.target.value) })}
              />
              <NumberField
                label="Shadow Y"
                value={shadow.dy}
                onChange={(event) => onSetShadow?.({ ...shadow, dy: Number(event.target.value) })}
              />
              <NumberField
                label="Blur"
                value={shadow.blur}
                onChange={(event) => onSetShadow?.({ ...shadow, blur: Number(event.target.value) })}
              />
              <ColorField
                label="Shadow color"
                value={shadow.color}
                onChange={(color) => onSetShadow?.({ ...shadow, color })}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {showFontControls ? (
        <div className="mb-2 flex justify-end">
          <Button
            variant="secondary"
            type="button"
            onClick={onConvertToShapes}
            disabled={fontStatus?.state !== 'loaded'}
            title="Bake the glyphs into editable vector paths, keeping fill, outline, and shadow"
          >
            Convert to shapes
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function roundCoord(value: number): number {
  return Math.round(value * 100) / 100;
}

const hexColorPattern = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

function toHexColor(value: string): string {
  const trimmed = value.trim();
  return hexColorPattern.test(trimmed) ? trimmed : '#000000';
}

function ColorField({
  label,
  onChange,
  value
}: {
  readonly label: string;
  readonly onChange: (value: string) => void;
  readonly value: string;
}) {
  const hex = toHexColor(value);
  return (
    <div
      className="grid min-w-0 gap-[5px] data-[disabled]:pointer-events-none data-[disabled]:opacity-[0.52]"
      data-wide
    >
      <span className="text-[9.5px] font-medium uppercase leading-none tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      <div className="grid min-w-0 grid-cols-[42px_minmax(0,1fr)] items-center gap-2">
        <div className="relative min-w-0">
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="grid h-[34px] w-full cursor-pointer place-items-stretch overflow-hidden rounded-lg border border-border bg-secondary p-0 outline-none transition-[border-color,background-color] hover:border-border-strong hover:bg-accent focus-visible:border-primary focus-visible:shadow-[0_0_0_2px_color-mix(in_srgb,var(--primary)_28%,transparent)]"
                aria-label={`Open ${label} picker`}
              >
                <span
                  className="h-full w-full shadow-[inset_0_0_0_1px_color-mix(in_srgb,#000_30%,transparent)]"
                  style={{ background: hex }}
                  aria-hidden="true"
                />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="if-color-popover w-[min(252px,calc(100vw_-_36px))] rounded-[10px] border-border-strong shadow-[0_8px_18px_rgb(0_0_0_/_28%)]"
              align="start"
              role="dialog"
              aria-label={`${label} picker`}
            >
              <HexColorPicker color={hex} onChange={onChange} />
            </PopoverContent>
          </Popover>
        </div>
        <HexColorInput
          color={hex}
          onChange={onChange}
          prefixed
          className={cn(inputClass, 'uppercase')}
          aria-label={`${label} hex value`}
        />
      </div>
    </div>
  );
}
