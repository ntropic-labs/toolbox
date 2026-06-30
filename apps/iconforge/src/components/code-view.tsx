import { useEffect, useState } from 'react';
import type { SvgDiagnostic } from '@toolbox/svg-core';
import { Button } from '@toolbox/ui';
import type { ThemeMode } from '../theme';
import { Toggle } from './fields';
import { getCodeEditor, loadCodeEditor, type CodeEditorComponent } from './lazy-code-editors';

export function CodeView({
  value,
  diagnostics,
  onChange,
  onPrettify,
  onOptimize,
  optimizing,
  theme = 'dark'
}: {
  readonly value: string;
  readonly diagnostics: readonly SvgDiagnostic[];
  readonly onChange: (text: string) => void;
  readonly onPrettify: () => void;
  readonly onOptimize: (removeHidden: boolean) => void;
  readonly optimizing: boolean;
  readonly theme?: ThemeMode;
}) {
  const [removeHidden, setRemoveHidden] = useState(false);
  const [Editor, setEditor] = useState<CodeEditorComponent | null>(() => getCodeEditor());
  useEffect(() => {
    if (getCodeEditor()) return;
    let active = true;
    void loadCodeEditor().then((component) => {
      if (active) setEditor(() => component);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section
      className="grid aspect-square w-[var(--stage-w)] grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-[10px] border border-border bg-card [&>[class*=cm-theme]]:h-full [&>[class*=cm-theme]]:w-full [&>[class*=cm-theme]]:min-w-0 [&>[class*=cm-theme]]:overflow-hidden [&_.cm-editor]:max-w-full"
      aria-label="SVG source editor"
    >
      <div className="flex items-center gap-1.5 border-b border-border px-[11px] py-[9px]">
        <Button variant="ghost" className="min-h-[28px] px-[9px] py-1 text-[12px]" onClick={onPrettify}>
          Prettify
        </Button>
        <Button
          variant="ghost"
          className="min-h-[28px] px-[9px] py-1 text-[12px]"
          onClick={() => onOptimize(removeHidden)}
          disabled={optimizing}
          title="Minify the SVG to the smallest equivalent code (SVGO)"
        >
          {optimizing ? 'Optimizing…' : 'Optimize'}
        </Button>
        <Toggle
          label="Remove hidden"
          className="ml-auto whitespace-nowrap text-[11.5px]"
          checked={removeHidden}
          onChange={setRemoveHidden}
          title="When on, Optimize strips hidden (display:none) layers instead of keeping them"
        />
      </div>
      {Editor ? (
        <Editor value={value} onChange={onChange} theme={theme} />
      ) : (
        <textarea
          className="h-full w-full resize-none bg-card px-4 py-[14px] text-[12px] leading-[1.5] text-foreground [tab-size:2] focus-visible:[outline:2px_solid_var(--ring)] focus-visible:[outline-offset:-2px]"
          spellCheck={false}
          value={value}
          aria-label="SVG source"
          aria-invalid={diagnostics.length > 0 || undefined}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {diagnostics.length > 0 ? (
        <ul
          className="m-0 list-none rounded-lg border border-destructive bg-[color-mix(in_srgb,var(--destructive)_12%,transparent)] px-[10px] py-2 text-[12px] leading-[1.4] text-destructive [&_li+li]:mt-1"
          aria-live="polite"
        >
          {diagnostics.map((diagnostic, index) => (
            <li key={`${index}-${diagnostic.message}`}>{diagnostic.message}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
