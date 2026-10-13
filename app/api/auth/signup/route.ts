import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { hashToken, newToken } from '@/lib/security';
import { emailLayout, sendEmail } from '@/lib/email';

function otpEmail(code: string) {
  return emailLayout('Verify your Numelixa account', `<p>Your verification code is:</p><div style="font-size:34px;font-weight:700;letter-spacing:8px;margin:24px 0">${code}</div><p>This code expires in 10 minutes.</p><p>If you did not create this account, you can ignore this email.</p>`);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!email || !password || password.length < 8) return NextResponse.json({ success: false, error: { code: 'INVALID_REQUEST', message: 'Email and password (8+ characters) are required.' } }, { status: 400 });
    if (!process.env.MONGODB_URI) return NextResponse.json({ success: false, error: { code: 'AUTH_CONFIG_ERROR', message: 'Authentication is temporarily unavailable. Please configure MONGODB_URI in Vercel.' } }, { status: 503 });
    if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') return NextResponse.json({ success: false, error: { code: 'AUTH_CONFIG_ERROR', message: 'Authentication is temporarily unavailable. Please configure JWT_SECRET in Vercel.' } }, { status: 503 });
    if (!process.env.SMTP_PASSWORD) return NextResponse.json({ success: false, error: { code: 'EMAIL_CONFIG_ERROR', message: 'Email verification is not configured yet. Please configure SMTP_PASSWORD in Vercel.' } }, { status: 503 });

    const exists = await db.user.findUnique({ where: { email } });
    if (exists) {
      if (!exists.emailVerified) return NextResponse.json({ success: false, error: { code: 'EMAIL_NOT_VERIFIED', message: 'This account already exists but is not verified. Request a new verification code.' } }, { status: 409 });
      return NextResponse.json({ success: false, error: { code: 'EMAIL_EXISTS', message: 'An account with this email already exists.' } }, { status: 409 });
    }

    const user = await db.user.create({ data: { email, name: name || null, passwordHash: await hashPassword(password), emailVerified: false } });
    try {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      await db.verificationToken.deleteMany({ where: { email } });
      await db.verificationToken.create({ data: { email, tokenHash: hashToken(code), expiresAt: new Date(Date.now() + 10 * 60 * 1000) } });
      await sendEmail(email, 'Your Numelixa verification code', otpEmail(code));
    } catch (mailError) {
      console.error('[auth/signup] verification email failed', mailError);
      await db.user.delete({ where: { id: user.id } }).catch(() => undefined);
      return NextResponse.json({ success: false, error: { code: 'EMAIL_SEND_FAILED', message: 'We could not send the verification code. Please check the email service configuration.' } }, { status: 503 });
    }

    return NextResponse.json({ success: true, requiresVerification: true, email });
  } catch (error) {
    console.error('[auth/signup] failed', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to create account. The server could not complete the database/authentication request.' } }, { status: 500 });
  }
}
