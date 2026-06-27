import { ToggleGroup, ToggleGroupItem } from '@toolbox/ui';

export type PreviewMode = 'preview' | 'code' | 'react' | 'native';

const modeOptions: readonly { readonly value: PreviewMode; readonly label: string }[] = [
  { value: 'preview', label: 'Preview' },
  { value: 'code', label: 'Code' },
  { value: 'react', label: 'React' },
  { value: 'native', label: 'React Native' }
];

const isPreviewMode = (value: string): value is PreviewMode =>
  modeOptions.some((option) => option.value === value);

export function PreviewModeToggle({
  mode,
  onChange
}: {
  readonly mode: PreviewMode;
  readonly onChange: (next: PreviewMode) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      value={mode}
      onValueChange={(value) => {
        if (isPreviewMode(value)) onChange(value);
      }}
      className="if-mode-toggle"
      aria-label="Preview, code, or generated-component view"
    >
      {modeOptions.map((option) => (
        <ToggleGroupItem key={option.value} value={option.value} className="if-mode-option">
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
