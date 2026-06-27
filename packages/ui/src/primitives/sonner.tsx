import type { CSSProperties } from 'react';
import { Toaster as SonnerToaster, type ToasterProps } from 'sonner';

const TOASTER_STYLE = {
  '--normal-bg': 'var(--if-panel-2)',
  '--normal-text': 'var(--if-text)',
  '--normal-border': 'var(--if-border)',
  '--border-radius': '8px',
  fontFamily: 'inherit'
} as CSSProperties;

export function Toaster(props: ToasterProps) {
  return <SonnerToaster position="bottom-center" closeButton style={TOASTER_STYLE} {...props} />;
}
