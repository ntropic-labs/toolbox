import type { ComponentType } from 'react';
import type { ThemeMode } from '../theme';

export type CodeEditorComponent = ComponentType<{
  readonly value: string;
  readonly onChange: (text: string) => void;
  readonly theme: ThemeMode;
}>;

export type ReadonlyEditorComponent = ComponentType<{
  readonly value: string;
  readonly theme: ThemeMode;
}>;

let cachedEditor: CodeEditorComponent | null = null;
let cachedReadonly: ReadonlyEditorComponent | null = null;

export const getCodeEditor = (): CodeEditorComponent | null => cachedEditor;
export const getReadonlyEditor = (): ReadonlyEditorComponent | null => cachedReadonly;

export function loadCodeEditor(): Promise<CodeEditorComponent> {
  if (cachedEditor) return Promise.resolve(cachedEditor);
  return import('./code-mirror-editor').then((module) => (cachedEditor = module.CodeMirrorEditor));
}

export function loadReadonlyEditor(): Promise<ReadonlyEditorComponent> {
  if (cachedReadonly) return Promise.resolve(cachedReadonly);
  return import('./code-mirror-readonly').then(
    (module) => (cachedReadonly = module.CodeMirrorReadonly)
  );
}

export const preloadCodeEditor = (): void => void loadCodeEditor();
export const preloadComponentEditor = (): void => void loadReadonlyEditor();
