---
paths:
  - "{src,app,lib,resources/js,*/src,*/app,*/*/src,*/*/app}/**/*.{ts,js}"
  - "{vite,nuxt,vitest}.config.*"
  - ".env*"
---

# Configuration & Environment

One typed, validated source of config. No hardcoded hosts, keys, or magic environment reads scattered across the app.

## Validate once, import everywhere
- Parse and validate env at startup in a single module (e.g. `config.ts`): assert required vars are present, coerce types, and export a typed `config` object. Fail fast with a clear message if something required is missing — don't discover it at runtime three screens in.
- The rest of the app imports `config`, not the raw env object. That keeps reads typed, centralized, and mockable.
- Document every required var in a committed `.env.example` — it's the only place a newcomer learns what the app needs to boot. Keep it **yours to edit**: `settings.json` denies reads and writes across `.env*` so a real secret can't leak or be clobbered, and permission rules can't carve out an exception. So when a var is added, say which line `.env.example` needs; don't try to write the file.

## Which mechanism (they are not interchangeable)
- **Vite SPA** — `import.meta.env`; only **`VITE_`-prefixed** vars reach the client, and everything that reaches it is **public** (see `security.md`). Never `process.env` in client code.
- **Nuxt** — `runtimeConfig`, read via `useRuntimeConfig()`; only `runtimeConfig.public` (overridable as `NUXT_PUBLIC_*`) reaches the client. `import.meta.env` cannot read `runtimeConfig`, so don't reach for the Vite mechanism in a Nuxt app.

## Build-time vs runtime
- `import.meta.env` is **inlined at build** — a value baked into the bundle can't change per deployment. Anything that must vary per environment without a rebuild comes from a runtime source: an API, a served `config.json`, or Nuxt's `runtimeConfig` (env-overridable at boot).
