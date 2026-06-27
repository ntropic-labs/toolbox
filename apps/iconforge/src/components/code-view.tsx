import { useEffect, useState } from 'react';
import type { SvgDiagnostic } from '@toolbox/svg-core';
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
  // Seed from the module cache so a remount (tab switch) shows CodeMirror immediately. The lazy
  // initializer RETURNS the component; passing it directly would make useState call it (no props).
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
    <section className="if-code-view" aria-label="SVG source editor">
      <div className="if-code-toolbar">
        <button type="button" className="if-button if-button-ghost" onClick={onPrettify}>
          Prettify
        </button>
        <button
          type="button"
          className="if-button if-button-ghost"
          onClick={() => onOptimize(removeHidden)}
          disabled={optimizing}
          title="Minify the SVG to the smallest equivalent code (SVGO)"
        >
          {optimizing ? 'Optimizing…' : 'Optimize'}
        </button>
        <Toggle
          label="Remove hidden"
          checked={removeHidden}
          onChange={setRemoveHidden}
          title="When on, Optimize strips hidden (display:none) layers instead of keeping them"
        />
      </div>
      {Editor ? (
        <Editor value={value} onChange={onChange} theme={theme} />
      ) : (
        <textarea
          className="if-code-editor"
          spellCheck={false}
          value={value}
          aria-label="SVG source"
          aria-invalid={diagnostics.length > 0 || undefined}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {diagnostics.length > 0 ? (
        <ul className="if-code-diagnostics" aria-live="polite">
          {diagnostics.map((diagnostic, index) => (
            <li key={`${index}-${diagnostic.message}`}>{diagnostic.message}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
