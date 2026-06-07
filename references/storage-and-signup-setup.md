# Production storage + signup setup

## Why uploads vanish on Vercel without this

Vercel's filesystem is **ephemeral and read-only** outside `/tmp`. The upload routes
([api/upload](../app/api/upload/route.ts), [api/private-upload](../app/api/private-upload/route.ts))
only persist files when **Supabase Storage** is configured; otherwise they used to fall
back to local disk, where the file is gone by the next request (so headshots and
business-card PDFs never show, even after re-uploading).

As of this change, the routes **fail loudly with a 503** in production when Supabase
isn't configured, instead of silently losing the file.

## One-time Supabase setup

1. **Create / open a Supabase project** at https://supabase.com (free tier is fine).
2. **Create two Storage buckets** (Storage → New bucket):
   - **`uploads`** — toggle **Public** ON. (Headshots + business-card PDFs; served via public CDN URL.)
   - **`private-uploads`** — leave **Public** OFF. (Scanned connection card photos — PII; served only through the authenticated [api/private-files](../app/api/private-files/[filename]/route.ts) route.)
3. **Grab credentials** (Project Settings → API):
   - `Project URL` → use as **`SUPABASE_URL`**
   - `service_role` secret key → use as **`SUPABASE_SERVICE_ROLE_KEY`** (server-only; never expose client-side)

## Vercel environment variables

Vercel → project `networking-app-y3gq` → Settings → Environment Variables (Production):

| Name | Value |
|---|---|
| `SUPABASE_URL` | the Project URL from step 3 |
| `SUPABASE_SERVICE_ROLE_KEY` | the service_role secret from step 3 |

Then **redeploy** (Deployments → ⋯ → Redeploy, or push a commit). After redeploy,
uploading a headshot/PDF stores it in Supabase and it persists across deploys.

### Quick verification
- Edit a profile, upload a headshot, save → the image URL should be a `…supabase.co/…` URL.
- Re-load the public card → photo and business card render and survive future deploys.

## Signup

Signup is now **open by default** in production (it previously required `ALLOW_SIGNUP=true`).
To close it later, set **`DISABLE_SIGNUP=true`** in the Vercel env (kill-switch).

## Existing env vars (for reference)
Production also needs: `SESSION_SECRET`, `ENCRYPTION_KEY`, `TURSO_DATABASE_URL`,
`TURSO_AUTH_TOKEN` (already set, since auth + DB work). Email (optional):
`SENDGRID_API_KEY`, `EMAIL_FROM`.
