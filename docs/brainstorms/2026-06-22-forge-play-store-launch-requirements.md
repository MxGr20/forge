---
date: 2026-06-22
topic: forge-play-store-launch
---

# Forge — Public Play Store Launch

## Summary

Take Forge from a fork-per-person self-host into a single public, multi-tenant
product distributed on the Google Play Store. The store app is a Trusted Web
Activity (TWA) shell wrapping the existing hosted PWA — one codebase, one shared
deployment, one Supabase project. Users sign in with Google, their data is
isolated by Row-Level Security, and the launch clears Play's mandatory privacy
and compliance gates. Security and reliability are hardened *before* listing,
because the app holds strangers' fitness data.

---

## Problem Frame

Today Forge ships as a template: the README tells each user to fork the repo,
create their own Supabase project, paste credentials into `config.js`, and host
their own copy. That model gives perfect data isolation but is unusable for a
real audience — nobody downloads a workout app by forking a GitHub repo.

The goal is a "living application": a stranger discovers Forge, installs it from
a place they trust, signs in, and tracks workouts with their own private data,
without ever touching code. The current architecture is closer to this than it
looks — the `forge_profiles` table already enforces per-user RLS, so one
deployment can safely host many users. What's missing is the distribution shell,
a public-grade sign-in, the privacy/compliance surface Play requires, and a
security pass appropriate for public health data.

The Play Store is wanted specifically for **legitimacy** and a **frictionless
install**, less for organic discovery (a new zero-rating app ranks near-invisible
without outside marketing — see Outstanding Questions).

---

## Key Decisions

- **Single shared deployment replaces fork-per-person.** All users install one
  app pointed at one Supabase project; RLS isolates data per `user_id`. This
  retires the README's "fork and self-host" setup story and makes the repo a
  product, not a template.

- **Distribute as a TWA, not a native rewrite.** The Play Store artifact is a
  thin native shell (Bubblewrap or PWABuilder) that loads the hosted PWA
  full-screen. One PWA codebase serves both web and store. Day-to-day app updates
  ship instantly via the web host; the store package is re-submitted only when the
  native shell itself changes.

- **Google Sign-In is the primary auth.** It gives native one-tap login, avoids
  Supabase's built-in ~3–4 auth-emails/hour rate limit, and matches what public
  Android fitness users expect. Magic-link is dropped as the public path.

- **Harden before listing (Approach B).** A security and reliability pass — RLS
  audit, auth redirect/deep-link config, input hardening on the stored state,
  error monitoring, a verified custom domain — precedes the public listing rather
  than following it. Public fitness data makes this non-negotiable.

- **The anon Supabase key stays public by design.** It ships in `config.js` and
  in the bundled app; RLS, not key secrecy, is what protects data. No change
  needed, but the security model depends on RLS being airtight.

---

## Actors

- A1. **End user** — a member of the public who installs the app, signs in with
  Google, and tracks their own private workouts.
- A2. **Maintainer (you)** — deploys updates, manages the Supabase project and
  Play listing, and handles data-deletion requests.

---

## Key Flows

- F1. First-time onboarding
  - **Trigger:** A1 installs from the Play Store and opens the app.
  - **Steps:** App loads via TWA → user taps Google Sign-In → Supabase creates
    the auth user and an empty `forge_profiles` row → user lands in an empty,
    usable app and starts a workout.
  - **Outcome:** A1 has a private account; data syncs across every device where
    they sign in.
  - **Covered by:** R1, R4, R5, R6

- F2. Account and data deletion
  - **Trigger:** A1 requests deletion (in-app control and/or the public web route
    Play requires).
  - **Steps:** User confirms → app deletes their auth user, which cascades to
    their `forge_profiles` row (`on delete cascade` already in schema) → local
    cached state is cleared.
  - **Outcome:** All of A1's server-side and on-device data is gone; the action
    is irreversible and clearly stated as such.
  - **Covered by:** R9, R10

---

## Requirements

**Distribution & packaging**

- R1. The app is published to the Google Play Store as a TWA wrapping the hosted
  PWA, verified against a custom HTTPS domain via Digital Asset Links
  (`assetlinks.json`).
- R2. The PWA is hosted at a public custom domain with HTTPS (e.g. Cloudflare
  Pages or GitHub Pages with a custom domain).
- R3. Web deploys remain push-to-deploy and continue to bump the `sw.js` `CACHE`
  version per release so installed clients pick up new assets.

**Auth & accounts**

- R4. Public users authenticate with Google Sign-In via Supabase Auth.
- R5. Each authenticated user owns exactly one `forge_profiles` row, created on
  first sign-in and holding their full state as JSONB.
- R6. Signing in on a new device restores the user's data; the existing
  newer-`lastModified`-wins sync resolves local vs remote.

**Data isolation & security**

- R7. RLS restricts every read and write on `forge_profiles` to the row whose
  `user_id` equals `auth.uid()`; this is audited before launch with no public or
  cross-user access path.
- R8. No feature exposes one user's data to another. Any friends/social schema
  remains unwired and out of the public surface until explicitly scoped (see
  Scope Boundaries).
- R9. Stored state is treated as untrusted input on read — a corrupt or oversized
  profile blob cannot crash the app or affect other users.

**Privacy & compliance (Play-mandatory)**

- R10. The app provides an in-app account-and-data-deletion path plus a publicly
  reachable deletion request route, deleting both server and local data.
- R11. A published privacy policy URL describes what is collected (email/identity
  via Google, fitness/workout data) and how it is used and deleted.
- R12. The Play Data Safety form accurately declares collection of identity and
  health/fitness data and links the privacy policy.

**Reliability & operations**

- R13. The backend runs on a Supabase tier that does not auto-pause and includes
  backups (see Dependencies — this is the cost decision).
- R14. Errors in production are observable to the maintainer (e.g. a free-tier
  error monitor) rather than surfacing only as user complaints.

---

## Acceptance Examples

- AE1. **Covers R7.** Given user U1 is signed in, when U1's client requests
  profile data, then only U1's row is returned and no query path (anon or
  authenticated) can read U2's row.
- AE2. **Covers R10.** Given U1 chooses "Delete my account," when U1 confirms,
  then U1's auth user and `forge_profiles` row are removed, local cache is
  cleared, and re-opening the app returns U1 to a signed-out empty state.
- AE3. **Covers R9.** Given a `forge_profiles` blob is malformed or unexpectedly
  large, when the app loads it, then the app degrades gracefully (handles the bad
  state) instead of crashing, and no other user is affected.
- AE4. **Covers R4, R5.** Given a brand-new user taps Google Sign-In, when auth
  succeeds, then an empty profile row is created and the user reaches a usable
  empty app without manual setup.

---

## Scope Boundaries

**Deferred for later**

- Monetization, paid tiers, in-app purchases, and ads — explicitly ruled out for
  this launch; no Play billing integration.
- Friends / social data sharing — a schema exists but is not wired into live
  code; the public launch ships single-user only.
- iOS App Store distribution — the public PWA remains installable on iOS, but a
  packaged store submission is out of scope here.
- Replacing Babel-standalone runtime compilation with a build step — a known
  first-load performance wart, but not a launch blocker.

**Outside this product's identity**

- Coaching, programming marketplaces, or social-feed features — Forge stays a
  private personal workout tracker, not a social fitness network.

---

## Dependencies / Assumptions

- **Recurring cost is the open decision (see Outstanding Questions).** The
  realistic floor is Supabase Pro (~$25/mo, removes auto-pause + adds backups)
  plus a one-time $25 Play developer account and a ~$10–15/yr domain. A
  cheaper path (free Supabase kept warm by a scheduled ping) exists but sacrifices
  backups and reliability.
- The existing RLS policies in `supabase_schema.sql` are assumed correct and
  sufficient; R7 verifies this rather than assuming it.
- Google Sign-In requires a Google Cloud OAuth client configured against the
  Supabase project and the production domain.
- The single-JSONB-per-user model scales to thousands of users within the 500 MB
  free DB limit, so storage is not the near-term constraint — reliability/pausing
  is.

---

## Outstanding Questions

**Resolve before planning**

- **Hosting tier / cost.** Supabase Pro from launch, or start on free tier with a
  keep-alive and upgrade on traction? This gates R13 and the launch reliability
  posture.

**Deferred to planning**

- Custom domain choice and registrar.
- Whether to keep magic-link as a secondary auth fallback or drop it entirely.
- Exact error-monitoring tool (R14).

**Product-level, for the maintainer**

- Discovery is the weak part of the Play bet: a new zero-rating app gets little
  organic store traffic. How (if at all) will the app be marketed so the
  legitimacy the store provides actually meets an audience?

---

## Sources / Research

- `config.js` — public Supabase URL + anon key (public by design).
- `supabase_schema.sql` — `forge_profiles` table, RLS policies, `on delete
  cascade` that makes account deletion clean.
- `app.js:5930` (`sendMagicLink`), `app.js:5880` (`onAuthStateChange`),
  `app.js:5951`/`:5998` (`forge_profiles` read/write) — current auth and the only
  data path; no cross-user access in live code.
- `manifest.json`, `sw.js` — existing PWA install + offline shell the TWA wraps.
- `README.md` — the fork-per-person model this launch replaces.
