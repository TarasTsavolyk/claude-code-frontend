---
paths:
  - "{src,app,lib,resources/js,*/src,*/app,*/*/src,*/*/app}/**/*.{vue,ts,tsx,js,jsx}"
  - "{components,composables,layouts,middleware,pages,plugins,server,stores,utils}/**/*.{vue,ts,js}"
  - "{vite,nuxt}.config.*"
  - "index.html"
---

# Security

Security is part of "done", and the bar is secure-by-default at authoring time — not a review that catches it later. Anchored to the **OWASP Top 10:2025**; per-finding OWASP/CWE mappings are the `security-scanner` job, not repeated per bullet here. The browser is hostile territory: **the server is the only trust boundary**, so everything here is defense-in-depth — never the sole control. For every untrusted-data sink you touch, confirm it is escaped, sanitized, or allow-listed before merge.

## The cardinal rule — the client never enforces security
- Route guards (`beforeEach`/`beforeEnter`), `v-if`-on-role, and disabled buttons are **UX only** — trivially bypassed via devtools or direct API calls. The server authorizes **every** request independently.
- Never trust client-supplied values as an authorization input — JWT claims read from `localStorage`, query params, `postMessage` data. Re-check server-side.
- Don't ship what the user may not see: no admin-only routes/components/data loaded for unauthorized users. Hiding ≠ protecting.

## Injection / XSS
Vue auto-escapes `{{ }}` and attribute bindings; these escape hatches do not.
- **Raw-HTML sinks** — `v-html`, render-function/JSX `innerHTML` (`h('div', { innerHTML })`), a custom directive that writes `el.innerHTML`, or manual `innerHTML`/`outerHTML`/`insertAdjacentHTML`: never bind untrusted (user or remote) HTML raw. Prefer `{{ }}`/`textContent`; if raw HTML is unavoidable, sanitize with **DOMPurify** first.
- **`<component :is>`, dynamic `import()`, `eval`, `new Function`, string `setTimeout`/`setInterval`** — never fed by user/remote data; that is arbitrary code execution. Resolve only through a hardcoded allow-list/registry of known components/loaders.
- **`:href`, `:src`, `router.push`, `window.location`** — Vue escapes the value but not the scheme. Allow-list safe schemes (`/^(https?:|mailto:|tel:)/i`); block `javascript:`/`data:`. Validate redirect targets by parsing with `new URL()` against an allow-list, never substring matching (open redirect).
- **`v-bind="obj"` / fall-through `v-bind="$attrs"`** — spreading an untrusted object binds every key, including `innerHTML` and `on*` handlers. Bind only an explicit, named set of validated attributes.
- **Template/DOM refs** — assigning `el.innerHTML` from a `useTemplateRef` node leaves Vue's escaping; use `textContent` or DOMPurify.
- **Translated messages (vue-i18n)** — don't render `t()`/`$t()` output with `v-html` when a message can embed untrusted data (a known i18n XSS vector); use the `<i18n-t>` component with slots for rich text (see `i18n.md`).
- **Prototype pollution** — guard `__proto__`/`constructor`/`prototype` keys in any recursive merge/clone or query-string parse; use `Object.create(null)`/`Map` and schema-validate (Zod).
- **CSTI** — never compile a runtime template from user input; prefer the runtime-only build.

## Secrets & the client bundle
- Everything in the bundle is public. Only vars explicitly marked client-exposed belong in client code — `VITE_`-prefixed in Vite, `runtimeConfig.public` in Nuxt (`VITE_API_BASE_URL`, publishable `pk_…` keys). Real secrets carry no client prefix, stay server-side, and are reached through an API (mechanics in `config.md`).
- Never hardcode or commit credentials; keep `.env*.local` git-ignored. Don't put tokens/PII in URLs or query strings (they leak via `Referer`, history, logs, analytics), error messages, or client telemetry.
- Disable production source maps (`build.sourcemap: false`, or `'hidden'` for private upload to an error tracker) so original source and logic aren't shipped.
- Don't enable Vue Devtools in production (`__VUE_PROD_DEVTOOLS__`) — it exposes component state and Pinia stores to anyone.

## Tokens & session
- Prefer session tokens in **`httpOnly` + `Secure` + `SameSite` cookies** (unreadable by JS) over `localStorage`/`sessionStorage` — Web Storage is readable by any script, so one XSS exfiltrates the session.
- Never persist tokens via a Pinia/Vuex persistence plugin, serialize them into SSR HTML, or log them. Stores hold non-sensitive profile data only.
- **CSRF (cookie sessions only)** — with ambient cookies, set `SameSite=Lax/Strict` and add an anti-CSRF token (double-submit or synchronizer) in a custom request header from the `api/` layer. Bearer-token (`Authorization` header) SPAs are largely immune.

## Browser security controls
- **CSP** — strict `script-src` (nonce/hash, no `unsafe-inline`/`unsafe-eval`, no wildcard hosts) plus `frame-ancestors` (clickjacking), `base-uri`, `object-src 'none'`. Account for Vite's dev-vs-prod inline scripts.
- **Subresource Integrity** — every third-party `<script>`/CDN asset gets `integrity="sha384-…"` + `crossorigin` and a pinned version, or is self-hosted/bundled. Minimize third-party scripts; each runs with full DOM access (Magecart).
- **Transport** — HTTPS for all subresources (no mixed content), `Strict-Transport-Security`, `upgrade-insecure-requests`, `Referrer-Policy`, `X-Content-Type-Options: nosniff`. Untrusted iframes get `sandbox`.
- **`:style`** — bind object syntax with vetted properties; never a raw user-supplied string (CSS injection / overlay-based clickjacking).

## Cross-window & network
- **`postMessage`** — exact-match `event.origin` against an allow-list (never `indexOf`/substring); validate the message shape; never target `'*'` for sensitive data.
- **CORS** is a server control, but from the client: never send credentialed (`credentials: 'include'`) cross-origin requests to a permissive API, and flag a backend that reflects `Origin` together with `Access-Control-Allow-Credentials: true`.

## Supply chain
- Question every dependency; pin versions and commit the lockfile. Run `<pm> audit`, treat known high/critical vulns as blockers, and watch transitive packages. Automate this in CI, not as an optional manual step.

> Server-rendering (Nuxt or a custom renderer)? `ssr.md` covers the sinks that only exist there.
