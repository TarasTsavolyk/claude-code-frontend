---
name: security-audit
description: Review a frontend change for security issues against the OWASP Top 10:2025 — XSS/injection sinks, secret/token leakage, client-side access control, CSP/SRI, dependency vulns.
---

# Security audit

The sink catalog lives in `rules/security.md` — read it first; this skill adds the procedure and the OWASP/CWE mapping. For a gated pipeline run, delegate to the `security-scanner` agent instead (isolated, read-only, can look up CVEs).

1. **Review the diff; grep the touched files** for every sink the rule catalogs — raw-HTML sinks, dynamic execution (`:is`, `eval`-family), `$attrs`/object spread, unchecked `:href`/`:src` schemes, raw `:style`, `postMessage`, token storage, prototype-pollution vectors, SSR serialization.
2. **Secrets** — `grep -E 'VITE_.*(KEY|SECRET|TOKEN|PASSWORD)'` and `import.meta.env` reads that leak into the bundle; check sourcemap/devtools flags.
3. **Supply chain** — on any dependency change run `<pm> audit`; treat high/critical as blockers.
4. **Map and report** — findings by severity, each with `file:line`, the OWASP Top 10:2025 category (A01 access control · A02 misconfiguration/browser controls · A03 supply chain · A05 injection/XSS · A07 auth/session) and the CWE that pins the sink (79 XSS · 94/95 code injection · 601 open redirect · 200/798 secret exposure · 522 token storage · 352 CSRF), the risk, and the remediation. Exploitable XSS, leaked secrets, and client-only access control are Critical. Don't flag an already-sanitized/allow-listed sink. Lead with the highest; if clean, say so.
