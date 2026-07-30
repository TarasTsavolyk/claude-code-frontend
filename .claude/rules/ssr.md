---
paths:
  - "nuxt.config.*"
  - "{server,app/server}/**/*.{ts,js}"
  - "{src,app,*/src,*/app}/**/*.server.{ts,js}"
  - "{src,app,*/src,*/app}/entry-server.{ts,js}"
---

# Server Rendering (SSR / SSG)

Only relevant when the project server-renders — Nuxt, or a custom renderer. `/prune` removes this rule by default for
pure client-side SPAs.

## Escaping across the server/client seam
- Vue's auto-escaping covers **component templates only**. Anything you interpolate into the HTML shell yourself — `<title>`, meta tags, hand-written markup — is unescaped and is an injection sink.
- Serialize injected state with a `</script>`-safe serializer (`devalue`, `serialize-javascript`), never raw `JSON.stringify`: a string containing `</script>` closes the tag and everything after it is markup.

## Server-only data stays server-only
- Code that runs on both sides can read server secrets on the server and leak them into the payload. Keep secret reads in server-only modules (`server/`, `*.server.ts`, Nuxt's `runtimeConfig` private keys) and never pass them through the serialized state.
- Request-scoped state must not become module-scoped: a `ref` or a store created at module top level is shared across every request on the server. Create per-request state inside the app factory / setup, not at import time.

## Hydration
- The server and client must render the same thing from the same inputs. Anything that differs by nature — `Date.now()`, `Math.random()`, `window`, locale from the browser — belongs behind an `onMounted`/client-only boundary, or it produces a hydration mismatch.
- A hydration mismatch is a bug, not a warning to silence.
