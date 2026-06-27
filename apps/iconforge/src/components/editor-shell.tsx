import { useState, type ReactNode } from 'react';
import { PortalContainerProvider, Toaster } from '@toolbox/ui';
import type { ThemeMode } from '../theme';

export function EditorShell({
  children,
  onToggleTheme,
  theme
}: {
  readonly children: ReactNode;
  readonly onToggleTheme: () => void;
  readonly theme: ThemeMode;
}) {
  const [appElement, setAppElement] = useState<HTMLElement | null>(null);

  return (
    <main className="if-app" data-theme={theme} ref={setAppElement}>
      <header className="if-header">
        <div className="if-brand" aria-label="IconForge open-source icon generator">
          <span className="if-brand-mark" aria-hidden="true">
            <IconforgeMark />
          </span>
          <span className="if-brand-copy">
            <strong>IconForge</strong>
            <span className="if-brand-description">Strike while the icon&rsquo;s hot</span>
          </span>
        </div>

        <div className="if-header-actions">
          <button
            className="if-theme-switch"
            type="button"
            role="switch"
            aria-checked={theme === 'light'}
            aria-label="Color theme"
            onClick={onToggleTheme}
          >
            <span className="if-theme-icon" aria-hidden="true">
              <MoonIcon />
            </span>
            <span className="if-theme-thumb" aria-hidden="true" />
            <span className="if-theme-icon" aria-hidden="true">
              <SunIcon />
            </span>
          </button>
          <a
            className="if-repo-link"
            href="https://github.com/ntropic-labs/toolbox"
            target="_blank"
            rel="noreferrer"
          >
            <GitHubIcon />
            <span>GitHub</span>
          </a>
        </div>
      </header>

      <PortalContainerProvider container={appElement}>{children}</PortalContainerProvider>
      <Toaster theme={theme} />
    </main>
  );
}

function IconforgeMark() {
  return (
    <svg
      className="if-brand-mark-svg"
      viewBox="174.08 174.08 675.84 675.84"
      focusable="false"
      aria-hidden="true"
    >
      <rect
        className="if-logo-bg"
        x="11"
        y="6"
        width="680"
        height="680"
        rx="55"
        fill="#fff"
        transform="translate(161 166)"
      />
      <path
        d="m3 11 6-2.8h11.4q.6 0 .6.6v1.6q0 .6-.6.6h-4.8q-.3 2-2.2 3.1h.6q.7 0 .6.7l-.3 2.2H16q.7 0 .7.7v.9q0 .6-.7.6H8q-.7 0-.7-.6v-.9q0-.7.7-.7h1.7l-.3-2.2q-.1-.7.6-.7h.6Q8.7 13 8.5 11v-.4Z"
        fill="#050609"
        transform="translate(173.872 -26.345) scale(35) rotate(12)"
      />
      <path
        d="M17.8 2.6c0 1.4.6 2 2 2-1.4 0-2 .6-2 2 0-1.4-.6-2-2-2 1.4 0 2-.6 2-2"
        fill="#ff7a66"
        transform="translate(-12 161) scale(40)"
      />
      <path
        d="M17.8 2.6c0 1.4.6 2 2 2-1.4 0-2 .6-2 2 0-1.4-.6-2-2-2 1.4 0 2-.6 2-2"
        fill="#fff"
        transform="translate(343.999 253) scale(20)"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg
      className="if-github-icon"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      focusable="false"
      aria-hidden="true"
    >
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.86 8.37 6.84 9.73.5.09.68-.22.68-.49l-.01-1.9c-2.78.62-3.37-1.22-3.37-1.22-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.56 2.35 1.11 2.92.85.09-.67.35-1.11.63-1.37-2.22-.26-4.55-1.14-4.55-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.98c.85 0 1.7.12 2.5.35 1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.79-4.57 5.05.36.32.68.95.68 1.92l-.01 2.78c0 .27.18.59.69.49A10.15 10.15 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="if-theme-svg" viewBox="0 0 20 20" focusable="false" aria-hidden="true">
      <path d="M13.8 14.9A6.7 6.7 0 0 1 8.2 3.2 7.2 7.2 0 1 0 17 11.8a6.6 6.6 0 0 1-3.2 3.1Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg className="if-theme-svg" viewBox="0 0 20 20" focusable="false" aria-hidden="true">
      <path d="M10 13.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M10 1.7v2.1M10 16.2v2.1M18.3 10h-2.1M3.8 10H1.7M15.9 4.1l-1.5 1.5M5.6 14.4l-1.5 1.5M15.9 15.9l-1.5-1.5M5.6 5.6 4.1 4.1" />
    </svg>
  );
}
