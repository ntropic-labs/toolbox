import type { CSSProperties } from 'react';
import { Toaster as SonnerToaster, type ToasterProps } from 'sonner';

const TOASTER_STYLE = {
  '--normal-bg': 'var(--secondary)',
  '--normal-text': 'var(--foreground)',
  '--normal-border': 'var(--border)',
  '--border-radius': '8px',
  fontFamily: 'inherit'
} as CSSProperties;

export function Toaster(props: ToasterProps) {
  return <SonnerToaster position="bottom-center" closeButton style={TOASTER_STYLE} {...props} />;
}
