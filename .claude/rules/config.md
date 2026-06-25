---
paths:
  - "src/**/*.ts"
  - "src/**/*.js"
  - "vite.config.*"
  - ".env*"
---

# Configuration & Environment

One typed, validated source of config. No hardcoded hosts, keys, or magic environment reads scattered across the app.

## Source of truth
- All environment config comes from `import.meta.env` (Vite) — never `process.env` in client code, never a hardcoded URL/key inline.
- Only **`VITE_`-prefixed** vars are exposed to the client bundle, and everything exposed is **public** (see `security.md`). Real secrets have no `VITE_` prefix and stay server-side, reached through an API.

## Validate once, import everywhere
- Parse and validate env at startup in a single module (e.g. `config.ts`): assert required vars are present, coerce types, and export a typed `config` object. Fail fast with a clear message if something required is missing — don't discover it at runtime three screens in.
- The rest of the app imports `config`, not `import.meta.env` directly. That keeps reads typed, centralized, and mockable.

## Files & modes
- `.env` (shared, committable defaults) · `.env.local` (machine overrides, **git-ignored**) · `.env.[mode]` for `development`/`production`/test. Never commit `.env*.local` or any file with real secrets.
- Document every required var in a committed `.env.example`. Use `import.meta.env.MODE`/`DEV`/`PROD` for mode branches.
- **Build-time vs runtime:** `import.meta.env` is inlined at build. Values that must change per deployment without a rebuild come from a runtime source (an API or a served `config.json`), not baked-in vars.

## Feature flags
- Centralize flags in the typed config; default new flags **off**. Remove a flag once its rollout is complete — stale flags are dead branches.

## Verify
- No `process.env` or raw inline secrets in client code; no scattered `import.meta.env.VITE_*` reads outside the config module.
- Required vars are validated at startup and documented in `.env.example`.
