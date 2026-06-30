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
    <main
      className="if-app grid min-h-screen grid-rows-[auto_minmax(0,1fr)] gap-3 max-[760px]:gap-[10px] overflow-x-hidden bg-background p-[14px] text-foreground max-[760px]:p-[10px]"
      data-theme={theme}
      ref={setAppElement}
    >
      <header className="mx-auto grid min-h-[68px] w-[min(100%,1180px)] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border py-[10px] max-[760px]:grid-cols-[1fr] max-[760px]:items-start">
        <div
          className="inline-flex min-w-0 items-center gap-3"
          aria-label="IconForge open-source icon generator"
        >
          <span className="block h-10 w-10 flex-none" aria-hidden="true">
            <IconforgeMark />
          </span>
          <span className="grid min-w-0 gap-[3px]">
            <strong className="text-[26px] leading-none tracking-[-0.05em] text-foreground">
              IconForge
            </strong>
            <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[12px] leading-[1.3] text-muted-foreground">
              Strike while the icon&rsquo;s hot
            </span>
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 max-[760px]:justify-start max-[380px]:flex-col max-[380px]:items-stretch">
          <button
            className="relative inline-grid w-[70px] min-h-[38px] cursor-pointer grid-cols-2 items-center rounded-[9px] border border-border bg-secondary p-1 text-muted-foreground outline-none hover:border-border-strong hover:bg-accent focus-visible:[outline:2px_solid_var(--ring)] focus-visible:outline-offset-2"
            type="button"
            role="switch"
            aria-checked={theme === 'light'}
            aria-label="Color theme"
            onClick={onToggleTheme}
          >
            <span
              className="relative z-[1] grid place-items-center leading-none [[aria-checked=false]_&]:text-primary-foreground"
              aria-hidden="true"
            >
              <MoonIcon />
            </span>
            <span
              className="absolute bottom-1 left-1 top-1 w-[30px] rounded-[7px] border border-primary bg-primary transition-[transform,background-color,border-color] duration-[140ms] [[aria-checked=true]_&]:translate-x-[32px] [[aria-checked=true]_&]:border-gold [[aria-checked=true]_&]:bg-gold"
              aria-hidden="true"
            />
            <span
              className="relative z-[1] grid place-items-center leading-none [[aria-checked=true]_&]:text-primary-foreground"
              aria-hidden="true"
            >
              <SunIcon />
            </span>
          </button>
          <a
            className="inline-flex min-h-[38px] items-center gap-[7px] rounded-[9px] border border-border px-3 py-2 text-[13px] text-muted-foreground no-underline outline-none hover:border-border-strong hover:text-foreground focus-visible:[outline:2px_solid_var(--ring)] focus-visible:outline-offset-2"
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
      className="block h-full w-full"
      viewBox="174.08 174.08 675.84 675.84"
      focusable="false"
      aria-hidden="true"
    >
      <rect
        className="hidden [[data-theme=dark]_&]:block"
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
      className="h-4 w-4 flex-none fill-current"
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
    <svg
      className="h-[15px] w-[15px] fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.8] [&_path:first-child]:fill-current"
      viewBox="0 0 20 20"
      focusable="false"
      aria-hidden="true"
    >
      <path d="M13.8 14.9A6.7 6.7 0 0 1 8.2 3.2 7.2 7.2 0 1 0 17 11.8a6.6 6.6 0 0 1-3.2 3.1Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      className="h-[15px] w-[15px] fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.8] [&_path:first-child]:fill-current"
      viewBox="0 0 20 20"
      focusable="false"
      aria-hidden="true"
    >
      <path d="M10 13.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M10 1.7v2.1M10 16.2v2.1M18.3 10h-2.1M3.8 10H1.7M15.9 4.1l-1.5 1.5M5.6 14.4l-1.5 1.5M15.9 15.9l-1.5-1.5M5.6 5.6 4.1 4.1" />
    </svg>
  );
}
