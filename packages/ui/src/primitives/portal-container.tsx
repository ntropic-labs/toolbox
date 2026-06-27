import { createContext, useContext, type ReactNode } from 'react';

// Radix primitives portal their content to document.body by default, which
// escapes the themed app root — so CSS-variable-based tokens (and the font)
// defined on that root don't apply. The app provides its themed root element
// here; portalled primitives (Popover, DropdownMenu, …) render into it instead,
// inheriting tokens, the dark/light switch, and typography.
const PortalContainerContext = createContext<HTMLElement | null>(null);

export function PortalContainerProvider({
  container,
  children
}: {
  readonly container: HTMLElement | null;
  readonly children: ReactNode;
}) {
  return <PortalContainerContext.Provider value={container}>{children}</PortalContainerContext.Provider>;
}

export function usePortalContainer(): HTMLElement | null {
  return useContext(PortalContainerContext);
}
