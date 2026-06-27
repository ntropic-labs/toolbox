import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { xml } from '@codemirror/lang-xml';
import type { ThemeMode } from '../theme';

const appChrome = EditorView.theme({
  '&': {
    height: '100%',
    backgroundColor: 'var(--if-panel)',
    color: 'var(--if-text)'
  },
  '&.cm-focused': {
    outline: '2px solid var(--if-focus)',
    outlineOffset: '-2px'
  },
  '.cm-scroller': {
    fontFamily: 'inherit',
    fontSize: '12px',
    lineHeight: '1.5'
  },
  '.cm-content': {
    padding: '12px 6px'
  },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    color: 'var(--if-subtle)',
    border: 'none',
    paddingLeft: '10px'
  }
});

export function CodeMirrorEditor({
  value,
  onChange,
  theme
}: {
  readonly value: string;
  readonly onChange: (text: string) => void;
  readonly theme: ThemeMode;
}) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      theme={theme === 'dark' ? 'dark' : 'light'}
      height="100%"
      style={{ height: '100%' }}
      basicSetup={{
        foldGutter: false,
        highlightActiveLine: false,
        highlightActiveLineGutter: false
      }}
      extensions={[xml(), EditorView.lineWrapping, appChrome]}
    />
  );
}
