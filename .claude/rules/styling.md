---
paths:
  - "**/*.vue"
  - "**/*.css"
---

# Styling — Tailwind CSS 4

## Tokens over magic values
- Tailwind 4 is CSS-first: theme tokens are declared in `@theme { ... }` in the CSS entry, not in a JS config.
- Use semantic tokens (`bg-surface`, `text-muted`, `text-brand`) rather than raw palette values scattered in markup.
- Stick to the spacing/size/radius scale. No arbitrary values like `mt-[13px]` unless there is a documented reason.
- Color, spacing, typography and radii changes happen in `@theme`, in one place — not per-component.

## Composition
- Extract repeated utility clusters into a component, not into `@apply` soup. Reserve `@apply` for genuinely shared primitives.
- Mobile-first: base styles unprefixed, layer up with `sm: md: lg:`.
- Prefer `flex`/`grid` utilities over absolute positioning for layout.

## Theming & motion
- Dark mode via the project's chosen strategy (class or `prefers-color-scheme`) — be consistent; never hardcode both palettes inline.
- All non-trivial animation respects `motion-reduce:` / `prefers-reduced-motion`.
- No inline `style=""` for things Tailwind can express. Inline style is only for truly dynamic computed values.

## Don't
- Mix raw hex colors with token-based ones in the same view.
- Ship one-off utility values that duplicate an existing token at a slightly different number.
