// Sends a password-reset email via Resend (https://resend.com).
// WHY: The forgot-password flow needs to deliver the reset link by email.
//      Uses Resend's test sender (onboarding@resend.dev) until a custom domain
//      is verified — set EMAIL_FROM once you have one.
// NOTE: With the test sender, Resend only delivers to the email you signed up
//       to Resend with, until you verify a sending domain.
export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Networking Cards <onboarding@resend.dev>";

  const subject = "Reset your Networking Cards password";
  const text = `Reset your password (link expires in 1 hour): ${resetUrl}`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:8px">
    <h2 style="color:#059669;margin:0 0 12px">Reset your password</h2>
    <p style="color:#0f172a;line-height:1.5">We got a request to reset your Networking Cards password. Tap the button below — it expires in <strong>1 hour</strong>.</p>
    <p style="margin:20px 0"><a href="${resetUrl}" style="display:inline-block;background:#059669;color:#fff;padding:12px 22px;border-radius:12px;text-decoration:none;font-weight:600">Reset password</a></p>
    <p style="color:#64748b;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
    <p style="color:#94a3b8;font-size:12px;word-break:break-all">${resetUrl}</p>
  </div>`;

  if (!apiKey) {
    // Dev fallback — log instead of sending so local flows still work.
    console.log(`[mail] password reset to=${to} url=${resetUrl} (RESEND_API_KEY missing)`);
    return { ok: true, info: "logged" };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, text, html }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[mail] sendPasswordResetEmail failed", res.status, body);
    throw new Error("Failed to send reset email");
  }

  return { ok: true };
}

export async function sendVerificationEmail(to: string, code: string) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.EMAIL_FROM || 'no-reply@localhost';

  const subject = 'Your verification code';
  const text = `Your verification code is: ${code}`;
  const html = `<p>Your verification code is: <strong>${code}</strong></p>`;

  if (!apiKey) {
    // Development fallback — log and pretend to send
    console.log(`[mail] sendVerificationEmail to=${to} code=${code} (SENDGRID_API_KEY missing)`);
    return { ok: true, info: 'logged' };
  }

  const payload = {
    personalizations: [
      { to: [{ email: to }] }
    ],
    from: { email: from },
    subject,
    content: [
      { type: 'text/plain', value: text },
      { type: 'text/html', value: html }
    ]
  };

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[mail] sendVerificationEmail failed', res.status, body);
    throw new Error('Failed to send verification email');
  }

  return { ok: true };
}
