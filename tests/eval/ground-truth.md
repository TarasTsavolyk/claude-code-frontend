# Planted defects — ground truth

29 defects planted in `fixture/`. Tier 1 = unambiguous, any competent review must catch it.
Tier 2 = real but arguable, or lower severity.

## Security — owner: security-scanner
| id | file | defect | tier |
|----|------|--------|------|
| S1 | CommentThread.vue | `v-html="c.bodyHtml"` on user-submitted comment HTML → stored XSS | 1 |
| S2 | useSession.ts | auth token in `localStorage` — readable by any XSS | 1 |
| S3 | CommentThread.vue | `:href="c.author.website"` unvalidated → `javascript:` scheme | 1 |
| S4 | CommentThread.vue | `:src="c.author.avatarUrl"` unvalidated user URL | 2 |
| S5 | useSession.ts | `atob(token.split('.')[1])` — trusts JWT client-side, throws on malformed input | 2 |

## Accessibility — owner: accessibility-auditor
| id | file | defect | tier |
|----|------|--------|------|
| A1 | CommentThread.vue | `<div class="report" @click>` — not focusable, no role, no keyboard | 1 |
| A2 | CommentThread.vue | `<input>` labelled by placeholder only | 1 |
| A3 | CommentThread.vue | modal: no focus trap, no focus return, no `role="dialog"`/`aria-modal`, no Escape | 1 |
| A4 | CommentThread.vue | `#999` on `#fff` at 12px ≈ 2.85:1, below the 4.5:1 minimum | 1 |
| A5 | CommentThread.vue | `<img>` with no `alt` | 1 |

## Performance — owner: performance-auditor
| id | file | defect | tier |
|----|------|--------|------|
| P1 | CommentThread.vue | `import Chart from 'chart.js/auto'` eager at module scope — heavy lib, no lazy import | 1 |
| P2 | CommentThread.vue | `scoreOf(c)` called per row in template — recomputed every render | 1 |
| P3 | CommentThread.vue | unbounded comment list, no pagination or virtualization | 2 |
| P4 | CommentThread.vue | `sorted` re-sorts the whole array on any dependency change | 2 |

## Architecture & data-fetching — owner: ui-reviewer
| id | file | defect | tier |
|----|------|--------|------|
| R1 | CommentThread.vue | raw `fetch()` in the component instead of a composable/store | 1 |
| R2 | CommentThread.vue | only loading + success rendered — no error state, no empty state | 1 |
| R3 | CommentThread.vue | `submit()` has no pending/disabled state and ignores failure | 1 |
| R4 | CommentThread.vue | two `onMounted` calls; chart one reaches into the DOM by id | 2 |

## Error handling — owner: ui-reviewer
| id | file | defect | tier |
|----|------|--------|------|
| E1 | CommentThread.vue | `catch (e) { // TODO handle }` — swallows the failure silently | 1 |
| E2 | CommentThread.vue | `loading = false` not in `finally`; error state never set | 2 |

## Code style — owner: ui-reviewer
| id | file | defect | tier |
|----|------|--------|------|
| C1 | both | `any` throughout (`currentUser: any`, `ref<any[]>`, `(c: any)`) — banned | 1 |
| C2 | CommentThread.vue | `console.log` in committed code, logging the user object | 1 |
| C3 | CommentThread.vue | `document.getElementById` instead of `useTemplateRef` | 2 |
| C4 | CommentThread.vue | bare `TODO` with no tracking reference | 2 |

## Styling — owner: ui-reviewer
| id | file | defect | tier |
|----|------|--------|------|
| Y1 | CommentThread.vue | hardcoded hex + px instead of design tokens | 1 |
| Y2 | CommentThread.vue | no dark-mode handling; `#ffffff` dialog hardcoded | 2 |
| Y3 | CommentThread.vue | `font-family: Inter` hardcoded in a component | 2 |

## Testing — owner: test-engineer
| id | file | defect | tier |
|----|------|--------|------|
| T1 | useSession.ts | no tests for `isExpired` (real logic, boundary + malformed-token cases) | 1 |
| T2 | CommentThread.vue | no component test for the four async states or submit | 1 |

Tier 1 total: **19** · Tier 2 total: **10** · Overall: **29**

The first run of this eval shipped with the header miscounted as 18/10/28; a scorer caught it by
summing the tables. Per-section tier-1 counts: S 3 · A 5 · P 2 · R 3 · E 1 · C 2 · Y 1 · T 2 = 19.

This file is withheld from both arms during a run — keep it out of any prompt and out of any
directory an arm is pointed at.
