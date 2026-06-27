---
name: Iconforge
description: Browser-only icon generator for composing and exporting platform app icons.
colors:
  bg: '#050609'
  bg-2: '#090d14'
  panel: '#11151d'
  panel-2: '#171c25'
  panel-3: '#202631'
  border: '#2a303b'
  border-strong: '#3a414e'
  text: '#f4f0ec'
  muted: '#aaa39c'
  subtle: '#777f8b'
  primary: '#ff7a66'
  primary-hover: '#ff927f'
  primary-text: '#170706'
  gold: '#e8b84a'
  danger: '#d85d6a'
  input: '#0c1118'
  canvas-bg: '#0b0f16'
typography:
  title:
    fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace'
    fontSize: '22px'
    fontWeight: 700
    lineHeight: 1
    letterSpacing: '-0.05em'
  body:
    fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace'
    fontSize: '13px'
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace'
    fontSize: '12px'
    fontWeight: 400
    lineHeight: 1
rounded:
  xs: '6px'
  sm: '7px'
  md: '8px'
  lg: '9px'
  xl: '10px'
spacing:
  xxs: '4px'
  xs: '6px'
  sm: '8px'
  md: '10px'
  lg: '12px'
  xl: '14px'
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.primary-text}'
    rounded: '{rounded.md}'
    padding: '6px 10px'
    height: '32px'
  button-secondary:
    backgroundColor: '{colors.panel-2}'
    textColor: '{colors.text}'
    rounded: '{rounded.md}'
    padding: '6px 10px'
    height: '32px'
  input:
    backgroundColor: '{colors.input}'
    textColor: '{colors.text}'
    rounded: '{rounded.md}'
    height: '42px'
---

# Design System: Iconforge

## 1. Overview

**Creative North Star: "The Maintainer’s Workbench"**

Iconforge uses a compact dark workshop surface: near-black page chrome, graphite panels, thin steel borders, ember primary actions, and a brass focus accent. The system should feel like a trusted open-source tool you can keep beside a code editor while preparing release assets.

The visual language is intentionally flat, bordered, and tactile. Depth comes from tonal panel steps, exact strokes, hover responses, and strong focus rings, not decorative shadows or brand theater. Controls are dense because the job is precise, but labels stay readable and the preview remains the visual anchor.

It explicitly rejects toy generator feel, heavy design-suite complexity, and SaaS marketing gloss. If a treatment does not help users compose, inspect, or export icons, it does not belong in this interface.

**Key Characteristics:**

- Dense, mono-forward product UI with one type family.
- Dark charcoal shell with ember and brass accents used sparingly.
- Flat panels, thin borders, and short state transitions.
- Editor-first layout: preview large, controls compact, export always legible.

## 2. Colors

The Charcoal Forge palette is a restrained product palette: deep neutral surfaces carry most of the screen, ember marks primary creation actions, and brass marks focus or safe-area guidance.

### Primary

- **Ember Primary** (`primary`): Used for the main creation action, selected layer borders, active inline toggles, and important state emphasis. It must stay rare enough to mean action or selection.
- **Ember Hover** (`primary-hover`): The brighter hover state for primary actions.
- **Soot on Ember** (`primary-text`): Text color for ember-filled controls.

### Secondary

- **Brass Focus** (`gold`): Used for keyboard focus, safe-area guides, and theme switch light-state emphasis. It is functional, not decorative.

### Tertiary

- **Delete Red** (`danger`): Used only for destructive actions and disabled destructive affordances.

### Neutral

- **Blackened Shell** (`bg`): The app background and page-level chrome.
- **Charcoal Shelf** (`panel`): Main panels, dock, canvas frame, and export strip.
- **Raised Graphite** (`panel-2`): Buttons, brand mark, and secondary surfaces.
- **Bright Graphite** (`panel-3`): Hover and active tonal lift.
- **Steel Border** (`border`) and **Bright Steel Border** (`border-strong`): Default and hover strokes.
- **Warm Ink** (`text`): Primary text on dark surfaces.
- **Ash Muted** (`muted`) and **Blue Ash Subtle** (`subtle`): Secondary labels, helper text, placeholders, and low-emphasis status.
- **Deep Input Well** (`input`): Form-control background.
- **Canvas Void** (`canvas-bg`): The non-transparent icon canvas stage.

### Named Rules

**The Ember Is a Verb Rule.** The primary accent is reserved for actions, selection, and state. Never use it as filler decoration.

**The Border Carries Depth Rule.** Panels and controls separate with one-pixel strokes and tonal changes. Shadows are reserved for temporary overlays.

## 3. Typography

**Display Font:** JetBrains Mono with system monospace fallbacks.
**Body Font:** JetBrains Mono with system monospace fallbacks.
**Label/Mono Font:** JetBrains Mono with system monospace fallbacks.

**Character:** The single-family mono system reinforces the open-source workshop posture and keeps dense controls aligned. Hierarchy comes from weight, size, spacing, and color, not from mixing display faces.

### Hierarchy

- **Title** (700, `22px`, `1`, `-0.05em`): Used for the Iconforge wordmark and the strongest app identity text.
- **Headline** (700, `15px`, tight): Used for export titles and compact section emphasis.
- **Section Title** (700, `14px`, `1.2`): Used for panel and control-section headings.
- **Body** (400, `13px`, `1.45`): Used for helper text, dock notes, buttons, and compact prose.
- **Label** (400, `12px`, `1`): Used for inline field labels, layer status, and tertiary metadata. Labels are sentence case, not tracked uppercase.

### Named Rules

**The One Mono Rule.** Do not introduce a second display or body family into the product UI. Density and trust come from one well-controlled type system.

## 4. Elevation

Iconforge is flat by default. Depth is conveyed through panel color steps, one-pixel borders, radius, and state changes. The only visible shadow vocabulary in the current system is the color popover shadow, where temporary overlap needs separation from the dock.

### Shadow Vocabulary

- **Popover Lift** (`0 8px 18px rgb(0 0 0 / 28%)`): Use only for temporary overlays such as color pickers that sit above controls.

### Named Rules

**The Resting Surface Rule.** Resting panels never float. If a surface is not overlapping another control, it uses tonal layering and borders, not shadow.

## 5. Components

### Buttons

- **Shape:** Gently squared controls with an 8px radius and a minimum 32px height.
- **Primary:** Ember background with soot text, one-pixel ember border, and compact `6px 10px` padding.
- **Hover / Focus:** Hover brightens the surface or border over 120ms. Focus uses a 2px brass outline with a 2px offset.
- **Secondary / Ghost / Danger:** Secondary buttons use raised graphite with warm ink. Ghost buttons remove the border and use muted text. Danger buttons keep transparent rest state and use red for text and border.

### Cards / Containers

- **Corner Style:** Workbench panels use a 10px radius; nested controls use 6px to 9px depending on size.
- **Background:** Main panels use charcoal shelf, while buttons and hover states climb through raised graphite and bright graphite.
- **Shadow Strategy:** No resting card shadows. Only overlapping popovers use shadow.
- **Border:** One-pixel steel strokes are required for panel and control separation.
- **Internal Padding:** Panels use compact 10px to 12px padding. The app shell uses 14px desktop padding and 10px on narrow screens.

### Inputs / Fields

- **Style:** Inputs are 42px tall with deep input wells, one-pixel steel border, 8px radius, and warm ink text.
- **Label Treatment:** Field labels sit inside the input area as absolute leading labels, using muted 12px mono text.
- **Focus:** Inputs share the global 2px brass focus outline and preserve the control border.
- **Disabled:** Disabled fields reduce opacity and block pointer interaction rather than changing shape.

### Navigation

- **Header:** The header is a two-column app bar with a 40px geometric mark, 22px wordmark, short descriptor, theme switch, and GitHub link.
- **Dock:** The control dock is a right-side panel with document, layer, create, adjust, and export surfaces. On narrow screens, it collapses below the preview in a single column.
- **Layer Rows:** Active rows use an ember border and a light ember tint. Inactive rows stay transparent until hover.

### Signature Component

The canvas preview is the visual anchor: a square frame inside the preview column, bordered with steel, padded responsively, and backed by either the canvas void or a transparent checkerboard. Do not compete with it using decorative chrome.

## 6. Do's and Don'ts

### Do:

- **Do** keep the preview large and centered; controls should support the asset, not visually outrank it.
- **Do** use `primary` only for action, selection, and state as required by The Ember Is a Verb Rule.
- **Do** keep labels sentence case and direct: “Download ZIP”, “Add font URL”, “Unlock to delete”.
- **Do** preserve visible keyboard focus with the brass 2px outline.
- **Do** use one-pixel borders and tonal panel steps before introducing a shadow.

### Don't:

- **Don't** create toy generator feel with oversized playful controls, novelty graphics, weak density, or output that looks unreliable.
- **Don't** introduce heavy design-suite complexity with excessive chrome, buried panels, or terminology beyond the current icon-export job.
- **Don't** use SaaS marketing gloss, hero metrics, decorative badges, gradient text, or buzzword-driven copy.
- **Don't** add side-stripe borders, gradient text, glass cards, or repeated card grids.
- **Don't** add decorative motion. Product motion must convey state and must include reduced-motion behavior.
