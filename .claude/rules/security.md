---
paths:
  - "src/**/*.vue"
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "src/**/*.js"
  - "src/**/*.jsx"
  - "vite.config.*"
  - "index.html"
---

# Security

Security is part of "done". Anchored to the **OWASP Top 10:2025** (the current edition, superseding 2021); CWE ids are given where they pin a concrete sink. The browser is hostile territory: **the server is the only trust boundary**, so everything here is defense-in-depth — never the sole control.

## The cardinal rule — the client never enforces security (A01 / CWE-602)
- Route guards (`beforeEach`/`beforeEnter`), `v-if`-on-role, and disabled buttons are **UX only** — trivially bypassed via devtools or direct API calls. The server authorizes **every** request independently.
- Never trust client-supplied values as an authorization input — JWT claims read from `localStorage`, query params, `postMessage` data. Re-check server-side.
- Don't ship what the user may not see: no admin-only routes/components/data loaded for unauthorized users. Hiding ≠ protecting.

## Injection / XSS (A05 / CWE-79)
Vue auto-escapes `{{ }}` and attribute bindings; these escape hatches do not.
- **Raw-HTML sinks** — `v-html`, render-function/JSX `innerHTML` (`h('div', { innerHTML })`), a custom directive that writes `el.innerHTML`, or manual `innerHTML`/`outerHTML`/`insertAdjacentHTML`: never bind untrusted (user or remote) HTML raw. Prefer `{{ }}`/`textContent`; if raw HTML is unavoidable, sanitize with **DOMPurify** first.
- **`<component :is>`, dynamic `import()`, `eval`, `new Function`, string `setTimeout`/`setInterval`** — never fed by user/remote data; that is arbitrary code execution (CWE-94/95). Resolve only through a hardcoded allow-list/registry of known components/loaders.
- **`:href`, `:src`, `router.push`, `window.location`** — Vue escapes the value but not the scheme. Allow-list safe schemes (`/^(https?:|mailto:|tel:)/i`); block `javascript:`/`data:`. Validate redirect targets by parsing with `new URL()` against an allow-list, never substring matching (open redirect → A01 / CWE-601).
- **`v-bind="obj"` / fall-through `v-bind="$attrs"`** — spreading an untrusted object binds every key, including `innerHTML` and `on*` handlers. Bind only an explicit, named set of validated attributes.
- **Template/DOM refs** — assigning `el.innerHTML` from a `useTemplateRef` node leaves Vue's escaping; use `textContent` or DOMPurify.
- **Translated messages (vue-i18n)** — don't render `t()`/`$t()` output with `v-html` when a message can embed untrusted data (a known i18n XSS vector); use the `<i18n-t>` component with slots for rich text (see `i18n.md`).
- **Prototype pollution** — guard `__proto__`/`constructor`/`prototype` keys in any recursive merge/clone or query-string parse; use `Object.create(null)`/`Map` and schema-validate (Zod).
- **CSTI** — never compile a runtime template from user input; prefer the runtime-only build.

## Secrets & the client bundle (A02 / CWE-200, CWE-798)
- Everything in the bundle is public. Only **`VITE_`-prefixed env vars that are safe to expose** belong in client code (`VITE_API_BASE_URL`, publishable `pk_…` keys). Real secrets stay server-side (no `VITE_` prefix), reached through an API.
- Never hardcode or commit credentials; keep `.env*.local` git-ignored. Don't put tokens/PII in URLs or query strings (they leak via `Referer`, history, logs, analytics), error messages, or client telemetry.
- Disable production source maps (`build.sourcemap: false`, or `'hidden'` for private upload to an error tracker) so original source and logic aren't shipped.
- Don't enable Vue Devtools in production (`__VUE_PROD_DEVTOOLS__`) — it exposes component state and Pinia stores to anyone.

## Tokens & session (A07 / CWE-522, A02 / CWE-922)
- Prefer session tokens in **`httpOnly` + `Secure` + `SameSite` cookies** (unreadable by JS) over `localStorage`/`sessionStorage` — Web Storage is readable by any script, so one XSS exfiltrates the session.
- Never persist tokens via a Pinia/Vuex persistence plugin, serialize them into SSR HTML, or log them. Stores hold non-sensitive profile data only.
- **CSRF (cookie sessions only) (A01 / CWE-352)** — with ambient cookies, set `SameSite=Lax/Strict` and add an anti-CSRF token (double-submit or synchronizer) in a custom request header from the `api/` layer. Bearer-token (`Authorization` header) SPAs are largely immune.

## Browser security controls (A02, A08)
- **CSP** — strict `script-src` (nonce/hash, no `unsafe-inline`/`unsafe-eval`, no wildcard hosts) plus `frame-ancestors` (clickjacking), `base-uri`, `object-src 'none'`. Account for Vite's dev-vs-prod inline scripts.
- **Subresource Integrity (A08)** — every third-party `<script>`/CDN asset gets `integrity="sha384-…"` + `crossorigin` and a pinned version, or is self-hosted/bundled. Minimize third-party scripts; each runs with full DOM access (Magecart).
- **Transport** — HTTPS for all subresources (no mixed content), `Strict-Transport-Security`, `upgrade-insecure-requests`, `Referrer-Policy`, `X-Content-Type-Options: nosniff`. Untrusted iframes get `sandbox`.
- **`:style`** — bind object syntax with vetted properties; never a raw user-supplied string (CSS injection / overlay-based clickjacking).

## Cross-window & network
- **`postMessage`** — exact-match `event.origin` against an allow-list (never `indexOf`/substring); validate the message shape; never target `'*'` for sensitive data (A01).
- **CORS** is a server control, but from the client: never send credentialed (`credentials: 'include'`) cross-origin requests to a permissive API, and flag a backend that reflects `Origin` together with `Access-Control-Allow-Credentials: true` (A02).

## Supply chain (A03)
- Question every dependency; pin versions and commit the lockfile. Run `<pm> audit`, treat known high/critical vulns as blockers, and watch transitive packages. This is automated in CI (see `ci-cd-engineer`), not an optional manual step.

## SSR / SSG
> Applies only when the project server-renders (Nuxt or a custom renderer). Skip for pure client-side SPAs.
- Vue's auto-escaping covers component templates only. Escape any interpolation into the HTML shell (`<title>`, meta, manual markup), and serialize injected state with a `</script>`-safe serializer (`devalue`/`serialize-javascript`), not raw `JSON.stringify` (A05 / CWE-79).

## Verify
- Run `<pm> audit` on any dependency change; resolve high/critical before merge.
- For every untrusted-data sink touched above, confirm the input is escaped, sanitized, or allow-listed before merge.
- The `security-scanner` agent maps findings to OWASP/CWE in the Quality Gate — but secure-by-default at authoring time is the goal, not bolted-on review.
