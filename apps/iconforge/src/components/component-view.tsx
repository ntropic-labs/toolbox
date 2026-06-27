import { useEffect, useState } from 'react';
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
    <section className="if-code-view" aria-label={label}>
      <div className="if-code-toolbar">
        <span className="if-code-name">{label}</span>
        <button type="button" className="if-button if-button-secondary" onClick={onCopy}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="8" y="8" width="11" height="11" rx="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
          </svg>
          Copy
        </button>
      </div>
      {Editor ? (
        <Editor value={code} theme={theme} />
      ) : (
        <textarea
          className="if-code-editor"
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
