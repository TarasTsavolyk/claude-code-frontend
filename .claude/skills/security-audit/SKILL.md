---
name: security-audit
description: Review a frontend change for security issues against the OWASP Top 10:2025 — XSS/injection sinks, secret/token leakage, client-side access control, CSP/SRI, dependency vulns. The inline twin of the security-scanner agent.
---

# Security audit

Review against `.claude/rules/security.md` and the **OWASP Top 10:2025**. Map each finding to an OWASP category (and CWE where it pins the sink). Review the diff; grep the touched files for the sinks below. For a gated pipeline run, delegate to the `security-scanner` agent (isolated, read-only, can look up CVEs).

## Check
- **Injection / XSS (A05 / CWE-79)** — raw-HTML sinks fed by user/remote data without DOMPurify: `v-html`, render/JSX `innerHTML`, a directive setting `el.innerHTML`, `v-html="t(key)"` (vue-i18n), manual `innerHTML`/`outerHTML`/`insertAdjacentHTML`. `<component :is>`, dynamic `import()`, `eval`, `new Function`, string `setTimeout` from non-constant data (CWE-94/95). `v-bind="$attrs"`/object spread onto native elements. `:href`/`:src` allowing `javascript:`/`data:`. Unguarded recursive merge / query-string parse (`__proto__`). Runtime template compilation from input (CSTI).
- **Access control (A01)** — route guards / `v-if`-on-role as the security gate with no server check; open redirects from user params (CWE-601); `postMessage` without exact `origin` check, or `postMessage(…, '*')` with sensitive data.
- **Secrets & exposure (A02 / CWE-200, CWE-798)** — `VITE_`-prefixed secrets (`VITE_.*(KEY|SECRET|TOKEN|PASSWORD)`) or any `import.meta.env` value leaking to the bundle; hardcoded/committed credentials; prod `build.sourcemap` or stray `.map`; tokens/PII in URLs, errors, logs, analytics (see `config.md`, `observability.md`).
- **Tokens & session (A07 / CWE-522)** — tokens in `localStorage`/`sessionStorage` or persisted Pinia; missing `SameSite`/anti-CSRF token on cookie-session state changes (CWE-352).
- **Browser controls (A02 / A08)** — missing/weak CSP (`unsafe-inline`/`unsafe-eval`/wildcards); third-party `<script>`/CDN without SRI; no `frame-ancestors`; raw-string `:style`; mixed content.
- **Supply chain (A03)** — run `<pm> audit`; look up CVEs for newly added/updated packages.

## Output
Findings by severity, each with `file:line`, the OWASP/CWE mapping, the risk, and the remediation. Exploitable XSS, leaked secrets, and client-only access control are Critical. Don't flag an already-sanitized/allow-listed sink. Lead with the highest; if clean, say so.
