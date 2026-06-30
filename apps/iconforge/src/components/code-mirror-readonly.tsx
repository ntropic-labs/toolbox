import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import type { ThemeMode } from '../theme';

const appChrome = EditorView.theme({
  '&': {
    height: '100%',
    backgroundColor: 'var(--card)',
    color: 'var(--foreground)'
  },
  '.cm-scroller': { fontFamily: 'inherit', fontSize: '12px', lineHeight: '1.5' },
  '.cm-content': { padding: '12px 6px' },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    color: 'var(--subtle)',
    border: 'none',
    paddingLeft: '10px'
  }
});

export function CodeMirrorReadonly({
  value,
  theme
}: {
  readonly value: string;
  readonly theme: ThemeMode;
}) {
  return (
    <CodeMirror
      value={value}
      editable={false}
      theme={theme === 'dark' ? 'dark' : 'light'}
      height="100%"
      style={{ height: '100%' }}
      basicSetup={{
        foldGutter: false,
        highlightActiveLine: false,
        highlightActiveLineGutter: false
      }}
      extensions={[javascript({ jsx: true, typescript: true }), EditorView.lineWrapping, appChrome]}
    />
  );
}
