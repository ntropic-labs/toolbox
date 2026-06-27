import {
  useEffect,
  useRef,
  type InputHTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type SelectHTMLAttributes
} from 'react';
import { ToggleGroup, ToggleGroupItem } from '@toolbox/ui';
import { getNumberWheelStepDirection } from './field-utils';

export function InfoDot({ label }: { readonly label: string }) {
  return (
    <span className="if-info" role="img" aria-label={label} title={label}>
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
      className="if-seg"
      aria-label={ariaLabel}
    >
      {options.map((option) => (
        <ToggleGroupItem key={option.value} value={option.value} className="if-seg-item">
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
    <label className={wide ? 'if-field if-field-wide' : 'if-field'}>
      <span>{label}</span>
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
      className={`if-input ${className ?? ''}`.trim()}
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

  return (
    <label className="if-field if-numfield">
      <span className="if-num-label" onPointerDown={(event) => startScrub(event, inputRef.current)}>
        {label}
      </span>
      <span className="if-num">
        <input
          {...inputProps}
          ref={inputRef}
          type="number"
          inputMode="decimal"
          className={`if-input if-num-input ${className ?? ''}`.trim()}
        />
        <span className="if-num-steppers" aria-hidden="true">
          <button type="button" tabIndex={-1} className="if-num-step" onClick={() => bump(1)}>
            <svg viewBox="0 0 10 6">
              <path d="M1 5L5 1l4 4" />
            </svg>
          </button>
          <button type="button" tabIndex={-1} className="if-num-step" onClick={() => bump(-1)}>
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
    <select {...props} className={`if-input ${props.className ?? ''}`.trim()}>
      {children}
    </select>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  title
}: {
  readonly checked: boolean;
  readonly onChange: (checked: boolean) => void;
  readonly label: string;
  readonly disabled?: boolean;
  readonly title?: string;
}) {
  return (
    <label
      className="if-toggle"
      data-on={checked || undefined}
      data-disabled={disabled || undefined}
      title={title}
    >
      <input
        type="checkbox"
        role="switch"
        className="if-toggle-input"
        checked={checked}
        disabled={disabled}
        aria-checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="if-toggle-track" aria-hidden="true">
        <span className="if-toggle-knob" />
      </span>
      <span className="if-toggle-text">{label}</span>
    </label>
  );
}
