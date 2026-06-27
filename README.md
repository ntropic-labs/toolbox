# toolbox

`toolbox` is a pnpm + Turbo monorepo for open-source, browser-only tools. The first tool is **iconforge**, a web icon generator for composing shape, text, and SVG layers and exporting them as SVG, PNG, and favicon assets — entirely in the browser, with no server calls.

## Getting started

```sh
pnpm install
pnpm dev
```

Then open the `iconforge` Vite URL printed by the dev server.

## Scripts

```sh
pnpm dev        # run the iconforge dev server
pnpm lint       # eslint across all workspaces
pnpm typecheck  # tsc --noEmit across all workspaces
pnpm test       # vitest across all workspaces
pnpm build      # build all workspaces
```

## Workspace layout

- `apps/iconforge` - React + TypeScript web app.
- `packages/svg-core` - immutable SVG scene model: parsing, serialization, node creation/editing, and undo/redo history.
- `packages/svg-ops` - higher-level SVG operations: optimize/format (SVGO), text-to-path outlining with embedded fonts, and scene-to-component code generation.
- `packages/svg-render` - render a scene to SVG markup, SVG text, or a canvas raster.
- `packages/export-engine` - plan and build export files (SVG, PNG sizes, favicon) and package them as a ZIP.
- `packages/ui` - shared React UI primitives (shadcn/Radix based).

## iconforge

### Compose

- Shapes: rectangle/square and circle.
- Text layers using browser fonts or uploaded fonts.
- Uploaded SVG files as composable layers.
- Fonts: uploaded `.ttf`, `.otf`, `.woff`, `.woff2`, or remote URLs (direct font files or Google Fonts CSS links).

### Edit

- Layer ordering, visibility, delete, and duplicate.
- Opacity, scale, rotation, and X/Y positioning.
- Undo/redo, local-storage autosave, and keyboard shortcuts for delete and undo/redo.

### Preview & code

- Preview the rendered icon, or view and copy it as SVG, a React component, or a React Native component.

### Export

- SVG.
- PNG at selectable sizes (16-1024 px; defaults 1024/512/192).
- Favicon (`.ico`), optional.
- Multiple files download together as a ZIP.

All generation runs in the browser - no server calls are required. Remote font URLs are loaded by the browser; direct font-file URLs must allow CORS, while Google Fonts CSS links load through normal browser stylesheet loading.

## License

BSD 3-Clause. See [LICENSE](LICENSE).
