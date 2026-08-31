# Security & Privacy Audit — Live Next.js App
> Last reviewed: task-149 — 31-07-2026

**Status:** Findings, owner-triaged. Documentation of the current posture — not a task generator.

**Scope:** The live app CliffCheck runs on cliffcheck.com — Next.js 16 App Router + React 19 + TypeScript on Vercel. This audit covers the shipped architecture. The superseded v0.x single-file `index.html` build (React-in-Babel + TinyBase + CDN scripts on GitHub Pages) is dead code, kept only for reference, and is out of scope. The repo is private (proprietary, closed source).

**Bottom line:** **Zero P0 findings.** The "local-first privacy" claim — central to the Technical Sophistication score and linked from the README — is defensible against the live code: every financial input stays on the device, and the only server route carries contact-form text the user types on purpose.

---

## Headline result

| Lens | Status |
|---|---|
| Financial inputs leave the device? | ✅ No — React state + URL hash only, never transmitted |
| Persistent storage of financial data | ✅ None — no `localStorage`, `sessionStorage`, cookies, or store |
| Server routes | ✅ One (`app/api/contact`) — contact-form text only, no calculator data |
| Third-party scripts / CDN loads | ✅ None — Next bundles everything; system fonts, no web-font fetch |
| Analytics privacy | ✅ Cookieless, no PII, no scenario values (Vercel Web Analytics + Speed Insights) |
| Secret exposure (files + git history) | ✅ Clean — keys are env vars, `.gitignore` covers `.env*` |
| XSS sinks (DOM injection, eval) | ✅ Clean — all rendering through escaped React JSX |
| Demo persona PII | ✅ Clean — no real names, no PII |

---

## Detailed findings

### 1. Local-first privacy — the calculator → ✅ CLEAN (the headline claim)

The benefit math is a pure, framework-free TypeScript engine (`lib/engine/*`) that runs entirely in the browser. There is no cloud calculation and no account system.

- **Where the profile lives:** the calculator's inputs (state, family size, adult count, current/offered income, benefit-toggle flags, lever inputs) live in React state (`useReducer`) for the duration of the page. Nothing is persisted.
- **Sharing:** the only way a profile leaves React memory is the share-a-scenario URL hash — encoded/parsed through `lib/profile-url.ts` (clamped + validated). The hash stays in the user's own URL; it is transport for a copy-paste share link, not a server call.
- **No storage APIs:** a repo grep confirms zero `localStorage` / `sessionStorage` / cookie / store writes anywhere under `app/`, `components/`, or `lib/` (the only historical matches are in the dead `index.html`). Financial inputs are never written to disk.
- **Verdict:** the README's "your data never leaves your phone" is accurate for all calculator activity. The network tab shows no request carrying income, family, or benefit values.

### 2. The one server route — `app/api/contact` → ✅ CLEAN (and separate from the calculator)

`POST /api/contact` (Node runtime) is the sole server-side code path. It backs the footer "get in touch" form (`components/chrome/ContactModal.tsx` → `fetch("/api/contact")`).

- **What it carries:** only what the user types into the contact form — name, email, optional org, message (each length-capped). **No calculator/financial data is included, referenced, or accessible from this route.**
- **What it does:** relays that message via Resend (email API) to the project inbox. The Resend key is read from `process.env.RESEND_API_KEY`; the to/from addresses from env with safe fallbacks. No key is committed.
- **Verdict:** this is an explicit, opt-in contact channel, fully decoupled from the privacy-sensitive calculator. It does not weaken the local-first claim.

### 3. Analytics — Vercel Web Analytics + Speed Insights → ✅ CLEAN (no PII, no scenario values)

`app/layout.tsx` mounts `@vercel/analytics` and `@vercel/speed-insights` (AD-1). These are cookieless and collect no PII.

- **What they see:** pathname + aggregate engagement and Core Web Vitals. First-party (served under the site's own `/_vercel/*` path), no third-party ad/tracking network.
- **What they never see:** the URL-hash scenario values or any financial input — analytics tracks the route, not the query/hash payload.
- **Verdict:** consistent with the privacy posture. The only nuance to the README's "network tab is clean" wording: there are first-party, cookieless analytics beacons, but they carry no financial data.

### 4. No third-party CDN scripts → ✅ CLEAN (old SRI gap obsolete)

The v0.x build loaded React, Babel, Tailwind, Chart.js, and TinyBase from `unpkg` / `jsdelivr` / `esm.sh` at runtime, so an SRI (subresource-integrity) gap was a real finding. The Next.js app bundles all of that at build time and ships system fonts only (no Google Fonts fetch). There are no runtime `<script src>` loads from external hosts, so **SRI no longer applies** — there is no external script to pin.

### 5. Secrets, XSS, PII → ✅ CLEAN

- **Secrets:** the only credentials are server env vars (`RESEND_API_KEY`, `CONTACT_TO`, `CONTACT_FROM`); `.gitignore` covers `.env*`. Files + git history are free of committed keys.
- **XSS:** no `dangerouslySetInnerHTML` on user input, no `eval` / `new Function` / `document.write`. All rendering goes through escaped JSX; JSON-LD is emitted from typed, code-controlled data.
- **PII:** demo scenarios use generic, non-identifying descriptions (e.g. an Ohio household of 4, $44k → $70k). No real names.

---

## Defence-in-depth (optional, not blocking)

- **CSP (Content-Security-Policy):** not currently set via Vercel response headers. With no XSS sink (finding 5) there is no payload to constrain, so this is belt-and-braces. If added later, a Next `headers()` / `vercel.ts` CSP is the clean route; it needs an allowance for the first-party `/_vercel` analytics beacons. Low priority.

## Owner decision

No P0/P1 holes. The local-first privacy claim is verifiable against the live code. CSP remains an optional post-hoc hardening item; capture as a backlog idea only if desired.
