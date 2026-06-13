---
paths:
  - "src/**/*.vue"
  - "src/**/*.css"
  - "src/**/*.scss"
  - "src/**/*.sass"
  - "src/**/*.module.css"
---

# Styling

Default approach: **Tailwind CSS 4** (CSS-first `@theme` tokens). The principles below hold for any styling system — if the project uses Sass/SCSS, CSS Modules, or scoped `<style>`, apply the equivalent mechanic from *Your styling approach*.

## Principles (any approach)
- **Design tokens, not magic values** — reference semantic/named tokens (`surface`, `muted`, `brand`), never raw palette or off-scale numbers in markup.
- **One source of truth** for color/spacing/type/radius tokens — change them in one place, not per-component.
- Stick to the spacing/size/radius scale; no one-off values (a stray `13px`) without a documented reason. Don't mix raw hex with tokenized colors or ship near-duplicates that shadow an existing token.
- **Extract repeated style patterns into a component** — reserve shared-style mechanisms for genuine primitives; don't build `@apply`/`@mixin`/`composes` soup.
- **Mobile-first**: unprefixed base styles, layered up at larger breakpoints.
- Reusable components respond to their **container** (`@container` queries), not the viewport; reserve viewport breakpoints (`sm: md: lg:`) for page-level layout.
- Prefer `flex`/`grid` over absolute positioning for layout.
- One dark-mode strategy (class or `prefers-color-scheme`), applied consistently — never inline both palettes.
- Honor `prefers-reduced-motion` for all non-trivial animation.
- No inline `style=""` for what your classes/stylesheet can express; reserve it for genuinely dynamic computed values.

## Your styling approach
- **Tailwind 4 (default)** — tokens in `@theme { … }` in the CSS entry; semantic utilities (`bg-surface`, `text-muted`); responsive `sm: md: lg:`; `motion-reduce:`; reserve `@apply` for shared primitives.
- **Sass/SCSS** — tokens as variables/maps (`$color-surface`, `$space-*`) in `variables.scss`/`_tokens.scss`, shared via `@use`; reuse via `@mixin`/`@include` or `%placeholder`/`@extend`; responsive via `@media (min-width …)`.
- **CSS Modules / scoped `<style>`** — tokens as `:root { --color-surface; --space-* }` custom properties used via `var(--token)`; reuse via `composes` (Modules) or a shared component; reduced-motion via `@media (prefers-reduced-motion: reduce)`.
