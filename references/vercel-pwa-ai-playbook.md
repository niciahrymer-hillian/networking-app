# AI Build Playbook — Deploy to Vercel + Add an Installable PWA "Widget"

A portable, copy-me-into-any-project guide for an AI assistant. The goal: ship a web
app to **Vercel** and make it **installable** (an app icon on the phone/desktop home
screen that opens full-screen — what people usually mean by a "PWA widget").

> **How to use this:** Paste this whole file to the AI at the start. Tell it:
> *"Read this playbook, ask me the clarifying questions in Part 0 first, then build."*
> The AI must **not** start coding until the Part 0 answers are known — most failed
> builds trace back to a skipped question here.

---

## Part 0 — Ask the user these BEFORE building

Group the questions, ask only the ones not already obvious from the repo. Stop and
confirm anything ambiguous; a wrong assumption here is what breaks the build.

### A. Project & framework
1. **What framework/version?** (Next.js App Router? Pages Router? Vite/React, SvelteKit, plain static?) PWA wiring differs per framework. If it's a customized framework, **read its bundled docs before writing config** — APIs may differ from defaults.
2. **Is it already a git repo with a remote on GitHub/GitLab?** Vercel deploys from a connected repo.
3. **What package manager / build command / output dir?** (npm/pnpm/yarn; `next build`; `dist`/`.next`.)
4. **Is there a custom build step** (DB migration/schema sync, codegen) that must run before/with the build? If yes, the Vercel build command may need to be `node scripts/x.mjs && <build>`.

### B. Deployment target
5. **New Vercel project or existing one?** If existing, what's the **exact project name** (there can be near-duplicates — confirm which one owns the production domain)?
6. **Production domain?** (`*.vercel.app` or a custom domain.)
7. **Who sets environment variables** — you (dashboard) or the AI (needs a Vercel token/CLI)? The AI usually **cannot** set Vercel env vars without `VERCEL_TOKEN` or an authenticated `vercel` CLI.
8. **Is the repo public or private?** Public repos must keep all secrets in env vars / encrypted secrets, never in committed files.

### C. Data & storage (PWAs often upload images)
9. **Does the app write files at runtime** (avatars, uploads, PDFs)? Vercel's filesystem is **ephemeral/read-only** — runtime writes vanish. If yes, you need object storage (Supabase Storage, Vercel Blob, S3, Cloudinary).
10. **Which storage provider, and who provisions it + the credentials?** (Same as Q7 — the AI can write the integration but usually can't create the external account.)
11. **What database, and where do its credentials live?** Is there a separate prod DB from local? Migrations on deploy?

### D. PWA specifics
12. **App name + short name** (short name ≤ ~12 chars, shown under the icon).
13. **Is there a logo/icon asset?** Need a square-ish mark; tiny text in a logo is illegible at icon size — prefer the symbol only. If none, agree on a generated icon (brand color + monogram/glyph).
14. **Brand colors:** `theme_color` (status/title bar) and `background_color` (splash). Often an accent + the app's background.
15. **Display mode:** `standalone` (default, app-like) vs `fullscreen`/`minimal-ui`. Orientation lock?
16. **Offline behavior:** none (live app, SW only for installability — safest default) vs cache an offline shell? Caching a logged-in/dynamic app causes stale-content bugs — default to **no caching**.
17. **Is there an auth gate / middleware** that redirects unauthenticated requests? If so, the PWA assets + any public pages **must be whitelisted** (this is the #1 silent PWA breakage — see Part 2, step 6).
18. **Install entry point:** just OS-native install, or also an in-app "Install" button + a help/FAQ page with manual steps? iOS has **no** install prompt — it always needs manual "Add to Home Screen" steps.

---

## Part 1 — Deploy to Vercel

1. **Connect the repo.** Vercel dashboard → New Project → import the GitHub repo. Pick the framework preset (or "Other" for custom).
2. **Build settings.** Confirm install command, build command, and output dir. If a pre-build step is required (DB schema sync, codegen), set the build command to run it first, e.g. `node scripts/db-sync.mjs && next build`. ⚠️ If that pre-step fails, the **whole build aborts** and the site keeps serving old code — failures can be silent. Check deploy health, don't assume.
3. **Environment variables.** Add every required var under **Production** (and Preview if used). Common: DB URL/token, session/encryption secrets, storage keys, mail keys. The app reads these at build + runtime — a missing one is a frequent cause of build failure or 500s.
4. **Deploy & verify.** First deploy runs automatically on import; later deploys trigger on push to the production branch. **Setting/changing an env var requires a redeploy** to take effect.
5. **Check deploy status from the CLI** (handy for an AI):
   ```bash
   sha=$(git rev-parse HEAD); REPO="owner/repo"
   # newest Vercel commit status (ignore older stale "pending" entries)
   gh api "repos/$REPO/commits/$sha/statuses" \
     --jq 'map(select(.context=="Vercel")) | sort_by(.created_at) | last | .state'
   ```
   Note: GitHub keeps *all* status posts, so an old `pending` can linger next to a newer `success` — always take the **most recent** one.
6. **Functional proof beats a green checkmark.** Hit a route you just changed on the live URL and confirm the new behavior (e.g. `curl` for a string only the new code emits).

### Vercel gotchas
- **Ephemeral filesystem.** Anything written to disk at runtime disappears. Use object storage (Part 3).
- **Body size limits.** Serverless request bodies cap around ~4.5 MB — large uploads need direct-to-storage.
- **Env changes need a redeploy.** They are not hot-applied.
- **The AI can't set env vars** without a Vercel token/CLI — plan a handoff to the user.

---

## Part 2 — Make it installable (PWA)

A site is installable when it has: HTTPS (Vercel gives this), a **web manifest** with
name + 192px and 512px icons + `start_url` + `display: standalone`, and (for the
install prompt on Chrome/Android/desktop) a registered **service worker with a fetch
handler**. iOS Safari needs only the manifest + an apple-touch-icon, but offers no
prompt (manual "Add to Home Screen").

### 1. Web manifest
- **Next.js App Router:** add `app/manifest.ts` exporting a `MetadataRoute.Manifest`; Next serves `/manifest.webmanifest` and injects `<link rel="manifest">` automatically.
- **Generic:** add `public/manifest.webmanifest` and link it: `<link rel="manifest" href="/manifest.webmanifest">`.
- Required-ish fields: `name`, `short_name`, `description`, `start_url:"/"`, `scope:"/"`, `display:"standalone"`, `background_color`, `theme_color`, and `icons` (see below).

### 2. Icons (the part people get wrong)
- Provide at least **192×192** and **512×512** PNGs, plus a **maskable** 512 variant with the logo inside the central ~80% "safe zone" (Android crops to a circle/squircle).
- Add an **apple-touch-icon** (180×180, **opaque** — iOS adds its own rounded corners; transparency looks broken).
- Use the **symbol** from the logo, not the full logo with a tagline — text is unreadable small.
- Generating from an existing logo (Node + `sharp`): crop the mark, then composite it centered on a brand-color square; make a higher-padding copy for `maskable`.
- Next.js auto-links `app/icon.*` and `app/apple-icon.*`; manifest `icons[]` should point at real public URLs (e.g. `/icon-192.png`).

### 3. Service worker (enables the install prompt; keep it dumb)
- Add `public/sw.js` with `install`/`activate`/`fetch` listeners. **Do not cache** for a live/auth'd app — a pass-through fetch handler satisfies installability without stale-content bugs:
  ```js
  self.addEventListener("install", () => self.skipWaiting());
  self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
  self.addEventListener("fetch", () => {}); // pass-through, no caching
  ```
- Register it from a client component, **production only**:
  ```js
  if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator)
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  ```

### 4. Head metadata
- `theme-color` (mobile browser/status bar) — Next: `export const viewport = { themeColor: "#xxxxxx" }`.
- iOS web-app meta — Next: `metadata.appleWebApp = { capable: true, title, statusBarStyle }`; generic: the `apple-mobile-web-app-*` meta tags.

### 5. Optional in-app install button + help page
- A button that listens for `beforeinstallprompt`, prevents the default mini-infobar, and calls `prompt()` on click. **Hidden on iOS** (event never fires) → fall back to manual steps.
- A `/faqs` (or `/install`) page with per-platform steps:
  - **iPhone/iPad (Safari):** Share → Add to Home Screen → Add.
  - **Android (Chrome):** tap Install / ⋮ → Install app.
  - **Desktop (Chrome/Edge):** install icon in the address bar, or ⋮ → Install.

### 6. ⚠️ Whitelist PWA assets in any auth middleware (the silent killer)
If middleware redirects unauthenticated requests to `/login`, it will also redirect
`/manifest.webmanifest`, `/sw.js`, the icon files, and your public install/FAQ page —
so installs **silently fail** (the browser fetches the manifest without a session).
Explicitly allow, before the auth check:
`/manifest.webmanifest`, `/sw.js`, `/icon-*`, `/apple-icon*`, and any public page
like `/faqs`. Test each returns **200 unauthenticated**, not a 307 to `/login`.

### 7. Verify installability
```bash
BASE="https://your-app.vercel.app"
for p in manifest.webmanifest sw.js icon-192.png icon-512.png apple-icon.png faqs; do
  echo "$(curl -s -o /dev/null -w '%{http_code}' "$BASE/$p")  /$p"   # want 200
done
curl -s "$BASE/manifest.webmanifest" | grep -o '"display":"[^"]*"'    # want "standalone"
```
Then in Chrome DevTools → **Application → Manifest** (no errors, icons load) and
**Lighthouse → PWA** (installable). On a real phone: open the URL → install → confirm
the icon launches full-screen.

---

## Part 3 — Storage for uploads (if Q9 = yes)

Vercel can't persist runtime file writes, so route uploads to object storage.

- **Pattern:** on upload, if the storage env vars are set, write to the provider and
  store the returned URL; otherwise in **production, fail loudly (HTTP 503)** rather
  than writing to disk and silently losing the file. Keep a local-disk fallback for dev only.
- **Public vs private buckets:** public bucket for headshots/cards (served via CDN URL);
  private bucket for PII (served only through an authenticated route that checks ownership and issues short-lived signed URLs).
- **Provider env vars** go in Vercel (Production) + your local env file for scripts.
- ⚠️ **Free-tier auto-pause (esp. Supabase):** free projects pause after ~7 days idle.
  A paused project's subdomain stops resolving (**NXDOMAIN — looks deleted but isn't**);
  restoring it brings back the project *and* its files. Prevent pauses with a scheduled
  keep-alive — a **GitHub Actions cron** that pings the project's backend daily:
  ```yaml
  # .github/workflows/keepalive.yml
  on: { schedule: [{ cron: "0 8 * * *" }], workflow_dispatch: {} }
  jobs:
    ping:
      runs-on: ubuntu-latest
      steps:
        - run: |
            code=$(curl -s -o /dev/null -w '%{http_code}' \
              -H "apikey: ${{ secrets.STORAGE_KEY }}" \
              "${{ secrets.STORAGE_URL }}/health-or-list-endpoint")
            [ "$code" = "200" ] || { echo "::error::keep-alive failed ($code)"; exit 1; }
  ```
  Set the secrets with `gh secret set NAME` (encrypted; safe in public repos). Never
  hardcode keys in the YAML of a public repo.

---

## One-screen checklist
- [ ] Part 0 questions answered (esp. framework, env-var owner, storage, auth middleware).
- [ ] Repo connected to Vercel; build command incl. any pre-step; env vars set (Production).
- [ ] Manifest with name + 192/512 + maskable icons + apple-touch-icon; `display:standalone`.
- [ ] Service worker registered (prod only), no caching.
- [ ] theme-color + apple web-app meta in `<head>`.
- [ ] Auth middleware whitelists manifest, sw.js, icons, and public/install pages.
- [ ] Uploads go to object storage; prod fails loudly if unconfigured.
- [ ] (If free-tier storage) scheduled keep-alive cron in place.
- [ ] Verified live: PWA assets 200 unauthenticated; DevTools Manifest clean; installs on a real device.
