# AGENTS.md

## Commands

- Use `pnpm` only; the repo pins `pnpm@11.5.1` and requires Node `>=20.11.0`.
- Install with `pnpm install`; start the app with `pnpm dev`, which runs only `apps/iconforge` via Vite.
- Root verification commands are `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build`.
- Turbo makes `lint`, `typecheck`, and `test` depend on upstream package `build` tasks, so prefer root commands for dependency-aware checks after cross-package changes.
- Focus a package with `pnpm --filter iconforge test` or `pnpm --filter @toolbox/svg-core typecheck`.
- Run one test file with `pnpm --filter iconforge exec vitest run src/storage.test.ts` or `pnpm --filter @toolbox/svg-core exec vitest run src/index.test.ts`.
- Format with `pnpm format`; check formatting with `pnpm format:check`.

## Workspace Boundaries

- `apps/iconforge` is the React/Vite product app; keep app-specific UI, hooks, storage, and browser integration there.
- `packages/svg-core` owns the immutable SVG scene model, parsing, serialization, node edits, and undo/redo history.
- `packages/svg-render` owns safe preview/raster serialization; it strips unsafe/fetchable external resources and only adds `data-fid` for preview mapping.
- `packages/svg-ops` owns SVGO browser optimization, SVG-to-component generation, font parsing, and text outlining.
- `packages/export-engine` owns export planning/building, target registries under `src/targets`, PNG/favicon/SVG output, insets, and ZIP packaging.
- `packages/ui` owns shared shadcn/Radix primitives and exports them from `src/index.ts`; app code should import primitives from `@toolbox/ui`.
- Packages export source entrypoints from `src/index.ts`; do not add or import `dist` artifacts.

## Browser-Only Constraints

- This is a browser-only tools repo; do not add backend services, server APIs, or Node-only runtime paths unless the user explicitly asks.
- Export and SVG logic must remain deterministic and browser-compatible; `packages/svg-ops` intentionally imports `svgo/browser`.
- Iconforge persists projects in `localStorage`; tests usually install browser API shims locally instead of relying on global Vitest setup.

## Testing Notes

- Tests are colocated as `*.test.ts` and `*.test.tsx`; each package script uses `vitest run --passWithNoTests`.
- There is no shared Vitest config/setup file. Stub APIs such as `localStorage`, `Image`, `URL.createObjectURL`, fonts, or IndexedDB in the specific tests that need them.
- React component tests currently prefer `react-dom/server` static markup assertions over a DOM testing-library setup.

## TypeScript And Style

- TypeScript is strict with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`; handle possibly missing array entries explicitly.
- ESLint enforces type-aware rules and `@typescript-eslint/consistent-type-imports`; prefix intentionally unused args/vars with `_`.
- Prettier uses single quotes, no trailing commas, and `printWidth: 100`.

## UI Guidance

- Read `DESIGN.md` and `PRODUCT.md` before changing Iconforge UI.
- Preserve the "Maintainer's Workbench" direction: dense mono UI, flat graphite panels, one-pixel borders, ember only for actions/selection/state, brass focus rings, and no toy-generator or SaaS-marketing treatments.
- `apps/iconforge/src/styles.css` is the app CSS entrypoint; it imports `@toolbox/ui/styles/tokens.css` and includes Tailwind v4 `@source` for shared UI primitives.
- `packages/ui/src/styles/tokens.css` maps shadcn semantic variables onto Iconforge `--if-*` tokens; avoid introducing a second palette inside primitives.
- shadcn config lives at `packages/ui/components.json` with aliases pointing at `@toolbox/ui/*`; add shared primitives in `packages/ui/src/primitives` and export public ones from `packages/ui/src/index.ts`.
