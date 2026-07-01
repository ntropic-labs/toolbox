import type { SvgNode } from '@toolbox/svg-core';
import type { FontAxis } from '@toolbox/svg-ops';
import { Slider } from '@toolbox/ui';
import { readStyleProperty } from '../style-attr';
import { Field, FieldSelect, NumberField, SegmentedControl, Toggle } from './fields';

const caseOptions = [
  { value: '', label: 'None' },
  { value: 'uppercase', label: 'UPPERCASE' },
  { value: 'lowercase', label: 'lowercase' },
  { value: 'capitalize', label: 'Capitalize' }
];

const decorationOptions = [
  { value: '', label: 'None' },
  { value: 'underline', label: 'Underline' },
  { value: 'line-through', label: 'Strikethrough' }
];

function findAxis(axes: readonly FontAxis[], tag: string): FontAxis | undefined {
  return axes.find((axis) => axis.tag === tag);
}

function parseWeight(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  if (value.trim() === 'bold') return 700;
  if (value.trim() === 'normal') return 400;
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseWidth(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = Number(value.trim().replace(/%$/u, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseSlant(value: string | undefined): number {
  const oblique = /oblique\s+(-?[\d.]+)deg/iu.exec(value ?? '');
  return oblique ? -Number(oblique[1]) : 0;
}

function AxisSlider({
  label,
  axis,
  value,
  onChange
}: {
  readonly label: string;
  readonly axis: FontAxis;
  readonly value: number;
  readonly onChange: (value: number) => void;
}) {
  return (
    <div className="grid min-w-0 gap-[5px]" data-wide>
      <div className="flex items-center justify-between">
        <span className="text-[9.5px] font-medium uppercase leading-none tracking-[0.12em] text-muted-foreground">
          {label}
        </span>
        <span className="text-[11px] tabular-nums text-muted-foreground">{Math.round(value)}</span>
      </div>
      <Slider
        aria-label={label}
        min={axis.min}
        max={axis.max}
        step={1}
        value={[value]}
        onValueChange={(next) => {
          const first = next[0];
          if (typeof first === 'number') onChange(first);
        }}
      />
    </div>
  );
}

export function TextTypeControls({
  node,
  axes,
  onUpdateField,
  onSetTextTransform
}: {
  readonly node: SvgNode;
  readonly axes: readonly FontAxis[];
  readonly onUpdateField: (name: string, value: string) => void;
  readonly onSetTextTransform: (value: string) => void;
}) {
  const wght = findAxis(axes, 'wght');
  const wdth = findAxis(axes, 'wdth');
  const slnt = findAxis(axes, 'slnt');

  const fontWeight = node.attributes['font-weight'];
  const fontStyle = node.attributes['font-style'];
  const caseValue = readStyleProperty(node.attributes.style, 'text-transform') ?? '';
  const decoration = node.attributes['text-decoration'] ?? '';

  return (
    <div className="grid gap-2">
      <div className="text-[9.5px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Type
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(92px,1fr))] gap-[9px] [&>[data-wide]]:col-span-2">
        {wght ? (
          <AxisSlider
            label="Weight"
            axis={wght}
            value={parseWeight(fontWeight, wght.default)}
            onChange={(value) =>
              onUpdateField('font-weight', value === wght.default ? '' : String(Math.round(value)))
            }
          />
        ) : (
          <div className="grid min-w-0 gap-[5px]" data-wide>
            <span className="text-[9.5px] font-medium uppercase leading-none tracking-[0.12em] text-muted-foreground">
              Weight
            </span>
            <SegmentedControl
              value={parseWeight(fontWeight, 400) >= 600 ? 'bold' : 'regular'}
              options={[
                { value: 'regular', label: 'Regular' },
                { value: 'bold', label: 'Bold' }
              ]}
              onChange={(next) => onUpdateField('font-weight', next === 'bold' ? '700' : '')}
              ariaLabel="Weight"
            />
          </div>
        )}

        {wdth ? (
          <AxisSlider
            label="Width"
            axis={wdth}
            value={parseWidth(node.attributes['font-stretch'], wdth.default)}
            onChange={(value) =>
              onUpdateField(
                'font-stretch',
                value === wdth.default ? '' : `${Math.round(value)}%`
              )
            }
          />
        ) : null}

        {slnt ? (
          <AxisSlider
            label="Slant"
            axis={slnt}
            value={parseSlant(fontStyle)}
            onChange={(value) =>
              onUpdateField('font-style', value === 0 ? '' : `oblique ${-Math.round(value)}deg`)
            }
          />
        ) : (
          <div className="flex items-end" data-wide>
            <Toggle
              checked={(fontStyle ?? '').trim().toLowerCase().startsWith('italic')}
              onChange={(on) => onUpdateField('font-style', on ? 'italic' : '')}
              label="Italic"
            />
          </div>
        )}

        <NumberField
          label="Letter spacing"
          value={node.attributes['letter-spacing'] ?? ''}
          step={0.5}
          onChange={(event) => onUpdateField('letter-spacing', event.target.value)}
        />
        <NumberField
          label="Word spacing"
          value={node.attributes['word-spacing'] ?? ''}
          step={0.5}
          onChange={(event) => onUpdateField('word-spacing', event.target.value)}
        />

        <Field label="Case" wide>
          <FieldSelect value={caseValue} onChange={(event) => onSetTextTransform(event.target.value)}>
            {caseOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FieldSelect>
        </Field>

        <Field label="Decoration" wide>
          <FieldSelect
            value={decoration}
            onChange={(event) => onUpdateField('text-decoration', event.target.value)}
          >
            {decorationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FieldSelect>
        </Field>
      </div>

      {axes.length === 0 ? (
        <p className="m-0 text-[11px] leading-[1.45] text-muted-foreground">
          Load a variable font for continuous weight &amp; width control.
        </p>
      ) : null}
    </div>
  );
}
