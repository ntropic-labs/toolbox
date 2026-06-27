import type { ReactNode } from 'react';
import { HexColorInput, HexColorPicker } from 'react-colorful';
import type { SvgNode } from '@toolbox/svg-core';
import { Button, Popover, PopoverContent, PopoverTrigger } from '@toolbox/ui';
import { getAdaptiveRole, getNodeFields, type AdaptiveRole } from '../scene-editor';
import type { TextShadow } from '../text-effects';
import {
  Field,
  FieldInput,
  FieldSelect,
  InfoDot,
  NumberField,
  SegmentedControl,
  Toggle
} from './fields';

export function DocumentControls({
  backgroundColor,
  showSafeGuide,
  onChangeBackground,
  onToggleSafeGuide,
  projectName,
  onRenameProject,
  onDownloadProject,
  openControl
}: {
  readonly backgroundColor: string;
  readonly showSafeGuide: boolean;
  readonly onChangeBackground: (color: string) => void;
  readonly onToggleSafeGuide: (show: boolean) => void;
  readonly projectName: string;
  readonly onRenameProject: (name: string) => void;
  readonly onDownloadProject: () => void;
  readonly openControl: ReactNode;
}) {
  const backgroundMode = backgroundColor === 'transparent' ? 'transparent' : 'color';
  const currentColor = backgroundColor === 'transparent' ? '#ffffff' : backgroundColor;

  return (
    <div className="if-document-controls">
      <Field label="Project name">
        <FieldInput
          value={projectName}
          placeholder="Untitled icon"
          onChange={(event) => onRenameProject(event.target.value)}
        />
      </Field>
      <div className="if-doc-actions">
        {openControl}
        <Button variant="secondary" type="button" onClick={onDownloadProject}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3v12" />
            <path d="m7 10 5 5 5-5" />
            <path d="M4 21h16" />
          </svg>
          Download
        </Button>
      </div>
      <p className="if-note">
        Projects are kept in this browser. <b>Download</b> saves a copy as a <b>.json</b> file.
      </p>
      <div className="if-field">
        <span>Background</span>
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
      <div className="if-toggle-row">
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
  onSetShadow
}: {
  readonly node: SvgNode | null;
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
}) {
  if (!node) {
    return <p className="if-dock-note">Add or select a layer to adjust it.</p>;
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
    <div className="if-adjust-tab">
      {nameField ? renderField(nameField) : null}
      {contentField ? renderField(contentField) : null}

      {showFontControls ? (
        <div className="if-adjust-group">
          <div className="if-subhead">Typeface</div>
          <Field label="Font" wide>
            <div className="if-font-row">
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
            <label className="if-font-upload">
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
            <p className="if-note" role="alert">
              {fontStatus.message}
            </p>
          ) : fontStatus.state === 'loaded' ? (
            <p className="if-note">Loaded {fontStatus.message}.</p>
          ) : null}
        </div>
      ) : null}

      {showTransform || sizeFields.length > 0 ? (
        <div className="if-adjust-group">
          <div className="if-subhead">Position &amp; size</div>
          <div className="if-field-grid">
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
              className="if-center-btn"
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
        <div className="if-adjust-group">
          <div className="if-subhead">Appearance</div>
          <div className="if-field-grid">{appearanceFields.map(renderField)}</div>
        </div>
      ) : null}

      <div className="if-adjust-group">
        <div className="if-subhead if-subhead-info">
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
        <div className="if-adjust-group">
          <div className="if-subhead">Shadow</div>
          <Toggle
            checked={shadow != null}
            onChange={(on) =>
              onSetShadow?.(on ? { dx: 1, dy: 1, blur: 1, color: '#000000' } : null)
            }
            label="Drop shadow"
          />
          {shadow != null ? (
            <div className="if-field-grid">
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
        <div className="if-adjust-actions">
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
    <div className="if-color-field">
      <span>{label}</span>
      <div className="if-color-control-row">
        <div className="if-color-swatch-anchor">
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="if-color-swatch-button"
                aria-label={`Open ${label} picker`}
              >
                <span
                  className="if-color-swatch-chip"
                  style={{ background: hex }}
                  aria-hidden="true"
                />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="if-color-popover"
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
          className="if-input if-hex-input"
          aria-label={`${label} hex value`}
        />
      </div>
    </div>
  );
}
