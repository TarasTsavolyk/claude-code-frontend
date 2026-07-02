---
name: from-figma
description: Turn a Figma design into project components — pull the design via the Figma MCP, map it onto design tokens and shared/ primitives, build per scaffold conventions, then verify against the design. Use when implementing a screen or component from a Figma link.
---

# From Figma to component

Requires the Figma MCP server (connect via `/mcp`). Without it, ask for exported specs/screenshots and continue from step 2.

1. **Pull the design.** Fetch the linked node — design context plus a screenshot. Read layout, spacing, type, color variables, variants, and any interaction notes; don't eyeball a thumbnail.
2. **Map, don't transplant.** Translate raw values onto the project's design tokens (`styling.md`): nearest token wins; a Figma hex that matches no token is a finding to raise, not a value to hardcode. Match design components against `shared/` and the UI kit before building anything new — reuse beats rebuild (`architecture.md`).
3. **Plan the split from the design's structure.** Repeated regions → leaf components; overlays compose the shared overlay primitive; Figma variants → a `variant`/`mode` prop or separate components per the Component API rules (`architecture.md`).
4. **Build** per `/scaffold-component`. The mock shows the happy path — implement loading/error/empty too (`data-fetching.md`), and the a11y baseline a mock can't show (`accessibility.md`).
5. **Verify against the design.** Render the result (dev server / browser tooling) side by side with the Figma screenshot: spacing rhythm, type scale, states, responsive behavior at the design's breakpoints. Report deliberate deviations (token rounding, added states) explicitly.
