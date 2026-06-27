import type { RefObject } from 'react';

// Android adaptive icon zones (of 108 units): the mask viewport is 72 (≈67%) and the
// guaranteed-visible safe circle is 66 (≈61%). Designing to the circle also covers iOS.
const maskRatio = 72 / 108;
const safeRatio = 66 / 108;

function inset(ratio: number): string {
  return `${((1 - ratio) / 2) * 100}%`;
}

export interface SelectionBox {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export function CanvasPreview({
  canvasRef,
  background,
  showSafeGuide,
  selectionBox
}: {
  readonly canvasRef: RefObject<HTMLCanvasElement | null>;
  readonly background: string;
  readonly showSafeGuide: boolean;
  readonly selectionBox?: SelectionBox | null;
}) {
  return (
    <section className="if-preview" aria-label="Canvas preview">
      <div className="if-canvas-frame">
        <div
          className="if-canvas-stage"
          data-transparent={background === 'transparent' || undefined}
        >
          <canvas ref={canvasRef} className="if-canvas" aria-label="Icon preview canvas" />
          {showSafeGuide ? <SafeGuides /> : null}
          {selectionBox ? <SelectionChrome box={selectionBox} /> : null}
        </div>
      </div>
    </section>
  );
}

function SelectionChrome({ box }: { readonly box: SelectionBox }) {
  return (
    <div
      className="if-selection"
      aria-hidden="true"
      style={{
        left: `${box.left}%`,
        top: `${box.top}%`,
        width: `${box.width}%`,
        height: `${box.height}%`
      }}
    >
      <span className="if-selection-handle" data-corner="tl" />
      <span className="if-selection-handle" data-corner="tr" />
      <span className="if-selection-handle" data-corner="bl" />
      <span className="if-selection-handle" data-corner="br" />
    </div>
  );
}

function SafeGuides() {
  return (
    <div className="if-safe-guide" aria-hidden="true">
      <div className="if-safe-mask" style={{ inset: inset(maskRatio) }} />
      <div className="if-safe-circle" style={{ inset: inset(safeRatio) }} />
    </div>
  );
}
