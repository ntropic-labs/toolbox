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
    <section
      className="grid min-h-0 w-full min-w-0 place-items-center max-[760px]:order-2"
      aria-label="Canvas preview"
    >
      <div className="aspect-square w-[var(--stage-w)] rounded-[10px] border border-border bg-card p-[clamp(10px,1.8vw,18px)] max-[760px]:w-[min(100%,calc(100vw_-_20px))]">
        <div
          className="relative h-full w-full overflow-hidden rounded-lg bg-canvas data-[transparent]:bg-[#f7f8fa] data-[transparent]:[background-image:linear-gradient(45deg,#c9ced6_25%,transparent_25%),linear-gradient(-45deg,#c9ced6_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#c9ced6_75%),linear-gradient(-45deg,transparent_75%,#c9ced6_75%)] data-[transparent]:[background-position:0_0,0_8px,8px_-8px,-8px_0] data-[transparent]:[background-size:16px_16px]"
          data-transparent={background === 'transparent' || undefined}
        >
          <canvas
            ref={canvasRef}
            className="block h-full w-full rounded-lg"
            aria-label="Icon preview canvas"
          />
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
      className="pointer-events-none absolute rounded-[3px] [border:1.5px_dashed_var(--primary)]"
      aria-hidden="true"
      style={{
        left: `${box.left}%`,
        top: `${box.top}%`,
        width: `${box.width}%`,
        height: `${box.height}%`
      }}
    >
      <span className="absolute -left-1 -top-1 h-[7px] w-[7px] rounded-[1px] bg-primary" />
      <span className="absolute -right-1 -top-1 h-[7px] w-[7px] rounded-[1px] bg-primary" />
      <span className="absolute -bottom-1 -left-1 h-[7px] w-[7px] rounded-[1px] bg-primary" />
      <span className="absolute -bottom-1 -right-1 h-[7px] w-[7px] rounded-[1px] bg-primary" />
    </div>
  );
}

function SafeGuides() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div
        className="absolute rounded-[8%] [border:2px_dashed_color-mix(in_srgb,var(--destructive)_62%,transparent)]"
        style={{ inset: inset(maskRatio) }}
      />
      <div
        className="absolute rounded-full [border:2px_dashed_color-mix(in_srgb,var(--destructive)_80%,transparent)]"
        style={{ inset: inset(safeRatio) }}
      />
    </div>
  );
}
