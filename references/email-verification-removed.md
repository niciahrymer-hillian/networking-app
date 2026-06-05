# Email Verification — Removed Code (kept for later)

**Date removed:** 2026-06-05
**Why:** For the MVP we no longer require users to verify their email *before* signing
in. Accounts are created and usable immediately, and signup auto-signs the user in.

**What was intentionally KEPT in place (still works, just unused as a hard gate):**
- `/verify-email` page + `/verify-email/[token]` page
- API routes: `app/api/auth/verify-email`, `app/api/auth/send-code`, `app/api/auth/verify-code`
- `lib/mail.ts` (`sendVerificationEmail`)
- Prisma `User` fields: `emailVerified`, `emailVerificationToken`, `emailVerificationExpiry`
- Admin panel still displays verified/unverified status

So re-enabling verification only means restoring the three deleted snippets below —
no schema migration or route re-creation needed.

---

## 1. Login gate — `app/api/auth/login/route.ts`

Removed the block that rejected unverified users (sat right after the password check,
before `session.isLoggedIn = true;`):

```ts
    if (!user.emailVerified) {
      return NextResponse.json(
        { error: "Please verify your email before signing in." },
        { status: 403 }
      );
    }
```

The header comment also changed from
`// WHY: Users must verify their email before signing in. Login uses username or email.`
to the MVP wording. **To restore enforcement, paste this block back** between the
`if (!valid)` check and `session.isLoggedIn = true;`.

> ⚠️ Note: users created while verification was disabled have `emailVerified: false`.
> Restoring this gate will lock them out until they verify (via the `send-code` /
> `verify-code` routes), so plan a backfill or grace path if you re-enable it.

---

## 2. Signup token generation + verification email — `app/api/auth/signup/route.ts`

**Removed the 6-digit token generation** (was after `const passwordHash = ...`):

```ts
  // Generate a 6-digit numeric code for verification
  const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
  const verificationExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
```

**Removed these two fields from the `prisma.user.create` data** (kept `emailVerified: false`):

```ts
      emailVerificationToken: verificationToken,
      emailVerificationExpiry: verificationExpiry,
```

**Removed the verification email send + original response** (this whole tail was
replaced by the session-creation block that signs the new user in):

```ts
  // Send verification email (optional in dev if SENDGRID_API_KEY missing)
  try {
    const { sendVerificationEmail } = await import('@/lib/mail');
    await sendVerificationEmail(normalizedEmail, verificationToken);
  } catch (err) {
    // swallow — user can request code again from verify page
    console.error('Failed to send verification email during signup', err);
  }

  return NextResponse.json({ ok: true, email: normalizedEmail }, { status: 201 });
```

> To restore the "verify before sign-in" signup flow, put these three pieces back
> and remove the auto sign-in (`getIronSession` / `session.save()`) block that
> replaced the final `return`. You'd also revert the signup *page* (section 3).

---

## 3. Signup page "Verify your email" screen — `app/signup/page.tsx`

**Removed state:**

```ts
  const [verificationUrl, setVerificationUrl] = useState("");
  const [submittedEmail, setSubmittedEmail] = useState("");
```

**Removed `handleSubmit` success branch** (replaced by a redirect to `/dashboard`):

```ts
    const data = await res.json();
    if (res.ok && data.verificationUrl) {
      setVerificationUrl(data.verificationUrl);
      setSubmittedEmail(email.trim().toLowerCase());
      setLoading(false);
      return;
    }

    setError(data.error ?? "Sign up failed.");
    setLoading(false);
```

**Removed the verification screen JSX** (rendered when `verificationUrl` was set):

```tsx
  if (verificationUrl) {
    return (
      <main className="min-h-screen bg-[#0f0f1a] flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-4xl mb-3">📧</div>
          <h1 className="text-2xl font-bold text-white mb-2">Verify your email</h1>
          <p className="text-white/60 mb-6">
            A verification link is ready for {submittedEmail}. Open the link below to complete signup.
          </p>

          <Link
            href={verificationUrl}
            className="block w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Verify email now
          </Link>

          <p className="text-white/50 text-sm mt-4">
            If your mail service isn't configured, use this link directly.
          </p>
        </div>
      </main>
    );
  }
```

> Heads-up: this screen depended on the API returning `data.verificationUrl`, which
> the signup route never actually sent — so even before removal it fell through to
> "Sign up failed." If you restore it, also make the signup API return a
> `verificationUrl` (build it with `getAppUrl()` + `/verify-email/[token]`).
