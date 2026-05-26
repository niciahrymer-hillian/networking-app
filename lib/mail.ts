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
