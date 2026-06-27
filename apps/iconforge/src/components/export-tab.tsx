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
    <div className="if-card if-export-tab">
      <div className="if-card-head">
        <span className="if-seclabel">Export</span>
      </div>

      <div className="if-export-options">
        <div className="if-export-top">
          <Toggle
            label="SVG source"
            checked={selection.svg}
            onChange={(svg) => onChange({ ...selection, svg })}
          />

          <div className="if-trim">
            <span className="if-trim-label">Trim edges %</span>
            <Slider
              className="if-inset-slider if-trim-range"
              value={[exportInset]}
              min={0}
              max={maxInset}
              step={1}
              aria-label="Trim edges"
              onValueChange={(values) => onExportInsetChange(values[0] ?? 0)}
            />
            <FieldInput
              className="if-trim-num"
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

        <div className="if-png-sizes">
          <span
            className="if-png-sizes-label"
            title="Each PNG exports at the chosen sizes. Tag a layer's adaptive role to also get background and foreground PNGs."
          >
            PNG sizes
          </span>
          <div className="if-png-sizes-chips">
            {pngSizeChoices.map((size) => {
              const active = selection.pngSizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  className="if-png-size"
                  aria-pressed={active}
                  onClick={() => onChange({ ...selection, pngSizes: togglePngSize(selection.pngSizes, size) })}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </div>

        <div className="if-toggle-row">
          <Toggle
            label="Favicon (.ico)"
            checked={selection.favicon}
            onChange={(favicon) => onChange({ ...selection, favicon })}
          />
          <InfoDot label="Bundle a multi-size favicon.ico for websites." />
        </div>
      </div>

      <div className="if-export-footer">
        <span className="if-export-count" aria-live="polite">
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
