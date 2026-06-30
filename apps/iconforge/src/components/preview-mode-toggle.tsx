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
      className="flex gap-0.5 rounded-[9px] border border-border bg-input p-[3px]"
      aria-label="Preview, code, or generated-component view"
    >
      {modeOptions.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className="min-h-[30px] cursor-pointer rounded-md border-none bg-transparent px-[11px] py-[5px] text-[12px] font-medium leading-[1.2] text-muted-foreground transition-colors hover:text-foreground focus-visible:[outline:2px_solid_var(--ring)] focus-visible:[outline-offset:-2px] data-[state=on]:bg-[color-mix(in_srgb,var(--primary)_16%,var(--card))] data-[state=on]:text-foreground data-[state=on]:shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--primary)_52%,transparent)]"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
