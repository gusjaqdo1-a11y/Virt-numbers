import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signSession } from '@/lib/auth';
import { hashToken } from '@/lib/security';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    if (!email || !/^\d{6}$/.test(code)) return NextResponse.json({ success: false, error: { code: 'INVALID_REQUEST', message: 'Enter the 6-digit verification code.' } }, { status: 400 });
    if (!process.env.MONGODB_URI) return NextResponse.json({ success: false, error: { code: 'AUTH_CONFIG_ERROR', message: 'MONGODB_URI is not configured.' } }, { status: 503 });

    const token = await db.verificationToken.findFirst({ where: { email, tokenHash: hashToken(code), usedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' } });
    if (!token) return NextResponse.json({ success: false, error: { code: 'INVALID_OTP', message: 'That code is invalid or expired. Request a new code.' } }, { status: 400 });

    const user = await db.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'Account not found.' } }, { status: 404 });
    if (user.suspended) return NextResponse.json({ success: false, error: { code: 'SUSPENDED', message: 'This account is suspended.' } }, { status: 403 });

    await db.verificationToken.update({ where: { id: token.id }, data: { usedAt: new Date() } });
    await db.user.update({ where: { id: user.id }, data: { emailVerified: true } });
    const session = await signSession(user.id);
    const res = NextResponse.json({ success: true });
    res.cookies.set('numelixa_session', session, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' });
    return res;
  } catch (error) {
    console.error('[auth/verify-email] failed', error);
    return NextResponse.json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Unable to verify the account right now.' } }, { status: 500 });
  }
}
