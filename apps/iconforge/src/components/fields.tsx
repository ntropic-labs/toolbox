import {
  useEffect,
  useRef,
  type InputHTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type SelectHTMLAttributes
} from 'react';
import { cn, ToggleGroup, ToggleGroupItem } from '@toolbox/ui';
import { getNumberWheelStepDirection } from './field-utils';

export const inputClass =
  'h-[34px] w-full min-w-0 rounded-lg border border-border bg-input px-[9px] py-[7px] text-[12.5px] text-foreground accent-[var(--primary)] outline-none transition-[border-color,box-shadow] placeholder:text-muted-foreground [&:hover:not(:disabled):not(:focus)]:border-border-strong focus-visible:outline-offset-2 focus-visible:[outline:2px_solid_var(--ring)] disabled:cursor-not-allowed disabled:opacity-[0.52]';

export function InfoDot({ label }: { readonly label: string }) {
  return (
    <span
      className="inline-grid h-[15px] w-[15px] flex-none cursor-help place-items-center rounded-full border border-border-strong text-[9px] not-italic leading-none text-muted-foreground"
      role="img"
      aria-label={label}
      title={label}
    >
      i
    </span>
  );
}

export function SegmentedControl({
  value,
  options,
  onChange,
  ariaLabel
}: {
  readonly value: string;
  readonly options: readonly { readonly value: string; readonly label: string }[];
  readonly onChange: (value: string) => void;
  readonly ariaLabel: string;
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next);
      }}
      className="grid grid-flow-col auto-cols-fr gap-0.5 rounded-[9px] border border-border bg-input p-[3px]"
      aria-label={ariaLabel}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className="inline-flex min-h-[28px] cursor-pointer items-center justify-center rounded-md border-none bg-transparent px-[11px] py-[5px] text-[12px] font-medium leading-[1.2] text-muted-foreground transition-colors hover:text-foreground focus-visible:[outline:2px_solid_var(--ring)] focus-visible:[outline-offset:-2px] data-[state=on]:bg-[color-mix(in_srgb,var(--primary)_16%,var(--card))] data-[state=on]:text-foreground data-[state=on]:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--primary)_52%,transparent)]"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export function Field({
  label,
  children,
  wide = false
}: {
  readonly label: string;
  readonly children: ReactNode;
  readonly wide?: boolean;
}) {
  return (
    <label
      className="relative grid min-w-0 gap-[5px] text-[12px] text-muted-foreground data-[disabled]:text-subtle"
      data-wide={wide || undefined}
    >
      <span className="text-[9.5px] font-medium uppercase leading-none tracking-[0.12em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

export function FieldInput({
  className,
  inputMode,
  onWheel,
  type,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  const isNumberInput = type === 'number';
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isNumberInput) return;

    const input = inputRef.current;
    if (!input) return;

    input.addEventListener('wheel', handleNumberInputWheel, { passive: false });
    return () => input.removeEventListener('wheel', handleNumberInputWheel);
  }, [isNumberInput]);

  return (
    <input
      {...props}
      ref={inputRef}
      type={type}
      inputMode={isNumberInput ? (inputMode ?? 'decimal') : inputMode}
      onWheel={isNumberInput ? undefined : onWheel}
      className={cn(inputClass, className)}
    />
  );
}

export function NumberField({
  label,
  className,
  ...inputProps
}: {
  readonly label: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.addEventListener('wheel', handleNumberInputWheel, { passive: false });
    return () => input.removeEventListener('wheel', handleNumberInputWheel);
  }, []);

  const bump = (direction: -1 | 1) => {
    const input = inputRef.current;
    if (!input) return;
    input.focus({ preventScroll: true });
    stepNumberInput(input, direction);
  };

  const stepClass =
    'flex cursor-pointer items-center justify-center bg-accent p-0 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground active:bg-[color-mix(in_srgb,var(--primary)_30%,var(--accent))] active:text-primary [&_svg]:h-[6px] [&_svg]:w-[9px] [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round] [&_svg]:[stroke-width:1.6]';
  return (
    <label className="relative grid min-w-0 gap-[5px] text-[12px] text-muted-foreground">
      <span
        className="w-fit cursor-ew-resize touch-none select-none text-[9.5px] font-medium uppercase leading-none tracking-[0.12em] text-muted-foreground"
        onPointerDown={(event) => startScrub(event, inputRef.current)}
      >
        {label}
      </span>
      <span className="group relative block">
        <input
          {...inputProps}
          ref={inputRef}
          type="number"
          inputMode="decimal"
          className={cn(inputClass, 'pr-6', className)}
        />
        <span
          className="pointer-events-none absolute bottom-px right-px top-px grid w-[21px] grid-rows-[1fr_1fr] overflow-hidden rounded-r-[7px] border-l border-border opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
          aria-hidden="true"
        >
          <button type="button" tabIndex={-1} className={stepClass} onClick={() => bump(1)}>
            <svg viewBox="0 0 10 6">
              <path d="M1 5L5 1l4 4" />
            </svg>
          </button>
          <button
            type="button"
            tabIndex={-1}
            className={cn(stepClass, 'border-t border-border')}
            onClick={() => bump(-1)}
          >
            <svg viewBox="0 0 10 6">
              <path d="M1 1l4 4 4-4" />
            </svg>
          </button>
        </span>
      </span>
    </label>
  );
}

function startScrub(event: ReactPointerEvent, input: HTMLInputElement | null) {
  if (!input || input.disabled || input.readOnly) return;
  if (event.button !== 0) return;
  event.preventDefault();

  const startX = event.clientX;
  const startValue = Number(input.value) || 0;
  const step = Number(input.step) || 1;
  const min = input.min === '' ? Number.NEGATIVE_INFINITY : Number(input.min);
  const max = input.max === '' ? Number.POSITIVE_INFINITY : Number(input.max);
  const decimals = (String(step).split('.')[1] ?? '').length;
  const pxPerStep = 4;

  const onMove = (move: globalThis.PointerEvent) => {
    const steps = Math.round((move.clientX - startX) / pxPerStep);
    const next = Math.min(max, Math.max(min, startValue + steps * step));
    const text = decimals > 0 ? next.toFixed(decimals) : String(next);
    if (input.value !== text) {
      setReactInputValue(input, text);
    }
  };
  const onUp = () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    document.body.classList.remove('if-scrubbing');
  };

  document.body.classList.add('if-scrubbing');
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
}

const nativeInputValueSetter =
  typeof HTMLInputElement === 'undefined'
    ? undefined
    : // eslint-disable-next-line @typescript-eslint/unbound-method -- always invoked via .call in setReactInputValue
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;

function setReactInputValue(input: HTMLInputElement, value: string) {
  if (nativeInputValueSetter) {
    nativeInputValueSetter.call(input, value);
  } else {
    input.value = value;
  }
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function stepNumberInput(input: HTMLInputElement, direction: -1 | 1) {
  if (input.disabled || input.readOnly) return;
  const previousValue = input.value;
  if (direction > 0) {
    input.stepUp();
  } else {
    input.stepDown();
  }
  if (input.value !== previousValue) {
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function handleNumberInputWheel(event: globalThis.WheelEvent) {
  const direction = getNumberWheelStepDirection(event.deltaY);
  if (direction === 0) return;

  const input = event.currentTarget;
  if (!(input instanceof HTMLInputElement) || input.disabled || input.readOnly) return;

  event.preventDefault();
  input.focus({ preventScroll: true });
  stepNumberInput(input, direction);
}

export function FieldSelect({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(inputClass, props.className)}>
      {children}
    </select>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  title,
  className
}: {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly label: string;
  readonly disabled?: boolean;
  readonly title?: string;
  readonly className?: string;
}) {
  return (
    <label
      className={cn(
        'inline-flex cursor-pointer select-none items-center gap-[9px] text-[12.5px] text-foreground data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
        className
      )}
      data-on={checked || undefined}
      data-disabled={disabled || undefined}
      title={title}
    >
      <input
        type="checkbox"
        role="switch"
        className="peer absolute m-0 h-px w-px opacity-0"
        checked={checked}
        disabled={disabled}
        aria-checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span
        className="relative h-5 w-[34px] flex-none rounded-full border border-border-strong bg-accent transition-colors peer-focus-visible:outline-offset-2 peer-focus-visible:[outline:2px_solid_var(--ring)] [[data-on]_&]:border-primary [[data-on]_&]:bg-[color-mix(in_srgb,var(--primary)_32%,var(--accent))]"
        aria-hidden="true"
      >
        <span className="absolute left-0.5 top-0.5 h-[14px] w-[14px] rounded-full bg-muted-foreground transition-[left,background-color] [[data-on]_&]:left-4 [[data-on]_&]:bg-primary" />
      </span>
      <span>{label}</span>
    </label>
  );
}
