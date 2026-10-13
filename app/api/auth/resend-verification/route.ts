import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashToken } from '@/lib/security';
import { emailLayout, sendEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email) return NextResponse.json({ success: false, error: { code: 'INVALID_REQUEST', message: 'Email is required.' } }, { status: 400 });
    if (!process.env.MONGODB_URI || !process.env.SMTP_PASSWORD) return NextResponse.json({ success: false, error: { code: 'EMAIL_CONFIG_ERROR', message: 'Email verification is not configured on the server.' } }, { status: 503 });

    const user = await db.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'Account not found.' } }, { status: 404 });
    if (user.emailVerified) return NextResponse.json({ success: false, error: { code: 'ALREADY_VERIFIED', message: 'This email is already verified.' } }, { status: 409 });

    const code = String(Math.floor(100000 + Math.random() * 900000));
    await db.verificationToken.deleteMany({ where: { email } });
    await db.verificationToken.create({ data: { email, tokenHash: hashToken(code), expiresAt: new Date(Date.now() + 10 * 60 * 1000) } });
    await sendEmail(email, 'Your new Numelixa verification code', emailLayout('Your new verification code', `<p>Your Numelixa verification code is:</p><div style="font-size:34px;font-weight:700;letter-spacing:8px;margin:24px 0">${code}</div><p>This code expires in 10 minutes.</p>`));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[auth/resend-verification] failed', error);
    return NextResponse.json({ success: false, error: { code: 'EMAIL_SEND_FAILED', message: 'Unable to send a new verification code.' } }, { status: 503 });
  }
}
