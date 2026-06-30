import type { ExportSelection } from '@toolbox/export-engine';
import { Button, Slider } from '@toolbox/ui';
import { FieldInput, InfoDot, Toggle } from './fields';

export function ExportTab({
  selection,
  pngSizeChoices,
  fileCount,
  exportInset,
  maxInset,
  exporting,
  onChange,
  onExportInsetChange,
  onDownload
}: {
  readonly selection: ExportSelection;
  readonly pngSizeChoices: readonly number[];
  readonly fileCount: number;
  readonly exportInset: number;
  readonly maxInset: number;
  readonly exporting: boolean;
  readonly onChange: (next: ExportSelection) => void;
  readonly onExportInsetChange: (next: number) => void;
  readonly onDownload: () => void;
}) {
  return (
    <div className="grid w-[var(--stage-w)] gap-3 rounded-[10px] border border-border bg-card px-[14px] py-[13px] [&>div]:min-w-0 max-[760px]:order-4">
      <div className="flex items-center justify-between gap-[10px]">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Export
        </span>
      </div>

      <div className="grid gap-[10px]">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <Toggle
            label="SVG source"
            checked={selection.svg}
            onChange={(svg) => onChange({ ...selection, svg })}
          />

          <div className="flex min-w-0 items-center gap-[10px]">
            <span className="whitespace-nowrap text-[9.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Trim edges %
            </span>
            <Slider
              className="w-[clamp(90px,16vw,150px)] flex-[0_0_clamp(90px,16vw,150px)] [&_[role=slider]]:border-2 [&_[role=slider]]:border-background [&_[role=slider]]:bg-primary"
              value={[exportInset]}
              min={0}
              max={maxInset}
              step={1}
              aria-label="Trim edges"
              onValueChange={(values) => onExportInsetChange(values[0] ?? 0)}
            />
            <FieldInput
              className="w-[56px] flex-[0_0_56px] px-[6px] text-center"
              type="number"
              aria-label="Trim edges %"
              min={0}
              max={maxInset}
              step={1}
              value={exportInset}
              onChange={(event) => onExportInsetChange(Number(event.target.value))}
            />
          </div>
        </div>

        <div className="grid gap-1.5">
          <span
            className="text-[9.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
            title="Each PNG exports at the chosen sizes. Tag a layer's adaptive role to also get background and foreground PNGs."
          >
            PNG sizes
          </span>
          <div className="flex flex-wrap gap-1.5">
            {pngSizeChoices.map((size) => {
              const active = selection.pngSizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  className="inline-flex cursor-pointer items-center gap-[5px] rounded-lg border border-border bg-secondary px-[10px] py-1 text-[12px] font-semibold text-muted-foreground transition-[border-color,background,color] hover:border-[color-mix(in_srgb,var(--primary)_50%,var(--border))] hover:text-foreground focus-visible:outline-offset-2 focus-visible:[outline:2px_solid_var(--ring)] aria-pressed:border-primary aria-pressed:bg-[color-mix(in_srgb,var(--primary)_16%,var(--card))] aria-pressed:text-foreground aria-pressed:after:text-[10px] aria-pressed:after:leading-none aria-pressed:after:text-primary aria-pressed:after:content-['✓']"
                  aria-pressed={active}
                  onClick={() => onChange({ ...selection, pngSizes: togglePngSize(selection.pngSizes, size) })}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <Toggle
            label="Favicon (.ico)"
            checked={selection.favicon}
            onChange={(favicon) => onChange({ ...selection, favicon })}
          />
          <InfoDot label="Bundle a multi-size favicon.ico for websites." />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <span className="text-[13px] text-muted-foreground" aria-live="polite">
          {fileCount === 0 ? 'Nothing selected' : `${fileCount} file${fileCount === 1 ? '' : 's'}`}
        </span>
        <Button
          variant="primary"
          onClick={onDownload}
          disabled={exporting || fileCount === 0}
        >
          {exporting ? 'Generating…' : fileCount > 1 ? 'Download ZIP' : 'Download'}
        </Button>
      </div>
    </div>
  );
}

function togglePngSize(sizes: readonly number[], size: number): number[] {
  return sizes.includes(size) ? sizes.filter((value) => value !== size) : [...sizes, size];
}
