import { useEffect, useState } from 'react';
import { Button } from '@toolbox/ui';
import type { ThemeMode } from '../theme';
import {
  getReadonlyEditor,
  loadReadonlyEditor,
  type ReadonlyEditorComponent
} from './lazy-code-editors';

export function ComponentView({
  code,
  label,
  onCopy,
  theme = 'dark'
}: {
  readonly code: string;
  readonly label: string;
  readonly onCopy: () => void;
  readonly theme?: ThemeMode;
}) {
  const [Editor, setEditor] = useState<ReadonlyEditorComponent | null>(() => getReadonlyEditor());
  useEffect(() => {
    if (getReadonlyEditor()) return;
    let active = true;
    void loadReadonlyEditor().then((component) => {
      if (active) setEditor(() => component);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section
      className="grid aspect-square w-[var(--stage-w)] grid-cols-[minmax(0,1fr)] grid-rows-[auto_minmax(0,1fr)_auto] overflow-hidden rounded-[10px] border border-border bg-card [&>[class*=cm-theme]]:h-full [&>[class*=cm-theme]]:w-full [&>[class*=cm-theme]]:min-w-0 [&>[class*=cm-theme]]:overflow-hidden [&_.cm-editor]:max-w-full"
      aria-label={label}
    >
      <div className="flex items-center gap-1.5 border-b border-border px-[11px] py-[9px]">
        <span className="mr-auto text-[12px] font-semibold text-foreground">{label}</span>
        <Button variant="secondary" className="min-h-[28px] px-[9px] py-1 text-[12px]" onClick={onCopy}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="8" y="8" width="11" height="11" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
          </svg>
          Copy
        </Button>
      </div>
      {Editor ? (
        <Editor value={code} theme={theme} />
      ) : (
        <textarea
          className="h-full w-full resize-none bg-card px-4 py-[14px] text-[12px] leading-[1.5] text-foreground [tab-size:2] focus-visible:[outline:2px_solid_var(--ring)] focus-visible:[outline-offset:-2px]"
          spellCheck={false}
          readOnly
          aria-readonly="true"
          value={code}
          aria-label={label}
        />
      )}
    </section>
  );
}
